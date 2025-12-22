
# 🕵️‍♂️ Git Time-Travel Debugger: Forensic Suite

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **"Traditional git logs are for historians. Git Forensics is for detectives."**

**Git Time-Travel Debugger** is a production-grade developer tool designed for senior engineers performing deep root-cause analysis. It transforms the linear history of a repository into a multi-dimensional workspace for locating regressions, auditing logic changes, and understanding complex deltas through the lens of Artificial Intelligence.

---

## 🏛 Core Forensic Pillars

### 1. 🔍 The AI Logic Audit (Powered by Gemini 3)
Traditional diffs show *what* changed. Our AI Logic Audit tells you *why* it matters.
- **Micro-Logic Detection**: Automatically identifies changes in loops, async flows, and state mutations.
- **Regression Prediction**: Gemini 3 Pro performs a forensic analysis to predict edge cases and potential race conditions before you even run the code.
- **Probability Scoring**: Each commit is assigned a 0-100% "Bug Probability Score" based on complexity, change volume, and heuristic risk factors.

### 2. ⚡️ Visual Binary Search (Git Bisect HUD)
Manual `git bisect` is error-prone. Our HUD visualizes the search space.
- **Log2 Efficiency**: Automatically calculates the optimal midpoint in your history.
- **Commit Elimination**: Visually grays out eliminated commits as you mark "Good" or "Bad" nodes.
- **Suspect Isolation**: Pins the specific "Suspected" commit once the search space collapses to a single node.

### 3. 🕸 Interactive History Timeline
- **D3.js Powered**: A high-performance SVG timeline that handles dense commit histories with ease.
- **Contextual Highlighting**: Visualizes the active search range during bisect operations.
- **One-Click Navigation**: Instantly jump between snapshots to see the repository as it existed in that exact moment.

---

## 🛠 Technical Architecture

### **The Intelligence Layer (`GeminiService`)**
Utilizes a sophisticated multi-model fallback strategy:
- **Primary**: `gemini-3-pro-preview` for high-reasoning logic audits and "Thinking" capabilities.
- **Fallback**: `gemini-3-flash-preview` for rapid analysis if throughput limits are reached.
- **Heuristic Engine**: A local fallback that analyzes commit stats (insertions/deletions) when offline.

### **The Git Simulation Engine (`GitService`)**
A polymorphic service that handles:
- **Remote GitHub Fetching**: Real-time integration with the GitHub REST API (v3) to pull public repository metadata and commit diffs.
- **Local Simulation**: A high-fidelity mock engine for demonstration purposes, mimicking large enterprise repositories.

### **The UI/UX: "Black & Gold HUD"**
Designed with a "Cyber-Forensic" aesthetic:
- **High Contrast**: Deep blacks (`#020617`) and Amber/Gold highlights for critical data.
- **Data Density**: Optimized for large monitors while remaining fully responsive for tablet-based "on-the-go" audits.
- **Visual Feedback**: Real-time animations for hydration (fetching diffs) and AI processing.

---

## 🚀 Getting Started

### Prerequisites
- **Gemini API Key**: Requires an active `process.env.API_KEY`.
- **Connectivity**: High-speed internet is recommended for GitHub hydration.

### Usage
1. **Import**: Paste a GitHub URL or a local path into the entry portal.
2. **Explore**: Scroll through the timeline to find the general area of interest.
3. **Audit**: Select a commit and click **"Run Logic Audit"** to engage the AI detective.
4. **Bisect**: If a bug is confirmed, click the **Search** icon to begin a Visual Bisect. Mark commits until the culprit is isolated.

---

## 📊 Project Structure
```text
/src
  ├── services/         # Logic cores (AI, Git, Parsers)
  ├── components/       # Atomic UI elements (Timeline, Diff, Audit)
  ├── types.ts          # Strict TypeScript definitions
  ├── constants.tsx     # Theme colors and SVG icons
  └── api/              # Secure serverless endpoints
```

## 🔮 Roadmap
- [ ] **Multi-Branch Correlation**: Compare logic flows across different branches.
- [ ] **Dependency Graph Integration**: See how a commit affects downstream modules.
- [ ] **Team Collaboration**: Export forensic reports as shared URLs for PR reviews.

---

*Built with precision for the modern software detective.*
