import os
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification, 
    Trainer, 
    TrainingArguments
)
from app.sentiment import clean_and_tokenize

# ----------------------------------------------------
# 2. ĐỌC DỮ LIỆU & CHIA TẬP STRATIFIED
# ----------------------------------------------------
data_path = "data/reviews.csv"
df = pd.read_csv(data_path)

label_mapping = {"negative": 0, "positive": 1}
df["label_id"] = df["label"].map(label_mapping)

print("Đang tiền xử lý văn bản...")
df["cleaned_text"] = df["text"].apply(clean_and_tokenize)

# Chia Train: 70% (284 dòng), Temp: 30% (122 dòng)
train_df, temp_df = train_test_split(
    df, test_size=0.30, random_state=42, stratify=df["label_id"]
)

# Chia Temp thành Val (15% ~ 61 dòng) và Test (15% ~ 61 dòng)
val_df, test_df = train_test_split(
    temp_df, test_size=0.50, random_state=42, stratify=temp_df["label_id"]
)

print(f"Số lượng: Train={len(train_df)} | Val={len(val_df)} | Test={len(test_df)}")

# Tính trọng số class để khắc phục tình trạng lệch nhãn 273 : 133
num_neg = (train_df["label_id"] == 0).sum()
num_pos = (train_df["label_id"] == 1).sum()
total = len(train_df)
class_weights = torch.tensor([total / (2.0 * num_neg), total / (2.0 * num_pos)], dtype=torch.float)
print(f"Trọng số loss (Class Weights): Negative={class_weights[0]:.2f}, Positive={class_weights[1]:.2f}")

# ----------------------------------------------------
# 3. MÃ HÓA BẰNG PHOBERT TOKENIZER
# ----------------------------------------------------
MODEL_NAME = "vinai/phobert-base-v2"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)

train_encodings = tokenizer(train_df["cleaned_text"].tolist(), truncation=True, padding=True, max_length=128)
val_encodings = tokenizer(val_df["cleaned_text"].tolist(), truncation=True, padding=True, max_length=128)
test_encodings = tokenizer(test_df["cleaned_text"].tolist(), truncation=True, padding=True, max_length=128)

class ReviewDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

train_dataset = ReviewDataset(train_encodings, train_df["label_id"].tolist())
val_dataset = ReviewDataset(val_encodings, val_df["label_id"].tolist())
test_dataset = ReviewDataset(test_encodings, test_df["label_id"].tolist())

# ----------------------------------------------------
# 4. TÙY BIẾN TRAINER ĐỂ ÁP DỤNG TRỌNG SỐ LOSS
# ----------------------------------------------------
class WeightedTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits = outputs.logits
        loss_fn = nn.CrossEntropyLoss(weight=class_weights.to(model.device))
        loss = loss_fn(logits, labels)
        return (loss, outputs) if return_outputs else loss

def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average="macro")
    acc = accuracy_score(labels, preds)
    return {"accuracy": acc, "macro_f1": f1, "precision": precision, "recall": recall}

# ----------------------------------------------------
# 5. HUẤN LUYỆN
# ----------------------------------------------------
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)

training_args = TrainingArguments(
    output_dir="./results_phobert",
    num_train_epochs=5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    learning_rate=2e-5,
    warmup_steps=30,
    weight_decay=0.01,
    logging_steps=10,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="macro_f1",
    save_total_limit=1,
    report_to="none"
)

trainer = WeightedTrainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    compute_metrics=compute_metrics
)

print("\n--- BẮT ĐẦU HUẤN LUYỆN ---")
trainer.train()

# ----------------------------------------------------
# 6. ĐÁNH GIÁ TRÊN TẬP TEST ĐỘC LẬP
# ----------------------------------------------------
print("\n--- KẾT QUẢ ĐÁNH GIÁ TRÊN TẬP TEST (61 MẪU) ---")
test_preds = trainer.predict(test_dataset)
pred_labels = np.argmax(test_preds.predictions, axis=-1)

print(classification_report(
    test_df["label_id"].tolist(), 
    pred_labels, 
    target_names=["negative", "positive"],
    digits=4
))

# Lưu model đã train
SAVE_DIR = "./saved_phobert_fashion"
model.save_pretrained(SAVE_DIR)
tokenizer.save_pretrained(SAVE_DIR)
print(f"Đã lưu mô hình tối ưu vào: {SAVE_DIR}")
