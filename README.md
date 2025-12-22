# 🕵️‍♂️ Git Time-Travel Debugger: Forensic Suite

[![Project Status: Production](https://img.shields.io/badge/Status-Production--Grade-success?style=for-the-badge)](https://github.com/Om-Prakash-Verma/GIT-FORENSICS)
[![Framework: React 19](https://img.shields.io/badge/Framework-React%2019-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Engine: Gemini 3](https://img.shields.io/badge/Engine-Gemini%203%20AI-4285F4?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Visuals: D3.js](https://img.shields.io/badge/Visuals-D3.js-F9A03C?style=for-the-badge&logo=d3.js)](https://d3js.org/)

> **"Code reveals what happened. Forensics reveals why it matters."**

**Git Time-Travel Debugger** is a production-grade developer tool built for deep root-cause analysis, semantic audit, and visual history exploration. It transforms raw Git diffs into actionable architectural insights using Gemini 3's advanced reasoning.

---

## 💎 The Forensic Toolkit

### 1. 🧠 Intelligent Logic Auditing
The **Forensic Reasoning Engine** (powered by Gemini 3 Pro/Flash) performs deep semantic audits:
- **Multi-Model Strategy**: Select high-reasoning **Thinking** models (Pro) for complex architectural pivots, or high-speed **Flash** models for rapid triage.
- **Predictive Failure Simulation**: Predicts exactly which component or flow is most likely to break first if a regression exists.
- **Hidden Coupling Detection**: Surfaces non-obvious dependencies (e.g., environment variables, shared state) that may cause side-effects.
- **Risk Score HUD**: Real-time regression risk profiling (0-100%).

### 2. 🕸 Visual Impact Graph
A dynamic D3.js force-directed graph that maps the "blast radius" of every commit:
- **Modified vs. Impacted**: Distinguishes between explicitly edited files and potentially affected imports.
- **Clustering**: Intuitively group related modules to visualize code locality.

### 3. ⚡️ Visual Git Bisect HUD
Accelerate bug-hunting with a visually assisted binary search:
- **Automated Midpoint Calculation**: Mathematically optimal search space reduction.
- **Visual Range Marking**: Clearly see "Good" and "Bad" boundaries in the timeline.

---

## 🏛 Technical Architecture

### **AI Dispatch Layer (`api/analyze.ts`)**
- **Tiered Execution**: Attempts high-fidelity reasoning with Gemini 3 Pro (Thinking) before falling back to latency-optimized Flash models.
- **Thinking Configuration**: Explicitly tuned `thinkingBudget` (16k) and `maxOutputTokens` (20k) to ensure deep reasoning without truncated JSON responses.
- **Structured JSON Schema**: Enforces strict OpenAI-compatible response schemas for reliable UI hydration.

### **State Management (`hooks/useGitRepo.ts`)**
- **Lazy Context Loading**: Commits are hydrated with full diffs only when selected.
- **State Guarding**: Prevents race conditions and state clearing during parallel hydration tasks, ensuring AI analysis remains visible during background operations.

---

## 🚀 Deployment

### **Environment Variables**
```env
API_KEY=your_gemini_api_key_here
```

### **Quick Start**
1. **Clone**: `git clone ...`
2. **Install**: `npm install`
3. **Run**: `npm run dev`
4. **Audit**: Paste a public GitHub URL to begin the forensic scan.

---

*Designed for senior software architects requiring absolute precision in root-cause investigation.*