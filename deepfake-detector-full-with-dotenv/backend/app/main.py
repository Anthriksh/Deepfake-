import os
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Sightengine credentials
API_USER = os.getenv("SIGHTENGINE_USER")
API_SECRET = os.getenv("SIGHTENGINE_SECRET")

if not API_USER or not API_SECRET:
    raise RuntimeError("❌ Sightengine credentials missing in .env")

SIGHTENGINE_URL = "https://api.sightengine.com/1.0/check.json"

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    try:
        # Send file to Sightengine
        files = {"media": (file.filename, await file.read())}
        data = {
            "models": "genai",
            "api_user": API_USER,
            "api_secret": API_SECRET,
        }

        response = requests.post(SIGHTENGINE_URL, files=files, data=data)
        result = response.json()

        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result)

        genai = result.get("genai", {})
        is_ai = genai.get("ai_generated", False)
        confidence = genai.get("confidence", 0.0)

        # ✅ Clean response for frontend
        return {
            "file": file.filename,
            "prediction": "fake" if is_ai else "real",
            "confidence": confidence,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
