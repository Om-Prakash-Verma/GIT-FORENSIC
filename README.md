# 🕵️‍♂️ Git Time-Travel Debugger: Forensic Suite

[![Project Status: Production](https://img.shields.io/badge/Status-Production--Grade-success?style=for-the-badge)](https://github.com/Om-Prakash-Verma/GIT-FORENSICS)
[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Engine: Gemini 3](https://img.shields.io/badge/Engine-Gemini%203%20AI-4285F4?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Visuals: D3.js](https://img.shields.io/badge/Visuals-D3.js-F9A03C?style=for-the-badge&logo=d3.js)](https://d3js.org/)

> **"Code reveals what happened. Forensics reveals why it matters."**

**Git Time-Travel Debugger** is an advanced developer utility designed for high-stakes root-cause analysis, architectural audit, and semantic version control exploration. By integrating **Gemini 3 Pro** reasoning with **D3.js** data visualization, it transforms standard Git history into a multidimensional forensic map.

---

## 💎 Core Forensic Features

### 1. 🧠 AI Forensic Reasoning Engine
The heart of the suite is a tiered AI pipeline that performs deep semantic inspection of every changeset.

*   **Multi-Model Intelligence**: 
    *   **Gemini 3 Pro (Thinking Mode)**: Utilizes a dedicated reasoning budget to perform complex architectural audits, identifying non-obvious logic pivots.
    *   **Gemini 3 Flash**: Optimized for high-speed triage and rapid history scrubbing.
*   **Predictive Failure Simulation**: Unlike standard linters, the engine predicts the specific component or state transition most likely to fail first ("First Break" analysis).
*   **Hidden Coupling Detector**: Surfaces dependencies that aren't visible in import statements, such as environment variable shifts, shared global state, or distant database schema expectations.
*   **Structural Risk Profiling**: Generates a 0-100% **Regression Risk Score** based on churn volume, logic complexity, and file volatility.

### 2. 🕸 Visual Impact Graph (Blast Radius)
A dynamic, force-directed D3.js graph that visualizes the "ripple effect" of a commit across the codebase.

*   **Node Categorization**: Distinguishes between **Modified Nodes** (files edited) and **Impacted Nodes** (files likely affected via imports or proximity).
*   **Dependency Mapping**: Uses regex-based import parsing to map actual file relationships in real-time.
*   **Entropy Clustering**: Groups related modules based on directory structure and import frequency to show "code locality."

### 3. ⚡️ Visual Git Bisect HUD
A mathematically optimized interface for hunting regressions in large histories.

*   **Binary Search Optimization**: Automatically calculates the search space midpoint to reduce the number of steps required to find a bug.
*   **Forensic Marking**: Tag commits as "Good" or "Bad" to visually eliminate massive ranges of history instantly.
*   **Persistence**: Bisect sessions are saved to local storage, allowing you to resume complex hunts after a browser restart.

### 4. 📈 Volatility Heatmap Timeline
A custom SVG-based timeline that provides a high-level overview of repo health.

*   **Churn Visualization**: Uses a neighborhood-averaging algorithm to show "spikes" in file volatility.
*   **Category Filtering**: Instantly toggle visibility for `feat`, `fix`, `logic`, or `refactor` commits to focus on high-signal changes.
*   **Active Tracking**: Syncs the viewport automatically to ensure the selected node is always centered.

### 5. 🔍 High-Fidelity Diff Viewer
A specialized source viewer optimized for technical audits.

*   **Semantic Highlighting**: Categorizes hunks based on the type of change (Added/Removed/Modified).
*   **Sticky Context**: File headers and hunk markers remain visible during long scrolls, ensuring you never lose track of which module you are auditing.

---

## 🏛 Technical Architecture

### **AI Dispatch Tier (`api/analyze.ts`)**
*   **Tiered Fallback**: Attempts analysis with **Gemini 3 Pro** (4k thinking budget / 30k output ceiling) for maximum reasoning depth, falling back to **Gemini 3 Flash** if latency limits are reached.
*   **Context Optimization**: Intelligently truncates diff payloads to ensure the most critical lines of a patch are prioritized within the LLM's context window.
*   **Schema Enforcement**: Strictly validates AI output against a custom `AIAnalysis` interface to prevent UI hydration failures.

### **State Orchestration Layer (`hooks/useGitRepo.ts`)**
*   **Lazy Hydration**: Initially loads lightweight metadata, only fetching heavy diff patches and impact maps when a specific commit is selected to save bandwidth.
*   **State Guarding**: Implements a `currentHashRef` locking mechanism to prevent race conditions where background hydration might overwrite a fresh AI analysis.

### **Dependency Analysis (`services/dependencyService.ts`)**
*   **Regex-Based Trace**: Scans patches for `import`, `require`, and `from` keywords to build a real-time dependency tree without needing a full build environment.

---

## 🚀 Deployment & Setup

### **Environment Requirements**
*   **Node.js**: v18+ 
*   **API Key**: A valid Google Gemini API Key.

### **Configuration**
1. Clone the repository.
2. Create a `.env` or set the environment variable:
   ```env
   API_KEY=your_gemini_api_key_here
   ```
3. Install dependencies: `npm install`
4. Start the forensic suite: `npm run dev`

---

## 🛠 Usage Protocol
1.  **Import**: Paste a public GitHub URL into the landing page.
2.  **Scrub**: Use the Timeline to find areas of high volatility (gold glow).
3.  **Audit**: Select a commit and click "Run Forensic Audit." Select "Gemini 3 Pro" for architectural changes.
4.  **Trace**: Use the Impact Graph to see which distant files might break because of the current change.
5.  **Bisect**: If a bug is found, use the search icon in the sidebar to enter Bisect mode and isolate the culprit.

---

*Designed for senior software architects and security researchers who require absolute precision in their version control workflows.*