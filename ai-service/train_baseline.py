"""Mô hình cơ sở A: TF-IDF (1-2 gram) + Logistic Regression / Linear SVM (mục 7.3).

Đọc data/reviews.csv (cột text, label, product_id). Chia 70/15/15, phân tầng theo nhãn
VÀ chia theo sản phẩm (cùng một sản phẩm không xuất hiện ở hai tập khác nhau).
Chạy: python train_baseline.py
"""
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

from preprocess import normalize

SEED = 42  # cố định để lặp lại được

df = pd.read_csv("data/reviews.csv", dtype={"product_id": str})
df["clean"] = df["text"].map(normalize)
df = df[df["clean"].str.len() > 0].drop_duplicates(subset="clean").reset_index(drop=True)
print(df["label"].value_counts(), "\n")


def carve(frame, n_splits):
    """Tách ~1/n_splits dòng (theo nhóm sản phẩm, phân tầng theo nhãn) làm tập nhỏ."""
    sgkf = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=SEED)
    rest_idx, small_idx = next(sgkf.split(frame, frame["label"], groups=frame["product_id"]))
    return frame.iloc[rest_idx], frame.iloc[small_idx]


rest, test = carve(df, 7)      # ~14% kiểm thử
train, val = carve(rest, 6)    # ~14% kiểm định, còn lại ~72% huấn luyện
print(f"train={len(train)}  val={len(val)}  test={len(test)}")
for name, part in [("train", train), ("val", val), ("test", test)]:
    print(f"  {name}: {part['label'].value_counts().to_dict()}")
print()


def make(clf):
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)),
        ("clf", clf),
    ])


candidates = {
    "logreg": make(LogisticRegression(max_iter=1000, class_weight="balanced")),
    "linear_svm": make(LinearSVC(class_weight="balanced")),
}

best_name, best_f1 = None, -1
for name, model in candidates.items():
    model.fit(train["clean"], train["label"])
    f1 = f1_score(val["label"], model.predict(val["clean"]), average="macro")
    print(f"{name}: F1 macro (kiểm định) = {f1:.4f}")
    if f1 > best_f1:
        best_name, best_f1 = name, f1

# Tập kiểm thử chỉ dùng MỘT lần sau khi đã chọn mô hình
model = candidates[best_name]
pred = model.predict(test["clean"])
print(f"\nMô hình chọn: {best_name}")
print(classification_report(test["label"], pred, digits=4))
print(confusion_matrix(test["label"], pred, labels=sorted(df["label"].unique())))

joblib.dump({"model": model, "version": f"tfidf-{best_name}-v1"}, "models/baseline.joblib")
print("Đã lưu models/baseline.joblib")
