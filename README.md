
# 🕵️‍♂️ Git Time-Travel Debugger: Forensic Suite

[![Project Status: Production](https://img.shields.io/badge/Status-Production--Grade-success?style=for-the-badge)](https://github.com/Om-Prakash-Verma/GIT-FORENSICS)
[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Engine: Gemini 3](https://img.shields.io/badge/Engine-Gemini%203%20AI-4285F4?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Visuals: D3.js](https://img.shields.io/badge/Visuals-D3.js-F9A03C?style=for-the-badge&logo=d3.js)](https://d3js.org/)

> **"Code reveals what happened. Forensics reveals why it matters."**

**Git Time-Travel Debugger** (Forensic Suite) is a high-fidelity developer utility built for deep root-cause analysis, semantic audit, and visual history exploration. It leverages the advanced reasoning capabilities of Gemini 3 to transform standard diffs into actionable architectural insights.

---

## 💎 The Forensic Toolkit

### 1. 🧠 Intelligent Logic Auditing
The **Forensic Reasoning Engine** (powered by Gemini 3 Pro/Flash) performs deep semantic audits on every changeset:
- **Multi-Model Strategy**: Choose between high-reasoning "Thinking" models (Gemini 3 Pro) for complex logic or high-speed "Flash" models for rapid history scrubbing.
- **Predictive Failure Simulation**: Identifies the specific component or state machine transition most likely to fail as a result of the changeset.
- **Hidden Coupling Detection**: Surfaces non-obvious dependencies that may cause regression in distant modules.
- **Risk Score HUD**: Real-time regression risk profiling (0-100%).

### 2. 🕸 Visual Impact Graph
A dynamic D3.js force-directed graph that maps the "blast radius" of a commit:
- **Modified vs. Impacted**: Clearly distinguishes between files that were edited and those that are likely affected via imports.
- **Force-Directed Layout**: Intuitively clusters related modules to visualize code locality and dependency debt.

### 3. ⚡️ Visual Git Bisect HUD
Accelerate bug hunting with a visually assisted binary search:
- **Automated Midpoint Calculation**: Mathematically optimal search space reduction.
- **State Persistence**: Your forensic search progress is saved locally, allowing you to pause and resume audits across sessions.

---

## 🏛 Technical Architecture

### **AI Dispatch Layer (`api/analyze.ts`)**
- **Tiered Execution**: A robust backend pipeline that attempts analysis with Gemini 3 Pro (with thinking budget enabled) before falling back to faster Flash models.
- **Payload Optimization**: Intelligent diff truncation ensures that the most relevant lines are prioritized within the LLM's context window.
- **Structured Outputs**: Strictly enforced JSON schema validation via `@google/genai` to ensure consistent UI hydration.

### **State Orchestration (`hooks/useGitRepo.ts`)**
- **Lazy Hydration**: Commit metadata is loaded initially, while full patches and AI audits are hydrated on-demand to optimize bandwidth.
- **Context Locking**: Prevents race conditions during asynchronous AI reasoning to ensure forensic data remains synced with the selected commit.

---

## 🚀 Deployment & Configuration

### **Environment Variables**
```env
API_KEY=your_gemini_api_key_here
```

### **Quick Start**
1. **Clone & Install**: `npm install`
2. **Launch Trace**: `npm run dev`
3. **Import Trace**: Paste any public GitHub URL (e.g., `https://github.com/facebook/react`) to begin the audit.

---

*Designed for senior architects and security researchers who require absolute precision in their version control workflows.*
