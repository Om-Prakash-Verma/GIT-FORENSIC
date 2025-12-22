
# 🕵️‍♂️ Git Time-Travel Debugger: Forensic Suite

[![Project Status: Production](https://img.shields.io/badge/Status-Production--Grade-success?style=for-the-badge)](https://github.com/Om-Prakash-Verma/GIT-FORENSICS)
[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Engine: Gemini 3](https://img.shields.io/badge/Engine-Gemini%203%20AI-4285F4?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Visuals: D3.js](https://img.shields.io/badge/Visuals-D3.js-F9A03C?style=for-the-badge&logo=d3.js)](https://d3js.org/)

> **"Code reveals what happened. Forensics reveals why it matters."**

**Git Time-Travel Debugger** (Forensic Suite) is an advanced, AI-augmented developer environment designed for high-stakes root-cause analysis. It bypasses the limitations of standard Git CLI outputs by providing a multi-dimensional HUD (Heads-Up Display) to isolate regressions, audit complex logic deltas, and perform visual binary searches across large-scale repository histories.

---

## 💎 The Forensic Arsenal

### 1. 🧠 AI-Powered Logic Auditing
Unlike standard diff tools that only highlight textual additions and deletions, our **Forensic Reasoning Engine** (leveraging Gemini 3 Pro) performs a semantic analysis of the code:
- **Semantic Intent Recovery**: Reconstructs the developer's likely intent behind complex refactors.
- **Micro-Logic Delta Detection**: Specifically identifies changes in state machine transitions, asynchronous execution flows, and high-order function mutations.
- **Regression Risk Profiling**: Predicts potential side effects and edge-case failures (e.g., race conditions, memory leaks) based on the current changeset.
- **Score-Based Risk Assessment**: Each commit is assigned a 0-100% "Regression Risk" score.

### 2. ⚡️ Visual Git Bisect HUD
Traditional `git bisect` is a manual, error-prone cognitive load. Our suite transforms it into a visual elimination game:
- **Log2 Search Optimization**: Calculates the mathematical midpoint of any commit range to minimize steps.
- **State Persistence**: Unlike CLI bisect, our HUD persists your search state in `localStorage`, allowing for deep audits over multiple sessions.
- **Culprit Isolation**: Automatically pins the "Suspected" commit once the search space collapses, triggering an immediate AI deep-dive of the isolated diff.

### 3. 🕸 Interactive D3.js Timeline
A high-performance, SVG-based navigation system:
- **Dynamic Scaling**: Effortlessly handles dense histories with hundreds of commits.
- **Contextual Visuals**: Nodes change color and state based on forensic markers (Good/Bad/Suspected/AI-High-Risk).
- **Temporal Navigation**: Scrub through history with smooth animations and instant state hydration.

---

## 🏛 Technical Architecture Deep-Dive

### **The Intelligence Layer (`GeminiService`)**
Designed for resilience and high-fidelity reasoning:
- **Dual-Model Fallback**:
  - **Tier 1 (Reasoning)**: `gemini-3-pro-preview` for complex diffs requiring high logic comprehension.
  - **Tier 2 (Latency/Availability)**: `gemini-3-flash-preview` for rapid analysis and large-batch history scans.
- **Structured Outputs**: Utilizes `responseSchema` to ensure AI responses are strictly valid JSON for seamless UI hydration.
- **Heuristic Backup**: A local statistical engine that estimates risk based on change volume and file volatility if the AI service is unreachable.

### **The Data Layer (`GitService`)**
High-performance GitHub REST API integration:
- **On-Demand Hydration**: Commits are initially fetched as shallow metadata. File diffs and patches are "hydrated" only when a commit is selected, optimizing bandwidth and rate limits.
- **Strict Validation**: Enforces GitHub-only imports to ensure source integrity and API compatibility.

### **The State Management Layer (Custom Hooks)**
The application is orchestrated via a decoupled state machine:
- `useGitRepo`: Manages the lifecycle of the repository, from initial import to per-commit hydration.
- `useGitBisect`: A pure-logic hook that implements the binary search algorithm, independent of the UI.

---

## 🚀 Deployment & Setup

### **Environment Variables**
This project requires a secure serverless environment to handle AI requests.
```env
API_KEY=your_gemini_api_key_here
```

### **Local Development**
1. **Clone**: Ensure you have Node.js 18+ installed.
2. **Install**: `npm install`
3. **Run**: `npm run dev`

### **Production Considerations**
- **API Rate Limits**: The GitHub API is restricted for unauthenticated requests. For high-volume usage, consider implementing a GitHub Token proxy in `gitService.ts`.
- **Serverless Limits**: The Vercel function for AI analysis is configured for a 60s timeout to allow for "Thinking" budget execution.

---

## 📂 System Roadmap
- [ ] **Dependency Graph Impact**: Visualize how a file change ripples through downstream imports.
- [ ] **Collaborative Forensic Reports**: Export an AI-annotated history report as a PDF/Markdown file.
- [ ] **Local Git Support**: Implementation of a WASM-based Git engine for local directory audits.

---

## 📜 Technical Stack
- **UI Architecture**: React 19 + TypeScript + Tailwind CSS
- **Visualizations**: D3.js (SVG Rendering)
- **Intelligence**: Google Gemini 3 (Pro/Flash)
- **Deployment**: Vercel Serverless (Node.js)
- **Persistence**: Browser `localStorage` with State Recovery

---

*Engineered by senior architects for those who require absolute precision in their version control workflows.*
