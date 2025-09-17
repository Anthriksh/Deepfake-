from dotenv import load_dotenv
load_dotenv()

# backend/app/main.py

import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.utils import get_presigned_url, upload_to_presigned, get_result
from pydantic import BaseModel
from io import BytesIO

app = FastAPI(title="Deepfake Detector - Reality Defender Backend")

origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    "http://localhost:3000",
    "http://127.0.0.1:5173"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("DEV_ALLOW_ALL", "true").lower() == "true" else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResp(BaseModel):
    status: str
    provider: str

@app.get("/health", response_model=HealthResp)
def health():
    return {"status": "ok", "provider": "reality-defender-signed-url"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    file_stream = BytesIO(contents)
    file_stream.seek(0)
    file_tuple = (file.filename, file_stream, file.content_type)

    try:
        presigned = get_presigned_url(file.filename)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error getting presigned URL: {str(e)}")

    try:
        upload_to_presigned(presigned, file_tuple)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error uploading file: {str(e)}")

    request_id = presigned.get("request_id")
    if not request_id:
        raise HTTPException(status_code=500, detail="No request_id returned")

    try:
        result = get_result(request_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error getting result: {str(e)}")

    return {"provider": "reality-defender", "request_id": request_id, "raw": result}
