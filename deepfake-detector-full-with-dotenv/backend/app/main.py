import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
import requests

app = FastAPI()

# Load Reality Defender API key
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
        if not presigned_url:
            raise HTTPException(status_code=502, detail="Presigned URL missing")
        logging.info(f"Presigned URL: {presigned_url}")
    except Exception as e:
        logging.error(f"Error getting presigned URL: {e}")
        raise HTTPException(status_code=502, detail=f"Error getting presigned URL: {e}")

    # Step 2: Upload file to presigned URL
    try:
        files = {"file": (file.filename, await file.read())}
        upload_resp = requests.put(presigned_url, files=files)
        if upload_resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Error uploading file: {upload_resp.status_code}")
    except Exception as e:
        logging.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=502, detail=f"Error uploading file: {e}")

    # Step 3: Call Reality Defender analyze endpoint
    try:
        analyze_resp = requests.post(
            "https://api.prd.realitydefender.xyz/api/analyze",
            headers={"Authorization": f"Bearer {REALITY_API_KEY}"},
            json={"file_url": presigned_url}
        )
        analyze_resp.raise_for_status()
        return analyze_resp.json()
    except Exception as e:
        logging.error(f"Error analyzing file: {e}")
        raise HTTPException(status_code=502, detail=f"Error analyzing file: {e}")
