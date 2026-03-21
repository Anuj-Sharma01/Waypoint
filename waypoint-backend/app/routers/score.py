from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os, json, re
from groq import Groq

router = APIRouter()
client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL  = "llama-3.3-70b-versatile"

class ScoreRequest(BaseModel):
    resume_text: str
    job_description: str = ""

class KeywordMatch(BaseModel):
    keyword: str
    found: bool
    context: str = ""

class ScoreResponse(BaseModel):
    overall_score: float        # out of 10
    ats_score: float            # out of 100
    keyword_matches: List[KeywordMatch]
    keywords_found: int
    keywords_total: int
    strengths: List[str]
    improvements: List[str]
    reasoning_trace: List[str]

SCORE_SYSTEM = """You are an ATS (Applicant Tracking System) and resume scoring expert.

Analyze the resume against the job description and return a detailed score.

SCORING CRITERIA:
- Keyword match rate (40%) — how many JD keywords appear in the resume
- Experience relevance (25%) — how relevant the experience is to the role
- Skills coverage (20%) — how many required skills are present
- Resume structure (15%) — clarity, formatting, quantified achievements

RULES:
1. Extract the top 10-15 keywords from the job description
2. Check each keyword against the resume (case-insensitive)
3. overall_score: 0-10 (one decimal place)
4. ats_score: 0-100 (integer, based on keyword match rate)
5. strengths: 3-4 specific things the resume does well
6. improvements: 3-4 specific actionable improvements
7. Respond ONLY with valid JSON — no preamble, no markdown fences

OUTPUT FORMAT:
{
  "overall_score": 7.2,
  "ats_score": 68,
  "keywords": [
    { "keyword": "Python", "found": true, "context": "3 years of Python development" },
    { "keyword": "Docker", "found": false, "context": "" }
  ],
  "strengths": [
    "Strong Python experience with 3+ years",
    "Quantified achievements with metrics"
  ],
  "improvements": [
    "Add Docker and Kubernetes experience",
    "Include more ML-specific keywords like PyTorch or TensorFlow"
  ],
  "reasoning_trace": [
    "[KEYWORDS] Extracted 12 keywords from JD",
    "[MATCH] Found 8/12 keywords in resume (67%)",
    "[SCORE] Overall: 7.2/10 | ATS: 68/100"
  ]
}"""


@router.post("", response_model=ScoreResponse, summary="Score resume against job description")
async def score_resume(req: ScoreRequest):
    if not req.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text is required.")

    jd_section = f"\nJob Description:\n{req.job_description[:2000]}" if req.job_description else "\nNo job description provided — scoring resume quality only."

    prompt = f"""Resume:
---
{req.resume_text[:4000]}
---
{jd_section}

Score this resume. Return valid JSON only."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SCORE_SYSTEM},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.1,
        max_tokens=1500,
    )

    raw = response.choices[0].message.content.strip()
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*',     '', raw)
    raw = re.sub(r'\s*```$',     '', raw)
    raw = raw.strip()

    data = json.loads(raw)

    keywords = data.get("keywords", [])
    found    = [k for k in keywords if k.get("found")]

    return ScoreResponse(
        overall_score    = round(float(data.get("overall_score", 5.0)), 1),
        ats_score        = int(data.get("ats_score", 50)),
        keyword_matches  = [KeywordMatch(**k) for k in keywords],
        keywords_found   = len(found),
        keywords_total   = len(keywords),
        strengths        = data.get("strengths", []),
        improvements     = data.get("improvements", []),
        reasoning_trace  = data.get("reasoning_trace", []),
    )
