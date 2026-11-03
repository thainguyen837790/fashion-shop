import os
import re
from typing import List, Optional
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel
from app.sentiment import SentimentModel

app = FastAPI(title="Fashion Sentiment Analysis Service")
INTERNAL_KEY = os.getenv("INTERNAL_API_KEY", "fashion_secret_key_2026")

# Từ khóa khía cạnh theo đặc tả mục 7.4
ASPECT_KEYWORDS = {
    "material": ["vải", "chất liệu", "chất vải", "mềm", "dày", "mỏng", "co giãn", "thấm hút"],
    "fit": ["form", "dáng", "ôm", "rộng", "thụng", "đứng form"],
    "size": ["size", "số đo", "chật", "vừa", "bảng size", "sz"],
    "color": ["màu", "lệch màu", "bạc màu", "phai màu"],
    "price": ["giá", "đắt", "rẻ", "đáng tiền"],
    "shipping": ["giao hàng", "ship", "vận chuyển", "giao nhanh", "giao chậm"],
    "packaging": ["đóng gói", "hộp", "túi", "gói hàng"]
}

class PredictRequest(BaseModel):
    text: str

class AspectResult(BaseModel):
    aspect: str
    label: str
    score: float

class PredictResponse(BaseModel):
    label: str
    score: float
    aspects: List[AspectResult]
    modelVersion: str

MODEL_VERSION = "phobert-fashion-v1"
sentiment_model = SentimentModel()

@app.get("/health")
def health_check():
    return {"status": "ok", "modelVersion": MODEL_VERSION}

@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest, x_internal_key: Optional[str] = Header(None)):
    if x_internal_key != INTERNAL_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Key")
    
    text = payload.text
    overall_label, overall_score = sentiment_model.predict(text)
    
    # Tách mệnh đề theo dấu câu và từ nối (nhưng, tuy nhiên, mà)
    clauses = re.split(r'[,.\n]| nhưng | tuy nhiên | mà ', text, flags=re.IGNORECASE)
    aspect_results = []
    
    for clause in clauses:
        clause_clean = clause.lower()
        for aspect, keywords in ASPECT_KEYWORDS.items():
            if any(k in clause_clean for k in keywords):
                lbl, sc = sentiment_model.predict(clause)
                aspect_results.append(AspectResult(aspect=aspect, label=lbl, score=sc))
                break

    return PredictResponse(
        label=overall_label,
        score=overall_score,
        aspects=aspect_results,
        modelVersion=MODEL_VERSION
    )
