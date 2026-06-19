# 🌱 CarbonLens

**Your carbon footprint, kept like a ledger.**

CarbonLens treats daily emissions the way a bank statement treats money: every logged trip, meal, or energy use posts as a **debit**; every completed reduction action posts as a **credit**. The running balance is your real, personalized footprint — not a generic score.

---

## Understand → Track → Reduce

CarbonLens is organized around three pillars:

### 1. Understand
- **Balance Card** — compares your logged total against a global daily average and a climate-aligned target.
- **AI Carbon Coach** — sends your context (daily totals, streak, carbon budget) to Google Gemini for personalized recommendations.
- **Graceful degradation** — if Gemini is unavailable (no key, quota, or network failure), the platform transparently falls back to a deterministic local rules engine, so advice is always available. Every response is tagged with its source (`gemini` or `rules_fallback`).

### 2. Track
- **Emissions Ledger** — every logged item appears as a line item, keeping your history visible and auditable.
- **Weekly Analytics** — a chart of daily emissions vs. target over the last 7 days.
- **Persistent storage** — entries are saved per anonymous device ID to Google Firestore, with a local JSON fallback for offline development.

### 3. Reduce
- **Personalized actions** — recommendations ranked by estimated savings, targeting your highest-impact category first.
- **Completing actions posts a credit** that directly offsets your running balance.

---

## Architecture

```
carbonlens/
├── src/                      React + Vite frontend
│   ├── lib/
│   │   ├── emissionFactors.js   — source of truth for emission factors
│   │   ├── calculations.js      — pure functions: emissions math, streaks, comparisons
│   │   ├── recommendations.js   — pure functions: ranking engine for action items
│   │   └── __tests__/           — unit tests for the above
│   ├── hooks/
│   │   └── useCarbonLedger.js   — state, settings, and API client hook
│   └── components/
│       ├── AICoach              — AI carbon coach advice card
│       ├── SettingsModal        — budget, key, and data-reset settings
│       ├── BalanceSummary       — top-level metrics display
│       ├── WeeklyChart          — 7-day emissions chart
│       ├── CategoryBreakdown    — category-level analytics
│       ├── LogEntryForm         — entry input form
│       ├── Ledger                — debit/credit ledger view
│       └── ErrorBoundary         — catches render errors, prevents full-app crashes
│
└── backend/                  FastAPI backend
    ├── app/
    │   ├── main.py               — app entrypoint, CORS, static file serving
    │   ├── routes.py              — API endpoints
    │   └── services/
    │       ├── gemini_service.py     — Google Gemini integration (google-genai SDK)
    │       ├── firestore_service.py  — Firestore persistence, local JSON fallback
    │       └── rules_engine.py       — deterministic advice engine
    └── tests/
        └── test_backend.py        — API route tests
```

Calculation and recommendation logic on the frontend is framework-free — pure functions that are fully testable and portable independent of React.

---

## Tech Stack

| Layer        | Technology                                  |
|---------------|----------------------------------------------|
| Frontend      | React 19, Vite, JavaScript                   |
| Backend       | Python 3.12, FastAPI, Uvicorn, Pydantic v2   |
| Database      | Google Firestore (local JSON fallback in dev)|
| AI            | Google Gemini (`google-genai` SDK)            |
| Testing       | Vitest (frontend), pytest (backend)           |
| Deployment    | Docker                                        |

---

## API Endpoints

| Method & Path                  | Purpose                                      |
|---------------------------------|-----------------------------------------------|
| `GET /api/health`               | Liveness/readiness probe                      |
| `POST /api/insights`            | Personalized reduction advice (Gemini → rules fallback) |
| `POST /api/entries`             | Save a ledger snapshot for a device           |
| `GET /api/entries/{device_id}`  | Retrieve a device's saved entries             |

---

## Running Locally

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows PowerShell
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Create a .env file with:
#   USE_FIRESTORE=true
#   USE_GEMINI=true
#   GEMINI_API_KEY=your_key_here
#   GOOGLE_APPLICATION_CREDENTIALS=credentials.json

uvicorn app.main:app --reload
```

### Frontend
```bash
npm install
npm run dev      # proxies /api to http://localhost:8000
```

### Tests
```bash
# Frontend — 58 tests
npm test

# Backend — 8 tests
cd backend
pytest -v
```

---

## Security Notes

- CORS is restricted to the frontend's known origin(s), not wildcarded.
- The Gemini API key lives only in the backend's environment — it is never accepted from or echoed to the client.
- Firestore access uses a service account with least-privilege (`Cloud Datastore User`) permissions, never embedded in the repository.

---

## Assumptions

- **Awareness, not audit.** Emission factors are representative public estimates for education, not certified carbon accounting.
- **Anonymous by design.** No login. A randomly generated device ID (stored client-side) keys a user's history.
- **Gemini is best-effort.** When unreachable or disabled, the rules engine guarantees the app still returns quantified, useful advice.

---

## License

MIT
