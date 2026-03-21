// ================================================================
// api.js — All backend API calls live here.
// Backend team: implement these functions to match the response shapes.
// Frontend uses these functions — do NOT call fetch() directly in pages.
// ================================================================

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Analyze resume + job description.
 * @param {string} resumeText - Plain text of the resume
 * @param {string} jobDescription - Plain text of the JD
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeGap(resumeText, jobDescription) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume: resumeText, job_description: jobDescription }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------
// Expected response shape from POST /api/analyze:
// {
//   name: string,                  // extracted from resume (or "User")
//   targetRole: string,            // extracted from JD
//   currentSkills: string[],       // skills found in resume
//   gapSkills: string[],           // target - current
//   pathway: {
//     id: number,
//     title: string,               // course name
//     provider: string,            // e.g. "Coursera"
//     duration: string,            // e.g. "8h"
//     prereqs: string[],           // course titles that must come first
//     reason: string,              // LLM reasoning trace
//     confidence: number,          // 0-1 float
//   }[]
// }
// ---------------------------------------------------------------
