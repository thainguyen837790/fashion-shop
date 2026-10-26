import json
import time
from playwright.sync_api import sync_playwright

USER_DATA_DIR = "./shopee_user_data"  # Thư mục lưu cookie/session
TARGET_URL = "https://shopee.vn/product/123456/789012"  # Link sản phẩm cần lấy

reviews = []


def handle_response(response):
  # Bắt endpoint trả về đánh giá của Shopee
  if (
      "get_ratings" in response.url
      or "api/v4/item/get_ratings" in response.url
      or "api/v2/item/get_ratings" in response.url
  ):
    try:
      data = response.json()
      items = data.get("data", {}).get("ratings", [])
      for it in items:
        comment = it.get("comment", "").strip()
        if comment:
          reviews.append({
              "rating_star": it.get("rating_star"),
              "comment": comment,
              "model_name": it.get("product_items", [{}])[0].get(
                  "model_name", ""
              ),
          })
          print(f"Lấy được review: {comment[:40]}...")
    except Exception:
      pass


with sync_playwright() as p:
  # Mở trình duyệt với user_data_dir để duy trì trạng thái đăng nhập
  context = p.chromium.launch_persistent_context(
      user_data_dir=USER_DATA_DIR,
      headless=False,  # Bắt buộc để giao diện hiện ra
      args=[
          "--disable-blink-features=AutomationControlled"
      ],  # Tắt cờ báo bot tự động
      viewport={"width": 1280, "height": 800},
  )

  page = context.pages[0] if context.pages else context.new_page()
  page.on("response", handle_response)

  print("Đang mở trang sản phẩm...")
  page.goto(TARGET_URL, wait_until="networkidle")

  # Nếu là lần đầu chạy và thấy trang yêu cầu login:
  # Hãy tự đăng nhập bằng tay trên cửa sổ vừa mở ra.
  print(
      "Nếu chưa đăng nhập, vui lòng đăng nhập trên trình duyệt trong vòng 30"
      " giây..."
  )
  page.wait_for_timeout(30000)  # Chờ 30s để đăng nhập nếu cần

  # Cuộn trang từ từ xuống khu vực review để kích hoạt API get_ratings
  for i in range(5):
    page.evaluate(f"window.scrollTo(0, {1000 * (i + 1)})")
    time.sleep(2)

  page.wait_for_timeout(5000)
  context.close()

with open("shopee_reviews.json", "w", encoding="utf-8") as f:
  json.dump(reviews, f, ensure_ascii=False, indent=2)

print(f"\nĐã lưu thành công {len(reviews)} đánh giá vào shopee_reviews.json")