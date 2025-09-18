import os
import logging
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Enable CORS (so frontend can talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; later restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load API key
REALITY_API_KEY = os.environ.get("REALITY_API_KEY")
if not REALITY_API_KEY:
    raise ValueError("REALITY_API_KEY not set")

@app.get("/")
def root():
    return {"message": "Backend is live"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    logging.info(f"Received file: {file.filename}")

    # Step 1: Get presigned URL
    try:
        response = requests.post(
            "https://api.prd.realitydefender.xyz/api/files/aws-presigned",
            headers={"Authorization": f"Bearer {REALITY_API_KEY}"}
        )
        response.raise_for_status()
        presign_data = response.json()
        presigned_url = presign_data.get("url")
        file_key = presign_data.get("file_key")  # ✅ usually needed for later
        if not presigned_url or not file_key:
            raise HTTPException(status_code=502, detail="Presigned URL or file_key missing")
        logging.info(f"Presigned URL obtained")
    except Exception as e:
        logging.error(f"Error getting presigned URL: {e}")
        raise HTTPException(status_code=502, detail=f"Error getting presigned URL: {e}")

    # Step 2: Upload file to presigned URL (raw bytes, not files={})
    try:
        file_bytes = await file.read()
        upload_resp = requests.put(
            presigned_url,
            data=file_bytes,
            headers={"Content-Type": "application/octet-stream"}
        )
        if upload_resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Error uploading file: {upload_resp.text}")
        logging.info(f"File uploaded successfully")
    except Exception as e:
        logging.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=502, detail=f"Error uploading file: {e}")

    # Step 3: Call Reality Defender analyze endpoint with file_key
    try:
        analyze_resp = requests.post(
            "https://api.prd.realitydefender.xyz/api/analyze",
            headers={"Authorization": f"Bearer {REALITY_API_KEY}"},
            json={"file_key": file_key}
        )
        analyze_resp.raise_for_status()
        logging.info("Analysis complete")
        return analyze_resp.json()
    except Exception as e:
        logging.error(f"Error analyzing file: {e}")
        raise HTTPException(status_code=502, detail=f"Error analyzing file: {e}")
