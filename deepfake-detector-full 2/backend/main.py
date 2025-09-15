from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/detect")
async def detect(file: UploadFile = File(...)):
    # Dummy detection logic (replace with real model later)
    confidence = random.randint(50, 99)
    return {"message": "Analysis complete", "confidence": confidence}
