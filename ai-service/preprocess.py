"""Tiền xử lý văn bản đánh giá tiếng Việt (mục 7.2)."""
import re
import unicodedata

# Bảng teencode/viết tắt: bổ sung dần sau khi đọc dữ liệu thật
TEENCODE = {
    "ko": "không", "k": "không", "kh": "không", "hok": "không", "hông": "không",
    "dc": "được", "đc": "được", "sp": "sản phẩm", "sh": "shop",
    "vs": "với", "mik": "mình", "mk": "mình", "ok": "tốt", "oke": "tốt",
    "j": "gì", "z": "vậy", "r": "rồi", "bt": "bình thường", "nc": "nói chuyện",
}

# Emoji mang cảm xúc rõ -> chuyển thành từ
EMOJI = {
    "😍": " tuyệt vời ", "❤️": " yêu thích ", "👍": " tốt ", "😊": " hài lòng ",
    "👎": " tệ ", "😡": " tức giận ", "😞": " thất vọng ", "😭": " thất vọng ",
}

URL_RE = re.compile(r"https?://\S+|www\.\S+")
REPEAT_RE = re.compile(r"(.)\1{2,}")                # "đẹppppp" -> "đẹp"
KEEP_RE = re.compile(r"[^\w\s]", flags=re.UNICODE)  # bỏ ký tự đặc biệt còn lại


def normalize(text: str, segment: bool = False) -> str:
    if not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFC", text).lower()
    text = URL_RE.sub(" ", text)
    for emo, word in EMOJI.items():
        text = text.replace(emo, word)
    text = REPEAT_RE.sub(r"\1", text)
    text = KEEP_RE.sub(" ", text)
    tokens = [TEENCODE.get(t, t) for t in text.split()]
    text = " ".join(tokens)
    if segment:  # PhoBERT cần tách từ; TF-IDF thì không bắt buộc
        from underthesea import word_tokenize
        text = word_tokenize(text, format="text")
    return text.strip()