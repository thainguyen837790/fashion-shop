import pandas as pd
from datasets import load_dataset

print("Đang tải tập dữ liệu đánh giá sản phẩm tiếng Việt...")

# Tập dữ liệu tổng hợp review TMĐT tiếng Việt công khai trên Hugging Face
dataset = load_dataset("5CD-AI/Vietnamese-Sentiment-visobert", split="train")

df = pd.DataFrame(dataset)

# Đổi tên cột chuẩn cho bài toán Sentiment Analysis
# Thường gồm 2 cột chính: text/review và label (0: Tiêu cực, 1: Trung lập, 2: Tích cực)
print("Các cột có trong dataset:", df.columns.tolist())
print(f"Tổng số mẫu: {len(df)}")

output_path = r"C:\Users\ACER\Documents\fashion-shop\ai-service\data\clothing_reviews_ready.csv"
df.to_csv(output_path, index=False, encoding="utf-8-sig")

print(f"Đã lưu thành công vào: {output_path}")
print("\nXem thử 3 dòng đầu tiên:")
print(df.head(3))