import os
import time
import pandas as pd
from playwright.sync_api import sync_playwright

output_path = r"C:\Users\ACER\Documents\fashion-shop\ai-service\data\clothing_reviews_negative_500.csv"
TARGET_REVIEWS_COUNT = 500  # Đặt mục tiêu 500 bình luận

# Danh sách từ khóa tìm kiếm bao phủ toàn bộ thời trang Nam & Nữ
SEARCH_KEYWORDS = [
    # Nam
    "áo thun nam giá rẻ", "áo sơ mi nam giá rẻ", "quần tây nam", 
    "áo polo nam form rộng", "quần jean nam ống suông", "áo khoác gió nam",
    # Nữ
    "đầm váy nữ giá rẻ", "áo croptop nữ", "quần ống rộng nữ", 
    "chân váy chữ a", "áo sơ mi nữ công sở", "set đồ nữ đi chơi",
    # Unisex & Chung
    "áo hoodie nỉ", "quần baggy giá rẻ", "áo phông unisex"
]

POSITIVE_KEYWORDS = [
    "cực kì hài lòng", "cực kỳ hài lòng", "rất hài lòng", "quá hài lòng",
    "ưng ý", "tuyệt vời", "đẹp lắm", "chất lượng tốt", "đáng tiền",
    "chuẩn form", "giao nhanh và đẹp", "xuất sắc", "ok lắm", "rất thích"
]

reviews_list = []
existing_comments = set()

# Đọc trước file cũ nếu đã có để không cào trùng và cộng dồn số lượng
if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
    try:
        old_df = pd.read_csv(output_path, encoding="utf-8-sig")
        if not old_df.empty and 'comment' in old_df.columns:
            existing_comments = set(old_df['comment'].dropna().tolist())
            print(f" Đã có sẵn {len(existing_comments)} đánh giá trong file cũ.")
    except Exception:
        pass

def is_negative_content(text, title):
    full_text = f"{title} {text}".lower()
    for kw in POSITIVE_KEYWORDS:
        if kw in full_text:
            return False
    return True

total_collected = len(existing_comments)

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=["--disable-blink-features=AutomationControlled"]
    )
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768}
    )
    page = context.new_page()

    for kw in SEARCH_KEYWORDS:
        if total_collected >= TARGET_REVIEWS_COUNT:
            break

        print(f"\n==================================================")
        print(f" ĐANG TÌM: {kw.upper()} | Tiến độ hiện tại: {total_collected}/{TARGET_REVIEWS_COUNT}")
        print(f"==================================================")

        search_url = f"https://tiki.vn/search?q={kw.replace(' ', '+')}"

        try:
            page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
            time.sleep(2)

            # Cuộn 4 lần để danh sách nạp được 30-40 sản phẩm
            for _ in range(4):
                page.mouse.wheel(0, 1000)
                time.sleep(1)

            product_ids = page.evaluate("""
                () => {
                    const links = Array.from(document.querySelectorAll('a[href*="-p"]'));
                    const ids = [];
                    links.forEach(a => {
                        const match = a.href.match(/-p(\\d+)\\.html/);
                        if (match && !ids.includes(match[1])) {
                            ids.push(match[1]);
                        }
                    });
                    return ids;
                }
            """)

            print(f"-> Tìm thấy {len(product_ids)} sản phẩm. Bắt đầu bóc tách đánh giá...")

            for pid in product_ids:
                if total_collected >= TARGET_REVIEWS_COUNT:
                    print("\n ĐÃ ĐẠT ĐỦ MỤC TIÊU 500 BÌNH LUẬN TIÊU CỰC!")
                    break

                # Quét mức 1, 2 và 3 sao
                for star in [1, 2, 3]:
                    if total_collected >= TARGET_REVIEWS_COUNT:
                        break

                    for page_num in range(1, 4):
                        items = page.evaluate("""
                            async ({productId, starValue, pageNumber}) => {
                                try {
                                    const res = await fetch(`https://tiki.vn/api/v2/reviews?product_id=${productId}&stars=${starValue}&page=${pageNumber}&limit=20&sort=score|desc,id|desc`);
                                    if (!res.ok) return [];
                                    const data = await res.json();
                                    return data.data || [];
                                } catch (e) {
                                    return [];
                                }
                            }
                        """, {"productId": pid, "starValue": star, "pageNumber": page_num})

                        if not items:
                            break

                        added_count = 0
                        for it in items:
                            if total_collected >= TARGET_REVIEWS_COUNT:
                                break

                            actual_rating = it.get("rating", star)
                            comment = (it.get("content") or "").strip()
                            title = (it.get("title") or "").strip()

                            # Kiểm tra độ dài, kiểm tra trùng lặp và lọc từ cấm
                            if actual_rating <= 3 and len(comment) >= 5 and comment not in existing_comments:
                                if is_negative_content(comment, title):
                                    existing_comments.add(comment)
                                    reviews_list.append({
                                        "keyword": kw,
                                        "product_id": pid,
                                        "rating": actual_rating,
                                        "label": "negative",
                                        "title": title,
                                        "comment": comment
                                    })
                                    total_collected += 1
                                    added_count += 1
                                    print(f"[{total_collected}/{TARGET_REVIEWS_COUNT}] [{actual_rating}*]: {comment[:50]}...")

                        if added_count == 0:
                            break
                        time.sleep(0.5)

        except Exception as e:
            print(f"Lỗi ở nhóm {kw}: {e}")

    browser.close()

# Ghi dữ liệu vào CSV
if reviews_list:
    new_df = pd.DataFrame(reviews_list)
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        try:
            old_df = pd.read_csv(output_path, encoding="utf-8-sig")
            combined_df = pd.concat([old_df, new_df], ignore_index=True)
            combined_df = combined_df.drop_duplicates(subset=["comment"])
        except Exception:
            combined_df = new_df
    else:
        combined_df = new_df

    combined_df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"\n==================================================")
    print(f" HOÀN TẤT: Đã gom thành công {len(combined_df)} đánh giá vào:")
    print(f" {output_path}")
    print(f"==================================================")
else:
    print(f"\nTổng số đánh giá hiện có trong file: {total_collected}")