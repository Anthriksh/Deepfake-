import os
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load API credentials from environment variables
API_USER = os.getenv("SIGHTENGINE_USER")
API_SECRET = os.getenv("SIGHTENGINE_SECRET")
if not API_USER or not API_SECRET:
    raise ValueError("SIGHTENGINE_USER and SIGHTENGINE_SECRET must be set")

@app.get("/")
def root():
    return {"message": "Backend live with Sightengine"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        files = {'media': (file.filename, file_bytes)}
        data = {
            'models': 'deepfake',  # only deepfake detection
            'api_user': API_USER,
            'api_secret': API_SECRET
        }
        response = requests.post(
            'https://api.sightengine.com/1.0/check.json',
            files=files,
            data=data
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error analyzing file: {e}")
