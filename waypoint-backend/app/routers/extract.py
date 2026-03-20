from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models import ExtractResponse
from app.services.claude_service import extract_skills_from_resume
from app.services.pdf_service import extract_text_from_upload

router = APIRouter()


@router.post("", response_model=ExtractResponse, summary="Extract skills from resume")
async def extract_skills(
    file: UploadFile = File(..., description="Resume file (PDF, DOCX, or TXT)"),
    target_role: str = Form(..., description="Target job title e.g. 'ML Engineer'"),
):
    """
    Parse an uploaded resume and extract skills with proficiency levels.

    Returns:
    - List of extracted skills with proficiency (proficient/partial) and confidence scores
    - Reasoning trace showing the extraction logic step by step
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    # Extract text from uploaded file
    resume_text = await extract_text_from_upload(file)

    if len(resume_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Resume text too short. Please upload a complete resume.")

    # Call Claude for skill extraction
    skills, trace = extract_skills_from_resume(resume_text, target_role)

    return ExtractResponse(
        skills        = skills,
        target_role   = target_role,
        reasoning_trace = trace,
    )


@router.post("/text", response_model=ExtractResponse, summary="Extract skills from plain text resume")
async def extract_skills_from_text(body: dict):
    """
    Convenience endpoint: accepts JSON body with resume_text and target_role.
    Useful for testing without a file upload.
    """
    resume_text = body.get("resume_text", "").strip()
    target_role = body.get("target_role", "").strip()

    if not resume_text:
        raise HTTPException(status_code=400, detail="resume_text is required.")
    if not target_role:
        raise HTTPException(status_code=400, detail="target_role is required.")

    skills, trace = extract_skills_from_resume(resume_text, target_role)

    return ExtractResponse(
        skills          = skills,
        target_role     = target_role,
        reasoning_trace = trace,
    )
