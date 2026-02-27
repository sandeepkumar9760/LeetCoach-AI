from fastapi import FastAPI
from pydantic import BaseModel
import requests
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "phi3"

class Problem(BaseModel):
    title: str
    description: str


@app.post("/analyze")
async def analyze(problem: Problem):

    prompt = f"""
You are an expert Data Structures & Algorithms mentor.

Return STRICT JSON format:

{{
  "explanation": "...",
  "approach": "...",
  "time_complexity": "...",
  "space_complexity": "...",
  "hints": "..."
}}

Do NOT include code.
Do NOT include markdown.
Return ONLY valid JSON.

Problem Title:
{problem.title}

Problem Description:
{problem.description}
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            }
        )

        data = response.json()
        content = data.get("response", "")

        return json.loads(content)

    except Exception as e:
        return {
            "error": "Model returned invalid JSON",
            "raw_output": content if 'content' in locals() else "",
            "exception": str(e)
        }
    
@app.post("/generate-code")
async def generate_code(problem: Problem):

    prompt = f"""
You are a competitive programming expert.

Return ONLY valid C++ code.

Rules:
- Use standard LeetCode class format
- No explanations
- No markdown
- No backticks
- Only C++ code

Problem Title:
{problem.title}

Problem Description:
{problem.description}
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            }
        )

        data = response.json()
        return {"code": data.get("response", "")}

    except Exception as e:
        return {
            "error": "Code generation failed",
            "exception": str(e)
        }