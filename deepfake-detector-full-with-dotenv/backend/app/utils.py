# backend/app/utils.py

import os
import requests
from typing import Dict, Any, Tuple

REALITY_API_KEY = os.getenv("REALITY_API_KEY", "")
REALITY_PRESIGNED_URL_ENDPOINT = "https://api.prd.realitydefender.xyz/api/files/aws-presigned"
REALITY_RESULT_ENDPOINT_TEMPLATE = "https://api.prd.realitydefender.xyz/api/media/users/{request_id}"

def get_presigned_url(file_name: str) -> Dict[str, Any]:
    if not REALITY_API_KEY:
        raise ValueError("REALITY_API_KEY not set")

    headers = {"X-API-KEY": REALITY_API_KEY, "Content-Type": "application/json"}
    data = {"fileName": file_name}
    resp = requests.post(REALITY_PRESIGNED_URL_ENDPOINT, headers=headers, json=data, timeout=30)
    resp.raise_for_status()
    return resp.json()

def upload_to_presigned(presigned_data: Dict[str, Any], file_tuple: Tuple[str, any, str]) -> None:
    presigned_url = presigned_data.get("url") or presigned_data.get("presigned_url")
    if not presigned_url:
        raise ValueError("Presigned URL missing")

    file_stream = file_tuple[1]
    file_stream.seek(0)
    headers = {"Content-Type": file_tuple[2]}
    resp = requests.put(presigned_url, data=file_stream.read(), headers=headers, timeout=60)
    resp.raise_for_status()

def get_result(request_id: str) -> Dict[str, Any]:
    if not REALITY_API_KEY:
        raise ValueError("REALITY_API_KEY not set")

    headers = {"X-API-KEY": REALITY_API_KEY, "Content-Type": "application/json"}
    url = REALITY_RESULT_ENDPOINT_TEMPLATE.format(request_id=request_id)
    resp = requests.get(url, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp.json()
