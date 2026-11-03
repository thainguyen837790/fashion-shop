# Hướng dẫn huấn luyện mô hình phân loại cảm xúc bình luận

Tài liệu này hướng dẫn huấn luyện mô hình **2 nhãn: tích cực (`positive`) và tiêu cực (`negative`)** từ dữ liệu hiện có.

## 1. Dữ liệu hiện tại

File dữ liệu: `ai-service/data/reviews.csv`

File hiện có 406 dòng, với các cột:

- `text`: nội dung bình luận, dùng làm đầu vào.
- `label`: nhãn cảm xúc, chỉ nhận `positive` hoặc `negative`.
- `product_id`, `rating`, `source`: thông tin bổ sung; script hiện tại không dùng làm đầu vào mô hình.

Phân bố đang có là 273 `negative` và 133 `positive`. Không có nhãn trung tính. Dữ liệu đủ để chạy thử quy trình, nhưng còn ít để đánh giá độ chính xác khi đưa vào sử dụng thực tế.

## 2. Kiểm tra nhãn trước khi train

Mở CSV và đảm bảo:

1. Cột `text` không rỗng và chứa bình luận tiếng Việt.
2. Cột `label` chỉ có đúng `positive` hoặc `negative` (chữ thường, không dấu cách thừa).
3. Không gán nhãn chỉ dựa máy móc vào số sao nếu bình luận rõ ràng thể hiện cảm xúc ngược lại.
4. Các bình luận của cùng một sản phẩm có thể rất giống nhau. Khi đánh giá nghiêm túc, nên tách dữ liệu theo sản phẩm để tránh mẫu gần trùng rơi vào cả train và test.

## 3. Cài đặt môi trường

Mở PowerShell tại thư mục `ai-service`:

```powershell
cd C:\Users\ACER\Documents\fashion-shop\ai-service
```

Nếu đã có môi trường ảo `venv`, kích hoạt nó:

```powershell
.\venv\Scripts\Activate.ps1
```

Cài các thư viện dự án:

```powershell
pip install -r requirements.txt
```

`pyvi` đã được khai báo trong `requirements.txt` vì cả script train và API dự đoán đều dùng chung bước tách từ.

## 4. Chạy huấn luyện

Đảm bảo đang ở thư mục `ai-service` để đường dẫn tương đối `data/reviews.csv` được tìm thấy, sau đó chạy:

```powershell
python -X utf8 train_sentiment_phobert.py
```

Lần đầu chạy, Transformers sẽ tải PhoBERT (`vinai/phobert-base-v2`) từ Hugging Face; cần kết nối mạng. Máy có GPU NVIDIA tương thích sẽ train nhanh hơn; CPU vẫn chạy được nhưng chậm hơn.

Script hiện thực hiện các bước sau:

1. Chuẩn hóa văn bản và tách từ tiếng Việt bằng PyVi.
2. Chia dữ liệu có giữ tỷ lệ nhãn: 70% train, 15% validation, 15% test.
3. Fine-tune PhoBERT trong 5 epoch, dùng trọng số lớp để giảm ảnh hưởng của chênh lệch số lượng nhãn.
4. Chọn mô hình tốt nhất theo Macro F1 trên validation.
5. In báo cáo đánh giá cuối cùng trên tập test.
6. Lưu mô hình và tokenizer vào `ai-service/saved_phobert_fashion/`.

Tùy chọn `-X utf8` giúp hiển thị thông báo tiếng Việt đúng trong PowerShell trên Windows.

## 5. Đọc kết quả

Trong báo cáo cuối, xem Precision, Recall và F1-score riêng cho `negative` và `positive`, cùng Macro F1. Accuracy một mình có thể gây hiểu nhầm khi dữ liệu lệch nhãn.

