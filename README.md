# 🚀 Git Forensics

> AI-assisted Git history explorer for commit inspection, diff analysis, visual bisect, and commit-risk reasoning.

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/Status-Learning_Project-ffb703?style=for-the-badge)
![AI Assisted](https://img.shields.io/badge/Built_With-AI_Assistance-111827?style=for-the-badge)
![License](https://img.shields.io/badge/License-Unclear-lightgrey?style=for-the-badge)

---

## 📌 Executive Summary

- This project lets a user paste a public GitHub repository URL and inspect recent commits in a visual interface.
- It shows commit metadata, file-level diffs, a simple dependency impact graph, and a guided "good/bad" bisect workflow.
- It also sends selected commit data to a serverless API route for Gemini-based commit analysis and risk scoring.
- Real-world use case: quickly understanding what changed in a suspicious commit and narrowing down where a regression may have started.
- Why it exists: to make Git history easier to inspect visually while experimenting with AI-assisted debugging ideas.

---

## 🧠 Learning Note

This project was built with AI assistance while learning development.

- Learning-focused project
- Code is being actively understood and improved
- Not all parts were written manually
- Some naming and architecture are more ambitious than the current implementation
- The strongest value of this repo is as a learning artifact and explainer project

---

## ✨ Features

- Public GitHub repository import from a URL input in [`components/LandingPage.tsx`](/D:/Github/GIT-FORENSIC/components/LandingPage.tsx)
- Commit timeline with category filters and volatility-based heatmap in [`components/Timeline.tsx`](/D:/Github/GIT-FORENSIC/components/Timeline.tsx)
- Commit hydration that lazily fetches patch data only when a commit is selected in [`hooks/useGitRepo.ts`](/D:/Github/GIT-FORENSIC/hooks/useGitRepo.ts)
- File list for changed files in the selected commit in [`components/FileExplorer.tsx`](/D:/Github/GIT-FORENSIC/components/FileExplorer.tsx)
- Parsed patch rendering with hunk and line-level diff display in [`components/DiffView.tsx`](/D:/Github/GIT-FORENSIC/components/DiffView.tsx) and [`services/diffParser.ts`](/D:/Github/GIT-FORENSIC/services/diffParser.ts)
- Dependency blast-radius graph built from import statements in [`services/dependencyService.ts`](/D:/Github/GIT-FORENSIC/services/dependencyService.ts) and shown in [`components/ImpactGraph.tsx`](/D:/Github/GIT-FORENSIC/components/ImpactGraph.tsx)
- Visual bisect flow with "mark good" and "mark bad" actions in [`hooks/useGitBisect.ts`](/D:/Github/GIT-FORENSIC/hooks/useGitBisect.ts)
- AI commit audit through a Vercel-style API endpoint in [`api/analyze.ts`](/D:/Github/GIT-FORENSIC/api/analyze.ts)
- Local persistence of loaded repository state and bisect session through `localStorage` in [`hooks/useGitRepo.ts`](/D:/Github/GIT-FORENSIC/hooks/useGitRepo.ts) and [`hooks/useGitBisect.ts`](/D:/Github/GIT-FORENSIC/hooks/useGitBisect.ts)

---

## 🛠️ Tech Stack

| Category | Tools |
|----------|------|
| Language | TypeScript |
| Frontend | React 19 |
| Build Tool | Vite 6 |
| Visualization | D3.js |
| AI SDK | `@google/genai` |
| Hosting Shape | Vercel-style frontend + serverless API route |
| Styling | Tailwind via CDN in `index.html` |

---

## 📁 Project Structure

```bash
GIT-FORENSIC/
├── api/
│   └── analyze.ts
├── components/
│   ├── CommitInfo.tsx
│   ├── DiffView.tsx
│   ├── FileExplorer.tsx
│   ├── ImpactGraph.tsx
│   ├── LandingPage.tsx
│   ├── MainHeader.tsx
│   ├── NavigationSidebar.tsx
│   ├── Timeline.tsx
│   └── Workspace.tsx
├── hooks/
│   ├── useGitBisect.ts
│   └── useGitRepo.ts
├── services/
│   ├── dependencyService.ts
│   ├── diffParser.ts
│   ├── geminiService.ts
│   └── gitService.ts
├── App.tsx
├── constants.tsx
├── index.html
├── index.tsx
├── metadata.json
├── package.json
├── tsconfig.json
├── types.ts
├── vercel.json
└── vite.config.ts
```

### Folder Guide

- `api/` -> serverless endpoint that sends commit data to Gemini
- `components/` -> the UI panels and layout pieces
- `hooks/` -> state management for repository loading and bisect workflow
- `services/` -> logic for GitHub API access, patch parsing, AI fallback, and impact graph generation
- Root files -> app bootstrapping, types, metadata, config, and HTML shell

---

## ⚙️ How It Works

1. The app starts in [`index.tsx`](/D:/Github/GIT-FORENSIC/index.tsx), which mounts [`App.tsx`](/D:/Github/GIT-FORENSIC/App.tsx).
2. `App` loads two custom hooks:
   - `useGitRepo` for repository data and AI analysis state
   - `useGitBisect` for the guided bisect workflow
3. If no repository is loaded, the user sees [`LandingPage.tsx`](/D:/Github/GIT-FORENSIC/components/LandingPage.tsx) and pastes a GitHub repository URL.
4. `useGitRepo.loadRepository()` calls [`GitService.loadRepository()`](/D:/Github/GIT-FORENSIC/services/gitService.ts), which:
   - validates that the input looks like a GitHub URL
   - fetches repo metadata from the GitHub REST API
   - fetches up to 100 commits
   - creates lightweight commit objects without full patch details yet
5. Once a commit is selected, `useGitRepo` checks whether that commit already has diff data.
6. If not, [`GitService.hydrateCommitDiffs()`](/D:/Github/GIT-FORENSIC/services/gitService.ts) fetches the full commit payload from GitHub and fills in:
   - changed files
   - file stats
   - raw patch text
   - heuristic category
   - volatility score
7. After hydration, [`DependencyService.buildImpactGraph()`](/D:/Github/GIT-FORENSIC/services/dependencyService.ts) scans import statements in the patch text and creates graph nodes and links.
8. The main workspace then renders:
   - timeline
   - changed-file explorer
   - diff viewer
   - impact graph
   - commit analysis panel
9. When the user clicks "Run Forensic Audit", the frontend sends the current commit to `/api/analyze`.
10. [`api/analyze.ts`](/D:/Github/GIT-FORENSIC/api/analyze.ts) calls Gemini in two passes:
    - a fast extraction pass
    - a deeper synthesis pass that returns structured JSON
11. The analysis is displayed in [`CommitInfo.tsx`](/D:/Github/GIT-FORENSIC/components/CommitInfo.tsx) as:
    - conceptual summary
    - risk score
    - failure simulation
    - hidden couplings
12. If bisect mode is active, the user marks commits as good or bad, and [`BisectEngine.calculateStep()`](/D:/Github/GIT-FORENSIC/services/gitService.ts) picks the next midpoint.

---

## 🔑 Key Files You Should Understand

- [`App.tsx`](/D:/Github/GIT-FORENSIC/App.tsx) -> top-level composition of repository state and bisect state
- [`hooks/useGitRepo.ts`](/D:/Github/GIT-FORENSIC/hooks/useGitRepo.ts) -> the most important state manager in the project
- [`services/gitService.ts`](/D:/Github/GIT-FORENSIC/services/gitService.ts) -> all GitHub loading, commit hydration, commit classification, and bisect math
- [`api/analyze.ts`](/D:/Github/GIT-FORENSIC/api/analyze.ts) -> AI integration and response shaping
- [`services/dependencyService.ts`](/D:/Github/GIT-FORENSIC/services/dependencyService.ts) -> simple impact graph generation
- [`components/Workspace.tsx`](/D:/Github/GIT-FORENSIC/components/Workspace.tsx) -> how the full UI is arranged
- [`components/Timeline.tsx`](/D:/Github/GIT-FORENSIC/components/Timeline.tsx) -> custom D3 timeline rendering
- [`components/ImpactGraph.tsx`](/D:/Github/GIT-FORENSIC/components/ImpactGraph.tsx) -> force-graph visualization

---

## 🧩 Important Code Explained

### 1. Repository Loading

- `GitService.loadRepository()` only supports GitHub URLs
- It does not read a local `.git` folder
- That is important because some UI wording suggests "path" or "trace origin", but the real implementation is URL-based

### 2. Lazy Diff Hydration

- The project does not download every patch immediately
- It first loads basic commit history
- Full diff data is fetched only for the selected commit
- This keeps the initial load lighter and is one of the more practical design choices in the codebase

### 3. Heuristic Volatility Score

- `calculateVolatility()` creates a rough 0-100 risk score
- It uses:
  - insertions
  - deletions
  - files changed
  - commit category weight
- This is not a proven metric; it is a heuristic to highlight possibly risky commits

### 4. Impact Graph Logic

- The dependency graph is inferred from import statements found inside patch text
- It tries to resolve:
  - relative imports like `../file`
  - alias imports like `@/...`
  - nearby files in the same directory
- This is useful for visualization, but it is not a full static analysis engine

### 5. AI Analysis Pipeline

- The serverless function receives the selected commit and samples the biggest changed files
- It asks Gemini for a dense technical scan first
- Then it asks for structured JSON with summary, risk, fixes, and failure predictions
- If AI fails, there is a heuristic fallback path in [`services/geminiService.ts`](/D:/Github/GIT-FORENSIC/services/geminiService.ts), although that service is currently not used by `useGitRepo`

### 6. Visual Bisect

- Bisect state is stored in the browser
- The algorithm narrows the search range using midpoint selection
- It is not calling the real `git bisect` CLI
- Instead, it simulates the decision process in the UI

---

## ⚙️ Configuration

| File | Purpose |
|------|---------|
| [`vite.config.ts`](/D:/Github/GIT-FORENSIC/vite.config.ts) | Vite dev server config, alias setup, and env injection |
| [`vercel.json`](/D:/Github/GIT-FORENSIC/vercel.json) | Rewrite rules for SPA routing and API paths |
| [`tsconfig.json`](/D:/Github/GIT-FORENSIC/tsconfig.json) | TypeScript compiler settings |
| [`metadata.json`](/D:/Github/GIT-FORENSIC/metadata.json) | Project metadata used by the hosting/editor environment |
| [`index.html`](/D:/Github/GIT-FORENSIC/index.html) | HTML shell, Tailwind CDN config, fonts, SEO, import map |

### Notable Configuration Notes

- Tailwind is used through the CDN in `index.html`, not through the usual PostCSS/Tailwind project setup
- `vite.config.ts` defines `process.env.GEMINI_API_KEY` and `process.env.API_KEY` on the client bundle, but the serverless API route reads `process.env.API_KEY`
- No `.env.example` file exists in the repository
- `index.html` references `/index.css`, but no `index.css` file exists in this repository

---

## 🔐 Environment Variables

| Variable | Purpose | Required |
|----------|--------|----------|
| `API_KEY` | Used by `api/analyze.ts` as the server-side Gemini key | Yes for AI analysis |
| `GEMINI_API_KEY` | Read in `vite.config.ts` and injected into the frontend build config | Inferred / likely intended |

### Notes

- Based on code, the API route will fail without `API_KEY`
- It is unclear whether the frontend injection of `GEMINI_API_KEY` is still needed
- There is no checked-in env documentation file

---

## 🚀 Installation & Setup

```bash
# 1. install dependencies
npm install

# 2. create an env file
# example values inferred from code:
API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

# 3. start the dev server
npm run dev
```

### Current Workspace Note

- A local build check was attempted on April 15, 2026
- It failed because project dependencies are not installed in this workspace yet
- Error observed: `vite` was not found

---

## ▶️ How to Run

### Development

```bash
npm install
npm run dev
```

Open the app in the browser, then:

1. Paste a public GitHub repository URL
2. Load commit history
3. Click a commit
4. Inspect file diffs and impact graph
5. Optionally run AI analysis
6. Optionally start visual bisect mode

### Production Build

```bash
npm run build
npm run preview
```

### Important Runtime Limitation

- The current code supports public GitHub repositories through the GitHub API
- It does not clone repositories or inspect local repositories directly

---

## 🌐 API / Interfaces

### Frontend Interface

- Single-page React application
- Main views:
  - landing/import page
  - timeline
  - file explorer
  - diff viewer
  - impact graph
  - commit analysis panel

### Internal API

| Route | Method | Purpose |
|------|--------|---------|
| `/api/analyze` | `POST` | Sends commit data to Gemini and returns structured analysis |

### External APIs

| Service | Usage |
|--------|------|
| GitHub REST API | Repository metadata, commit list, commit file diffs |
| Google Gemini API | Commit reasoning and structured audit output |

---

## 💾 Data Handling

- Repository metadata and commit history are stored in React state
- Trimmed repository state is persisted to `localStorage`
- Bisect state is also persisted to `localStorage`
- Patch text is fetched on demand
- There is no database
- There is no server-side persistence in this repo

### What Gets Stored in the Browser

- selected repository metadata
- commit list
- selected commit hash
- selected file path
- previous short AI summaries
- bisect progress

---

## 🔌 External Integrations

- GitHub API for repo and commit inspection
- Gemini via `@google/genai` for AI analysis
- D3.js for custom SVG visualizations
- Vercel-style serverless API structure for deployment

---

## 🧪 Testing

- No automated tests were found
- No `tests/` directory was found
- No test script exists in `package.json`

### What should ideally be tested next

- `GitService.loadRepository()`
- `GitService.hydrateCommitDiffs()`
- `BisectEngine.calculateStep()`
- `DiffParser.parsePatch()`
- `DependencyService.buildImpactGraph()`
- `/api/analyze` failure handling

---

# 🧠 Understanding This Project

## 🎯 What You MUST Understand for Interviews

- How the app loads GitHub commits and only hydrates one commit at a time
- The difference between heuristic analysis and AI-generated analysis
- How the bisect midpoint is calculated in the frontend
- That the impact graph is inferred from patch text, not full repository parsing
- That the app is mainly a frontend visualization project with one AI API route

## 🔄 Core Logic Explained Simply

When a user enters a GitHub repo URL -> the app fetches commit history -> when a commit is clicked it fetches detailed file changes -> it renders the diff and impact graph -> if the user requests AI help it sends the commit to Gemini -> the UI shows a risk summary and possible failure points.

## ⚠️ Confusing Parts

- The UI language sounds like a full forensic debugger, but the actual implementation is lighter and browser-based
- The app name suggests local Git inspection, but the code only supports GitHub URLs
- `GeminiService` contains fallback logic, but `useGitRepo` calls `fetch('/api/analyze')` directly instead of using that service
- `vite.config.ts` injects Gemini-related env vars into the client, while the API route separately expects `API_KEY`
- `index.html` points to `/index.css`, but that file is missing

## 🤖 AI-Generated Patterns

- Big naming and branding compared to the actual scope of the code
- Some extra abstraction that is not fully used, such as `GeminiService`
- Comments like "Fix:" suggest iterative AI-assisted patching
- Some logic is practical, but some UX text overstates current capability
- The design is polished visually, but the README should present it as a learning project, not a production-ready forensic platform

---

## 🎤 How to Explain This Project in Interview

This is a learning project where I explored how to make Git history easier to understand visually. The app takes a public GitHub repository, shows commit history, lets you inspect diffs, highlights likely impact areas, and adds an AI-generated summary for a selected commit. I also built a simple visual bisect flow so a user can narrow down where a bug may have started.

### 🗣️ Example Answer

> I built a React and TypeScript project called Git Forensics. It loads commit history from a public GitHub repository using the GitHub API, then lazily fetches patch details for the commit the user selects. The app shows the changed files, renders the patch, builds a simple dependency impact graph from imports, and can send the commit to a Gemini-backed API route for a structured risk summary. It also includes a browser-side bisect workflow to help narrow down suspicious commits. The project was built with AI assistance as part of my learning process, so I understand both what works well and where the code still needs cleanup and stronger testing.

---

# 💼 For Hiring Managers

## 👨‍💻 Candidate Summary

- Learning-oriented developer using AI as a productivity and exploration tool
- Comfortable building complete small applications across frontend, API, and integration layers
- Actively improving code understanding instead of hiding AI assistance

## 🚀 What This Project Shows

- Ability to connect a UI to external APIs
- Ability to model domain-specific data in TypeScript
- Ability to build custom visualizations instead of only using prebuilt components
- Ability to combine product thinking with technical experimentation

## ⚡ Key Highlights

- Custom D3 timeline and force graph
- Lazy loading of commit patch data
- Browser-side state persistence
- Structured AI analysis endpoint
- Beginner-friendly but non-trivial app flow

## 🧰 Skills Demonstrated

- React
- TypeScript
- Vite
- API integration
- D3 visualization
- state management with hooks
- JSON schema-driven AI output
- UI composition

## 📊 Complexity Level

- Honest rating: Beginner to Intermediate
- Stronger than a basic CRUD demo
- Not yet at production quality because testing, robustness, and configuration polish are missing

## ✅ Strengths

- Clear product idea
- Interesting visual presentation
- Good use of lazy loading for commit detail
- Practical use of typed domain models
- Honest opportunity to discuss tradeoffs and learning decisions

## ⚠️ Improvements

- Add tests
- Clean up unused or duplicated patterns
- Resolve environment variable confusion
- Add real error handling and rate-limit handling for GitHub/Gemini APIs
- Decide whether the product is GitHub-only or true local Git analysis

## ❓ Interview Questions

- Why did you choose lazy diff hydration instead of loading all commit details immediately?
- How would you make the impact graph more accurate?
- What are the risks of relying on AI-generated commit explanations?
- How would you support private repositories?
- How would you redesign the bisect flow to use real Git data or CLI output?

## 🧾 Recruiter TL;DR

This is a thoughtful learning project built with React, TypeScript, D3, and Gemini integration. It demonstrates API usage, UI state management, visualization work, and honest AI-assisted development. The code shows curiosity and practical implementation ability, while also leaving clear room for stronger testing and architectural cleanup.

---

# 📈 How to Improve This Project

- Add a proper `.env.example`
- Add unit tests for the services and bisect engine
- Fix the missing `index.css` reference or add the file
- Decide on one env var name for Gemini access and use it consistently
- Remove unused abstractions or route all AI calls through `GeminiService`
- Add loading/error states for GitHub API rate limits
- Support pagination for more than 100 commits
- Improve import resolution in the impact graph
- Add support for private repositories with authenticated GitHub requests
- If desired, add true local Git support with a backend or desktop wrapper

---

# 📦 Appendix

## Quick Reality Check

- ✅ Nice visual interface
- ✅ Real GitHub API integration
- ✅ Real AI-backed endpoint
- ✅ Useful learning value
- ❗ No test suite yet
- ❗ No documented env template yet
- ❗ Build not verified in this workspace because dependencies are not installed
- ❗ Some product wording is bigger than the current implementation

## Inferred / Unclear Items

- License is unclear because no license file was found
- Deployment target appears to be Vercel, inferred from `vercel.json` and `api/`
- `GEMINI_API_KEY` usage on the frontend is inferred from `vite.config.ts`, but the server route clearly requires `API_KEY`
- The repository appears intended for public GitHub URLs only, based on current code
