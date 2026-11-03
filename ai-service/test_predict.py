import torch
import re
from pyvi import ViTokenizer
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_PATH = "./saved_phobert_fashion"

# Tải mô hình và tokenizer đã lưu
print("Đang nạp mô hình...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

# Bộ từ điển chuẩn hóa như lúc train
TEENCODE_DICT = {
    "k": "không", "ko": "không", "kh": "không", "khum": "không", "kg": "không",
    "mik": "mình", "mk": "mình", "tui": "tôi", "mh": "mình",
    "đc": "được", "dk": "được", "dc": "được",
    "sp": "sản phẩm", "sop": "shop", "sóp": "shop",
    "fom": "phom dáng", "from": "phom dáng", "form": "phom dáng",
    "z": "vậy", "v": "vậy", "cx": "cũng", "cxg": "cũng",
    "mn": "mọi người", "mng": "mọi người",
    "okela": "tốt", "oki": "tốt", "okie": "tốt", "okia": "tốt", "ok": "tốt",
    "xinh xỉu": "rất đẹp", "xinh điên": "rất đẹp", "dịu keo": "rất đẹp"
}

def clean_and_tokenize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    text = re.sub(r"(\d+)\s*cá\b", r"\1 nghìn", text)
    text = re.sub(r"(\d+)\s*k\b", r"\1 nghìn", text)
    text = re.sub(r"[^\w\s.,!?]", " ", text)
    words = text.split()
    words = [TEENCODE_DICT.get(w, w) for w in words]
    text = " ".join(words)
    text = re.sub(r"\s+", " ", text).strip()
    return ViTokenizer.tokenize(text)

def predict(text: str):
    cleaned = clean_and_tokenize(text)
    inputs = tokenizer(cleaned, return_tensors="pt", truncation=True, max_length=128)
    
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        pred_id = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][pred_id].item()

    label_map = {0: "NEGATIVE", 1: "POSITIVE"}
    return label_map[pred_id], confidence

# Thử nghiệm các câu hóc búa
samples = [
    "Áo xinh xỉu mang tôn dáng lắm, săn sale có 83 cá mà ưng cái bụng",
    "Vải mát nhưng form áo quá rộng, mặc như bao bố",
    "Không bị phai màu hay xù lông nha mn, rất đáng tiền",
    "Giao sai mẫu áo, nhắn tin shop không thèm trả lời",
    "Sản phẩm bình thường, đường may còn nhiều chỉ thừa",
    "cảm ơn shop đã bán chúc bn bán hàng tốt trên onl nhé 🤭"
]

print("\n--- KẾT QUẢ DỰ ĐOÁN ---")
for s in samples:
    lbl, conf = predict(s)
    print(f"[{lbl}] ({conf*100:.1f}%): {s}")