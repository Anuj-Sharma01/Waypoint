from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel
from app.services.course_search import _load, _COURSES

router = APIRouter()

class CourseResult(BaseModel):
    title:      str
    university: str
    difficulty: str
    rating:     float
    url:        str
    skills:     List[str]

@router.get("", response_model=List[CourseResult], summary="Search Coursera course catalog")
def search_courses(
    q:      Optional[str] = Query(None, description="Search query"),
    limit:  int           = Query(20,   description="Max results"),
):
    """
    Search 3,522 real Coursera courses by skill or keyword.
    Every result has a real Coursera URL — sourced from Coursera Dataset 2021 (Kaggle).
    """
    _load()

    if not q or not q.strip():
        # Return top-rated courses by default
        sorted_courses = sorted(_COURSES, key=lambda c: c['rating'], reverse=True)
        return [_to_result(c) for c in sorted_courses[:limit]]

    query   = q.lower().strip()
    q_words = set(query.split())
    scored  = []

    for c in _COURSES:
        score = 0.0
        for skill in c['skills']:
            if query == skill:          score += 10.0
            elif query in skill:        score += 5.0
            elif skill in query:        score += 4.0
            else:
                overlap = len(q_words & set(skill.split()))
                score  += overlap * 2.0
        if query in c['title_lower']:   score += 4.0
        else:
            score += len(q_words & set(c['title_lower'].split())) * 1.5
        if query in c['desc_lower']:    score += 1.0
        score *= (c['rating'] / 5.0) if c['rating'] > 0 else 0.5
        if score > 0:
            scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [_to_result(c) for _, c in scored[:limit]]


def _to_result(c: dict) -> CourseResult:
    return CourseResult(
        title      = c['title'],
        university = c['university'],
        difficulty = c['difficulty'],
        rating     = c['rating'],
        url        = c['url'],
        skills     = c['skills'][:8],
    )
