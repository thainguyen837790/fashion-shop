"""Chuyển file cào từ Tiki thành dữ liệu huấn luyện + tập cần gán nhãn tay.

Đầu vào : data/clothing_reviews_tiki.csv  (có thể gồm nhiều đoạn, mỗi đoạn một tiêu đề cột)
Đầu ra  : data/reviews.csv         - tập huấn luyện (text, label, product_id, rating, source)
          data/gold_to_label.csv   - tập vàng cần BẠN tự gán nhãn tay (cột label để trống)

Chạy: python prepare_data.py [đường_dẫn_file_csv]
"""
import re
import sys

import pandas as pd

from data_loader import load_messy
from preprocess import normalize

SEED = 42
MIN_WORDS = 2            # bỏ bình luận quá ngắn như "Good"
GOLD_EXTRA_POS = 30      # lấy thêm từ 4-5 sao vào tập vàng (để tập vàng có đủ lớp tích cực)
GOLD_EXTRA_NEG = 30      # lấy thêm từ 1-2 sao vào tập vàng
# Từ chỉ sản phẩm KHÔNG phải quần áo (kết quả tìm kiếm Tiki đôi khi trả sai loại)
NON_CLOTHING = re.compile(
    r"\bnồi\b|cơm|\bsách\b|truyện|xay tiêu|chảo|tefal|điện thoại|sạc |tai nghe|dầu gội|máy xay|máy giặt",
    re.IGNORECASE)

path = sys.argv[1] if len(sys.argv) > 1 else "data/clothing_reviews_tiki.csv"
df, orphans, log = load_messy(path)
print(f"Đọc được {len(df)} bình luận có sao, {len(orphans)} dòng không có sao, "
      f"{log['rescued']} dòng được cứu lỗi dấu phẩy, {log['broken']} dòng hỏng bỏ qua")

def clean_text(s):
    return re.sub(r"\s+", " ", str(s)).strip()

df["text"] = df["comment"].fillna("").map(clean_text)
df = df[df["text"] != ""]

# 1. Loại sản phẩm không phải quần áo
df["non"] = df["text"].map(lambda s: bool(NON_CLOTHING.search(s)))
g = df.groupby("product_id")["non"].agg(["sum", "size"])
bad_products = g[(g["sum"] >= 2) | (g["sum"] / g["size"] >= 0.5)].index
print(f"Loại {len(bad_products)} sản phẩm không phải quần áo: {list(bad_products)} "
      f"({int(df['product_id'].isin(bad_products).sum())} dòng)")
df = df[~df["product_id"].isin(bad_products)]

# 2. Chuẩn hóa, bỏ ngắn, bỏ trùng (trùng giữa các đoạn cũng bị loại)
df["clean"] = df["text"].map(normalize)
df = df[df["clean"].str.split().str.len() >= MIN_WORDS]
n0 = len(df)
df = df.drop_duplicates(subset="clean")
print(f"Bỏ {n0 - len(df)} dòng trùng; còn {len(df)} dòng")

# 3. Dòng không có sao -> nguồn cho tập vàng
orph = pd.DataFrame({"text": [clean_text(o) for o in orphans]})
orph["clean"] = orph["text"].map(normalize)
orph = orph[orph["clean"].str.split().str.len() >= MIN_WORDS]
orph = orph[~orph["clean"].isin(set(df["clean"]))].drop_duplicates(subset="clean")
orph["source"], orph["product_id"], orph["rating"] = "no_rating", "", ""

print("\nPhân bố số sao (sau làm sạch):")
print(df["rating"].value_counts().sort_index().to_string())

# 4. Tập vàng = dòng không sao + toàn bộ 3 sao + mẫu bổ sung từ 1-2 sao và 4-5 sao
three = df[df["rating"] == 3].copy(); three["source"] = "3_star"
neg_pool = df[df["rating"] <= 2]
pos_pool = df[df["rating"] >= 4]
extra_neg = neg_pool.sample(n=min(GOLD_EXTRA_NEG, len(neg_pool)), random_state=SEED).copy()
extra_pos = pos_pool.sample(n=min(GOLD_EXTRA_POS, len(pos_pool)), random_state=SEED).copy()
extra_neg["source"] = extra_pos["source"] = "sampled"
gold = pd.concat([orph, three, extra_neg, extra_pos], ignore_index=True)
gold = gold.sample(frac=1, random_state=SEED).reset_index(drop=True)
gold_out = pd.DataFrame({
    "id": range(1, len(gold) + 1),
    "source": gold["source"],
    "product_id": gold["product_id"],
    "rating": gold["rating"],          # chỉ để tham khảo, KHÔNG gán nhãn theo sao
    "text": gold["text"],
    "label": "",                        # bạn điền: positive / negative / skip
})
gold_out.to_csv("data/gold_to_label.csv", index=False, encoding="utf-8-sig")
print(f"\nĐã lưu data/gold_to_label.csv ({len(gold_out)} dòng) - hãy tự điền cột label")

# 5. Tập huấn luyện: bỏ các dòng đã vào tập vàng và bỏ 3 sao
used = set(extra_neg["clean"]) | set(extra_pos["clean"])
train = df[(df["rating"] != 3) & (~df["clean"].isin(used))].copy()
train["label"] = train["rating"].map(lambda r: "negative" if r <= 2 else "positive")
train["source"] = train["segment"].map(lambda s: f"segment_{s}")
train = train[["text", "label", "product_id", "rating", "source"]]
train.to_csv("data/reviews.csv", index=False, encoding="utf-8-sig")

print(f"\nĐã lưu data/reviews.csv ({len(train)} dòng)")
print(train["label"].value_counts().to_string())
neg_share = (train["label"] == "negative").mean()
print(f"Số sản phẩm khác nhau: {train['product_id'].nunique()}")
if neg_share < 0.15 or neg_share > 0.85:
    print(f"CẢNH BÁO: lệch lớp mạnh (tiêu cực {neg_share:.0%}).")
if len(train) < 1000:
    print(f"LƯU Ý: chỉ có {len(train)} dòng huấn luyện, khá ít cho PhoBERT; nên cào thêm.")
