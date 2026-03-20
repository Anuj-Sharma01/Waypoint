import io
import pdfplumber
from fastapi import UploadFile, HTTPException


async def extract_text_from_upload(file: UploadFile) -> str:
    """
    Extract plain text from an uploaded PDF or plain text file.
    Returns the extracted text string.
    """
    content = await file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf"):
        return _extract_pdf(content)
    elif filename.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")
    elif filename.endswith(".docx"):
        return _extract_docx(content)
    else:
        # Try to decode as plain text
        try:
            return content.decode("utf-8", errors="ignore")
        except Exception:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or TXT.")


def _extract_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
            text  = "\n".join(pages).strip()
        if not text:
            raise HTTPException(status_code=422, detail="Could not extract text from PDF. It may be scanned/image-based.")
        return text
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF extraction failed: {str(e)}")


def _extract_docx(content: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        import docx
        doc   = docx.Document(io.BytesIO(content))
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paras)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"DOCX extraction failed: {str(e)}")
