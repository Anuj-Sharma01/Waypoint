from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os, json, re
from groq import Groq

router = APIRouter()
client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL  = "llama-3.3-70b-versatile"

class HistoryItem(BaseModel):
    correct: bool
    difficulty: str

class AdaptiveQuestionRequest(BaseModel):
    skill: str
    difficulty: str = "medium"
    history: List[HistoryItem] = []
    question_number: int = 1

class AdaptiveQuestionResponse(BaseModel):
    text: str
    options: List[str]
    correct: int
    explanation: str
    difficulty: str

QUESTION_SYSTEM = """You are an adaptive skill assessment engine.

Generate a multiple choice question to test a person's knowledge of a specific skill.

RULES:
1. Generate exactly 4 options
2. correct is the index (0-3) of the correct answer
3. Make the question appropriate for the difficulty level:
   - easy: basic concepts, definitions, simple use cases
   - medium: practical application, common patterns, trade-offs
   - hard: advanced concepts, edge cases, architecture decisions
   - expert: system design, optimization, deep internals
4. explanation should be 1-2 sentences explaining WHY the answer is correct
5. Make wrong options plausible but clearly wrong to someone who knows the skill
6. Respond ONLY with valid JSON — no preamble, no markdown fences

OUTPUT FORMAT:
{
  "text": "What is the primary purpose of X?",
  "options": ["Correct answer", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
  "correct": 0,
  "explanation": "X is primarily used for... because...",
  "difficulty": "medium"
}"""


@router.post("/adaptive", response_model=AdaptiveQuestionResponse)
async def generate_adaptive_question(req: AdaptiveQuestionRequest):
    """
    Generate an adaptive MCQ question for a given skill and difficulty.
    Uses answer history to avoid repetition.
    """
    correct_count  = sum(1 for h in req.history if h.correct)
    total          = len(req.history)
    performance    = f"{correct_count}/{total} correct so far" if total > 0 else "first question"

    prompt = f"""Skill to test: {req.skill}
Difficulty: {req.difficulty}
Question number: {req.question_number}
Performance so far: {performance}

Generate a {req.difficulty} difficulty question about {req.skill}.
Make sure it's different from what question {req.question_number - 1} would cover.
Return valid JSON only."""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": QUESTION_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.7,
            max_tokens=600,
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'^```\s*',     '', raw)
        raw = re.sub(r'\s*```$',     '', raw)
        raw = raw.strip()

        data = json.loads(raw)

        return AdaptiveQuestionResponse(
            text        = data["text"],
            options     = data["options"][:4],
            correct     = int(data["correct"]),
            explanation = data.get("explanation", ""),
            difficulty  = data.get("difficulty", req.difficulty),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")
