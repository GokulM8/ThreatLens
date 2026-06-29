from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from ..ml import model as url_model
from ..ml import text_model
from ..ml.media_analyzer import analyze_media
from ..scan_log import persist_scan

router = APIRouter(prefix="/api/analyze", tags=["analyze"])


class UrlAnalyzeRequest(BaseModel):
    url: str


class ContentAnalyzeRequest(BaseModel):
    text: str


@router.post("/url")
def analyze_url(request: UrlAnalyzeRequest):
    if not request.url or not request.url.strip():
        raise HTTPException(status_code=400, detail="url is required")
    try:
        result = url_model.score_url(request.url.strip())
    except url_model.ModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    persist_scan(result, "url")
    return result


@router.post("/content")
def analyze_content(request: ContentAnalyzeRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    try:
        result = text_model.analyze_text(request.text.strip())
    except text_model.TextModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    persist_scan(result, "content")
    return result


@router.post("/media")
async def analyze_media_endpoint(file: UploadFile = File(...)):
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="uploaded file is empty")
    result = analyze_media(file.filename, file.content_type, file_bytes)
    persist_scan(result, "media")
    return result
