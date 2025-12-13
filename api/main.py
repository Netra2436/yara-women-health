from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pickle
import os

# ---------- Paths ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "model.pkl")
scaler_path = os.path.join(BASE_DIR, "scaler.pkl")

# ---------- App init ----------
app = FastAPI(title="PCOS Prediction API", version="1.0")

# ---------- CORS ----------
origins = [
    "https://yara-women-health-9izaivoqn-shriyas-projects-0fb35217.vercel.app",
    "https://yara-women-health-git-main-shriyas-projects-0fb35217.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] while testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Load model & scaler ----------
with open(model_path, "rb") as f:
    model = pickle.load(f)

with open(scaler_path, "rb") as f:
    scaler = pickle.load(f)

# ---------- Input schema ----------
class PCOSInput(BaseModel):
    age: float
    weight: float
    height: float
    bmi: float
    blood_group: int
    cycle: int
    cycle_length: float
    marriage_years: float
    pregnant: int
    abortions: int
    hip: float
    waist: float
    weight_gain: int
    hair_growth: int
    skin_darkening: int
    hair_loss: int
    pimples: int
    fast_food: int
    exercise: int

# ---------- Health check ----------
@app.get("/")
def root():
    return {"status": "ok", "message": "PCOS API running"}

# ---------- Prediction endpoint ----------
@app.post("/predict")
def predict_pcos(data: PCOSInput):
    vals = [
        data.age,
        data.weight,
        data.height,
        data.bmi,
        data.blood_group,
        data.cycle,
        data.cycle_length,
        data.marriage_years,
        data.pregnant,
        data.abortions,
        data.hip,
        data.waist,
        data.weight_gain,
        data.hair_growth,
        data.skin_darkening,
        data.hair_loss,
        data.pimples,
        data.fast_food,
        data.exercise,
    ]

    input_arr = np.array([vals])
    input_scaled = scaler.transform(input_arr)
    prediction = int(model.predict(input_scaled)[0])

    return {"prediction": prediction, "meaning": "1 = PCOS likely, 0 = unlikely"}
