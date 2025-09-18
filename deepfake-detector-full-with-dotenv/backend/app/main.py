from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is live"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # ✅ Mock response for demo purposes
    return {
        "file": file.filename,
        "prediction": "deepfake",      # can be "real" if you prefer
        "confidence": 0.92             # fake confidence score
    }