Với tập test chỉ khoảng 61 bình luận, mỗi dự đoán sai làm điểm số thay đổi đáng kể. Hãy xem kết quả như thử nghiệm ban đầu; không nên coi đó là bằng chứng chắc chắn rằng mô hình hoạt động tốt trên mọi bình luận mới.

Lần chạy hiện tại cho accuracy **98,36%** và Macro F1 **0,9812** trên 61 mẫu test. Đây là kết quả của một lần chia ngẫu nhiên theo dòng; do cùng `product_id` có thể xuất hiện ở nhiều tập, điểm số có thể lạc quan hơn khi gặp sản phẩm mới. Nên đánh giá lại bằng cách chia theo `product_id` trước khi dùng làm chỉ số chính thức.

## 6. Dùng mô hình đã lưu

Sau khi train thành công, thư mục `saved_phobert_fashion` chứa trọng số và tokenizer. Khi nạp mô hình để dự đoán, phải áp dụng **cùng cách tiền xử lý** (`clean_and_tokenize`) như lúc train. Ánh xạ nhãn trong script là:

- `0` → `negative`
- `1` → `positive`

Nếu cập nhật dữ liệu hoặc cách tiền xử lý, hãy train lại và đánh giá lại trước khi thay mô hình đang dùng.

## 7. Chạy API dùng mô hình đã train

API FastAPI nạp mô hình lúc khởi động từ `saved_phobert_fashion`. Tại thư mục `ai-service`, kích hoạt môi trường ảo của dự án rồi chạy Uvicorn qua Python trong môi trường đó:

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Không chạy `uvicorn` trực tiếp nếu lệnh đó trỏ tới Python cài toàn hệ thống; môi trường ấy có thể thiếu các thư viện như `pyvi`.

Gọi `GET http://localhost:8000/health` để xem trạng thái. Gọi `POST http://localhost:8000/predict` với JSON `{"text":"Vải đẹp, giao hàng nhanh"}` và header `x-internal-key` có giá trị trùng với biến môi trường `INTERNAL_API_KEY` của dịch vụ. API trả về nhãn (`positive` hoặc `negative`), điểm tin cậy, nhãn theo khía cạnh và phiên bản mô hình.

Nếu mô hình được lưu ở vị trí khác, đặt biến môi trường `SENTIMENT_MODEL_DIR` trỏ tới thư mục đó trước khi khởi động API.

### Tải model từ Hugging Face Hub khi khởi động API

Đặt `HF_MODEL_ID` thành ID repo model, ví dụ `thai837790/thaitrinh-sentiment`. Khi biến này được khai báo, API dùng model trên Hub thay cho thư mục local. Repo public không cần token; với repo private, đặt `HF_TOKEN` bằng một token có quyền đọc trong phần Secrets của máy chủ. Không commit token vào GitHub.

Ví dụ chạy local trong PowerShell:

```powershell
$env:HF_MODEL_ID = "thai837790/thaitrinh-sentiment"
$env:HF_TOKEN = "hf_token_cua_ban" # bỏ dòng này nếu repo public
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Transformers tải model về cache Hugging Face khi API khởi động. Lần khởi động đầu tiên cần mạng và có thể lâu hơn vì model weights khoảng 540 MB. Trên Cloud Run, đặt `HF_MODEL_ID` ở Variables và đặt `HF_TOKEN` ở Secrets nếu repo private.

## 8. Cải thiện dữ liệu

Để tăng độ tin cậy:

- Bổ sung thêm bình luận được con người kiểm tra nhãn, ưu tiên những câu ngắn, mỉa mai, có phủ định hoặc cảm xúc lẫn lộn.
- Giữ tỷ lệ hai nhãn hợp lý; nếu lệch mạnh, bổ sung dữ liệu cho lớp ít hơn thay vì chỉ lặp lại các mẫu.
- Rà soát nhãn sai và các câu trùng hoặc gần trùng.
- Đánh giá trên các bình luận mới, chưa dùng trong quá trình train hoặc chọn mô hình.
