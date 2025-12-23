# 🕵️‍♂️ Git Time-Travel Debugger: Forensic Suite

[![Project Status: Production](https://img.shields.io/badge/Status-Production--Grade-success?style=for-the-badge)](https://github.com/Om-Prakash-Verma/GIT-FORENSICS)
[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Engine: Gemini 3](https://img.shields.io/badge/Engine-Gemini%203%20AI-4285F4?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Visuals: D3.js](https://img.shields.io/badge/Visuals-D3.js-F9A03C?style=for-the-badge&logo=d3.js)](https://d3js.org/)

> **"Code reveals what happened. Forensics reveals why it matters."**

**Git Time-Travel Debugger** is an advanced developer utility designed for high-stakes root-cause analysis, architectural audit, and semantic version control exploration. By integrating **Gemini 3 Pro** reasoning with **D3.js** data visualization, it transforms standard Git history into a multidimensional forensic map.

---

## 💎 Core Forensic Intelligence Features

The "Forensic Intelligence" section provides deep, AI-driven insights into every commit, moving beyond simple diffs to provide actionable architectural metadata:

### 1. 🧠 Architectural Pivot Analysis
*   **Feature**: Conceptual Summary of Intent.
*   **Logic**: Instead of describing *what* changed (e.g., "added a function"), the engine identifies the *technical pivot* or core architectural shift.
*   **Value**: Instantly understand if a commit introduces a new design pattern, shifts state management, or changes a fundamental protocol.

### 2. 📈 Regression Risk Profile
*   **Feature**: 0-100% Probability Scoring.
*   **Logic**: Uses a combination of churn volume, file volatility, and semantic complexity to calculate the likelihood of an introduced bug.
*   **Value**: Allows leads to prioritize high-risk (60%+) commits for manual peer review during deep-dive sessions.

### 3. 🛡️ Failure Path Simulation
*   **Feature**: "First Break" Prediction.
*   **Logic**: The AI simulates runtime execution over the changeset to predict the specific component, state transition, or user flow most likely to fail first if a regression exists.
*   **Value**: Tells testers exactly where to look first during regression testing.

### 4. 🕸️ Hidden Coupling Scan
*   **Feature**: Non-Obvious Dependency Detection.
*   **Logic**: Identifies "ghost dependencies"—side effects that aren't visible through standard imports, such as environment variable assumptions, shared database table expectations, or global CSS collisions.
*   **Value**: Prevents "spooky action at a distance" where a change in one module breaks an unrelated part of the system.

### 5. 🛠️ Remediation Protocol
*   **Feature**: Actionable Fix Strategies.
*   **Logic**: Provides a prioritized list of strategies to mitigate identified risks, ranging from specific unit test cases to suggested refactoring steps.
*   **Value**: Shortens the "Time to Resolution" (TTR) by providing the fix strategy alongside the bug discovery.

### 6. ⚠️ Primary Danger Reasoning
*   **Feature**: Worst-Case Scenario Audit.
*   **Logic**: Isolates the single most dangerous architectural flaw or "danger zone" introduced by the change.
*   **Value**: Focuses the architect's attention on the most critical vulnerability.

### 7. 📖 Technical Intent & Logic Tracing
*   **Feature**: Semantic Logic Summary.
*   **Logic**: A high-fidelity breakdown of every significant logic change within the commit, translated into clear technical English.
*   **Value**: Bridges the gap between raw patch files and architectural understanding for rapid onboarding and audit.

---

## 🏛 Technical Architecture

### **AI Dispatch Tier (`api/analyze.ts`)**
*   **Tiered Fallback**: Attempts analysis with **Gemini 3 Pro** (4k thinking budget / 30k output ceiling) for maximum reasoning depth, falling back to **Gemini 3 Flash** if latency limits are reached.
*   **Context Optimization**: Intelligently truncates diff payloads to ensure the most critical lines of a patch are prioritized within the LLM's context window.

### **Visual Impact Graph (`components/ImpactGraph.tsx`)**
*   **Blast Radius Visualization**: A D3-powered force-directed graph that maps modified files to their potentially impacted neighbors based on directory structure and import parsing.

### **Git Bisect HUD (`hooks/useGitBisect.ts`)**
*   **Binary History Search**: A state-machine driven interface for quickly isolating the specific commit that introduced a regression using standard "Good/Bad" marking logic.

---

## 🛠 Usage Protocol
1.  **Import**: Paste a public GitHub URL into the landing page.
2.  **Scrub**: Use the Timeline to find areas of high volatility (gold glow).
3.  **Audit**: Select a commit and click "Run Forensic Audit." 
4.  **Trace**: Use the Impact Graph to see which distant files might break because of the current change.
5.  **Bisect**: If a bug is found, use the search icon in the sidebar to enter Bisect mode and isolate the culprit.

---

*Designed for senior software architects and security researchers who require absolute precision in their version control workflows.*