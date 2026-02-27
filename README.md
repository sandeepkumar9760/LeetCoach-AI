# LeetCoach AI 🧠

LeetCoach AI is a Chrome extension plus local backend that turns any LeetCode problem into an **interactive DSA coach**.  
It reads the current LeetCode problem, sends it to a locally running LLM (via Ollama), and gives you:

- Plain-English explanation of the problem  
- Step-by-step approach  
- Time and space complexity  
- Hints (without spoilers)  
- Auto-generated C++ solution in standard LeetCode format

Everything runs **locally**: the extension talks to a FastAPI backend, which calls a local Ollama model (default: `phi3`).

---

## Features

- 🧩 Detects current LeetCode problem (title + description) directly from the page via a content script.
- 🧑‍🏫 `/analyze` endpoint returns:
  - `explanation`
  - `approach`
  - `time_complexity`
  - `space_complexity`
  - `hints`  
  all in clean JSON, no code or markdown.
- 💻 `/generate-code` endpoint returns **only** valid C++ code in LeetCode class format, no comments/markdown/backticks.
- 🌐 Works only on `leetcode.com` (by design) and talks to backend at `http://127.0.0.1:8000`.
- 🧱 Chrome Manifest V3 extension using:
  - `background.js` – manages side panel and messaging
  - `content.js` – scrapes LeetCode DOM and sends problem data
  - `sidepanel.html / .js / .css` – UI for explanations, hints, and code

---

## Architecture Overview

```
LeetCoach-AI/
├── backend/                  # FastAPI server + Ollama client
│   ├── main.py               # FastAPI routes: /analyze and /generate-code
│   └── requirements.txt      # FastAPI + dependencies
└── extension/                # Chrome extension (Manifest V3)
    ├── icons/                # Extension icons
    ├── background.js         # Service worker, handles side panel + requests
    ├── content.js            # Injected into leetcode.com, scrapes problem
    ├── manifest.json         # Extension config (permissions, scripts, side panel)
    ├── sidepanel.html        # Side panel markup
    ├── sidepanel.css         # Side panel styling
    ├── sidepanel.js          # Side panel logic, API calls to backend
    └── style.css             # Additional styles
```

- The extension is configured via `manifest.json` (MV3) with:
  - permissions: `tabs`, `activeTab`, `scripting`, `sidePanel`  
  - host permissions: `*://*.leetcode.com/*` and `http://127.0.0.1:8000/*`  
  - background service worker: `background.js`  
  - default side panel: `sidepanel.html`  
  - content script: `content.js` injected into all LeetCode pages.

---

## Backend (FastAPI + Ollama)

Backend entry point: `backend/main.py`.

### Tech stack

- FastAPI  
- Uvicorn  
- python-dotenv (optional)  
- requests

`requirements.txt`:

```txt
fastapi
uvicorn
python-dotenv
requests
```

### API endpoints

#### 1. `/analyze` – Analyze problem (DSA mentor)

- Method: `POST`  
- URL: `http://127.0.0.1:8000/analyze`  
- Body (JSON):

```json
{
  "title": "Two Sum",
  "description": "Given an array of integers nums and an integer target..."
}
```

- Request model in Python:

```python
class Problem(BaseModel):
    title: str
    description: str
```

- What it does:
  - Builds a prompt instructing the model to act as a **DSA mentor** and return **strict JSON**.  
  - Sends the prompt to Ollama at `http://localhost:11434/api/generate` using model `phi3`.  
  - Parses `response["response"]` as JSON and returns it.

- Expected LLM output format:

```json
{
  "explanation": "...",
  "approach": "...",
  "time_complexity": "...",
  "space_complexity": "...",
  "hints": "..."
}
```

- Error handling (simplified):

```json
{
  "error": "Model returned invalid JSON",
  "raw_output": "<raw model text if available>",
  "exception": "<python exception string>"
}
```

#### 2. `/generate-code` – Generate C++ solution

- Method: `POST`  
- URL: `http://127.0.0.1:8000/generate-code`  
- Body (JSON): same `Problem` as `/analyze`.

- What it does:
  - Builds a prompt instructing the model to act as a **competitive programming expert** and return **only C++ code**.  
  - Rules sent to model:
    - Use standard LeetCode class format  
    - No explanations  
    - No markdown  
    - No backticks  
    - Only C++ code
  - Returns:

```json
{ "code": "<C++ source code from model>" }
```

- Error handling:

```json
{
  "error": "Code generation failed",
  "exception": "<python exception string>"
}
```

#### Ollama configuration

In `main.py`:

```python
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "phi3"
```

Make sure you have Ollama installed and the `phi3` model pulled:

```bash
ollama pull phi3
ollama serve   # if not already running
```

---

## Frontend (Chrome Extension)

### Manifest (Manifest V3)

