"""PhoBERT sentiment inference and text preprocessing shared with training."""

import os
import re
from pathlib import Path
from typing import Tuple

import torch
from pyvi import ViTokenizer
from transformers import AutoModelForSequenceClassification, AutoTokenizer


TEENCODE_DICT = {
    "k": "không", "ko": "không", "kh": "không", "khum": "không", "kg": "không",
    "mik": "mình", "mk": "mình", "tui": "tôi", "mh": "mình",
    "đc": "được", "dk": "được", "dc": "được",
    "sp": "sản phẩm", "sop": "shop", "sóp": "shop",
    "fom": "phom dáng", "from": "phom dáng", "form": "phom dáng",
    "z": "vậy", "v": "vậy", "cx": "cũng", "cxg": "cũng",
    "mn": "mọi người", "mng": "mọi người",
    "okela": "tốt", "oki": "tốt", "okie": "tốt", "okia": "tốt", "ok": "tốt",
    "xinh xỉu": "rất đẹp", "xinh điên": "rất đẹp", "dịu keo": "rất đẹp",
}


def clean_and_tokenize(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    text = re.sub(r"(\d+)\s*cá\b", r"\1 nghìn", text)
    text = re.sub(r"(\d+)\s*k\b", r"\1 nghìn", text)
    text = re.sub(r"[^\w\s.,!?]", " ", text)
    words = [TEENCODE_DICT.get(word, word) for word in text.split()]
    text = re.sub(r"\s+", " ", " ".join(words)).strip()
    return ViTokenizer.tokenize(text)


class SentimentModel:
    LABELS = {0: "negative", 1: "positive"}

    def __init__(self, model_dir: str | None = None):
        default_dir = Path(__file__).resolve().parents[1] / "saved_phobert_fashion"
        self.model_dir = Path(model_dir or os.getenv("SENTIMENT_MODEL_DIR", str(default_dir)))
        model_id = os.getenv("HF_MODEL_ID", "").strip()
        model_source = model_id or str(self.model_dir)
        if not model_id and not self.model_dir.is_dir():
            raise FileNotFoundError(
                f"Không tìm thấy mô hình tại {self.model_dir}. Hãy train model hoặc cấu hình HF_MODEL_ID."
            )

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        hf_token = os.getenv("HF_TOKEN") or None
        self.tokenizer = AutoTokenizer.from_pretrained(
            model_source,
            use_fast=False,
            token=hf_token,
        )
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_source,
            token=hf_token,
        )
        self.model.to(self.device)
        self.model.eval()

    @torch.inference_mode()
    def predict(self, text: str) -> Tuple[str, float]:
        cleaned = clean_and_tokenize(text)
        inputs = self.tokenizer(
            cleaned,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128,
        )
        inputs = {key: value.to(self.device) for key, value in inputs.items()}
        probabilities = torch.softmax(self.model(**inputs).logits, dim=-1)[0]
        class_id = int(probabilities.argmax().item())
        return self.LABELS[class_id], float(probabilities[class_id].item())
