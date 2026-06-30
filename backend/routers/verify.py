from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from .. import registry
from ..scan_log import persist_scan

router = APIRouter(prefix="/api/verify", tags=["verify"])


def _log_verification(verify_result: dict) -> dict:
    log_entry = {
        "url": verify_result.get("source") or "<communication-submission>",
        "verdict": "SAFE" if verify_result["verified"] else "SUSPICIOUS",
    }
    persist_scan(log_entry, "communication", risk_score=0 if verify_result["verified"] else 60)
    return verify_result


class VerifyCommunicationRequest(BaseModel):
    text: str
    source: str | None = None


def _extract_pdf_text(file_bytes: bytes) -> str:
    try:
        import pdfplumber
    except ImportError as exc:
        raise HTTPException(
            status_code=503, detail="pdfplumber is required for PDF verification"
        ) from exc

    import io

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as exc:
        raise HTTPException(status_code=422, detail="could not parse PDF file") from exc


@router.post("/communication")
def verify_communication(request: VerifyCommunicationRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    return _log_verification(registry.verify_communication(request.text))


@router.post("/communication/file")
async def verify_communication_file(file: UploadFile = File(...)):
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="uploaded file is empty")

    if file.content_type == "application/pdf" or (file.filename or "").lower().endswith(".pdf"):
        text = _extract_pdf_text(file_bytes)
    else:
        text = file_bytes.decode("utf-8", errors="ignore")

    if not text.strip():
        raise HTTPException(status_code=422, detail="could not extract text from file")
    return _log_verification(registry.verify_communication(text))