Key fields from `extension/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "LeetCoach AI",
  "version": "1.0",
  "description": "AI-powered DSA learning assistant",
  "permissions": [
    "tabs",
    "activeTab",
    "scripting",
    "sidePanel"
  ],
  "host_permissions": [
    "*://*.leetcode.com/*",
    "http://127.0.0.1:8000/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "LeetCoach AI"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "content_scripts": [
    {
      "matches": ["*://*.leetcode.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon.png",
    "48": "icons/icon.png",
    "128": "icons/icon.png"
  }
}
```

- `content.js` runs on all LeetCode pages after the DOM is loaded (`document_idle`).  
- `background.js` is the service worker that can open the side panel and relay messages.  
- `sidepanel.html` is the UI containing elements styled by `sidepanel.css` and powered by `sidepanel.js`.

### Typical data flow

1. You open a LeetCode problem.  
2. `content.js` reads the problem title and description from the page DOM.  
3. It sends this data to the backend:
   - `POST /analyze` for explanation, approach, complexity, hints  
   - `POST /generate-code` for C++ code
4. `sidepanel.js` displays responses inside `sidepanel.html` with styles from `sidepanel.css`.  
5. The extension UI lets you view explanation, hints, and generated code alongside the problem.

---

## Local Setup (Backend + Extension)

### 1. Clone the repository

```bash
git clone https://github.com/sandeepkumar9760/LeetCoach-AI.git
cd LeetCoach-AI
```

---

### 2. Backend setup

From the project root:

```bash
cd backend
```

#### Create and activate virtual environment (recommended)

```bash
# Create venv (if you don't want to use the bundled one)
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

#### Install dependencies

```bash
pip install -r requirements.txt
```

#### Run the FastAPI server

Use Uvicorn (installed via `requirements.txt`):

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

- FastAPI will be available at `http://127.0.0.1:8000`.  
- You can test endpoints with a tool like curl/Postman or via docs at `http://127.0.0.1:8000/docs` (if enabled).

> Make sure:
> - Ollama is running on `http://localhost:11434`  
> - The `phi3` model is available  

---

### 3. Ollama setup

If you haven't already:

1. Install Ollama from the official site.  
2. Pull the `phi3` model:

```bash
ollama pull phi3
```

3. Start the Ollama server (if it doesn't auto-start):

```bash
ollama serve
```

The backend expects:

- Base URL: `http://localhost:11434`  
- Endpoint: `/api/generate`  
- Model name: `phi3` (configurable by editing `MODEL_NAME` in `main.py`).

---

### 4. Load the Chrome extension

1. Open Chrome and go to `chrome://extensions/`.  
2. Enable **Developer mode** (toggle in top-right).  
3. Click **Load unpacked**.  
4. Select the `extension` folder from this repo.  
5. You should see **LeetCoach AI** appear in the extensions list with the configured icon.

---

### 5. Using LeetCoach AI on LeetCode

1. Ensure:
   - Ollama is running with `phi3`.  
   - FastAPI backend is running on `http://127.0.0.1:8000`.  
   - The extension is loaded and enabled.

2. Navigate to any LeetCode problem (for example `https://leetcode.com/problems/two-sum/`).  
3. Open the LeetCoach AI side panel:
   - Either click the extension icon, or  
   - Use the browser side panel button bound to LeetCoach AI.  
4. The extension will:
   - Read the problem title + description.  
   - Call `/analyze` to show explanation, approach, complexity, hints.  
   - Optionally call `/generate-code` to show a ready-to-paste C++ solution.

---

## Configuration and Customization

- **Model name**: change `MODEL_NAME = "phi3"` in `backend/main.py` to another Ollama model if desired.
- **Backend URL / port**:
  - Default: `http://127.0.0.1:8000` (used in `manifest.json` host permissions and in frontend JS).  
  - If you change it:
    - Update backend run command (host/port).  
    - Update `host_permissions` and any fetch URLs in `sidepanel.js` / `background.js`.
- **Target site**:
  - Currently restricted to LeetCode via `matches: ["*://*.leetcode.com/*"]` in `manifest.json`.  
  - To support other sites, extend this list and adjust `content.js` parsing.

---

## Development Notes

- The `backend/venv` folder in the repo is not required for users; it's just one environment snapshot.  
  You can safely delete it locally and create your own virtualenv.
- All model prompt logic and response parsing live in `backend/main.py`, making it easy to tweak the behavior:
  - Change the JSON keys for `/analyze`  
  - Adjust instructions for C++ generation in `/generate-code`
- Frontend layout and styling live in:
  - `sidepanel.html` – structure  
  - `sidepanel.css` and `style.css` – styling  
  - `sidepanel.js` – UI logic + API calls

---

## Roadmap Ideas

- Support multiple languages (Python, Java, etc.)  
- Add "explain my code" feature  
- Add topic-wise tracking and progress visualization  
- Add keyboard shortcuts for quick hint / explanation calls


## Contributing

PRs and issues are welcome.  
If you want to extend LeetCoach AI (new models, new sites, more features), feel free to fork and open a pull request.
