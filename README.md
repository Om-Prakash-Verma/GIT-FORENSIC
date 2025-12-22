
# Git Time-Travel Debugger (Forensic Suite)

A production-grade developer tool for visual commit history exploration, AI-powered logic analysis, and visual `git bisect` functionality.

## Core Features
- **Visual Commit Timeline**: Interactive D3.js powered visualization of repository history with search range highlighting.
- **Automated Visual Bisect**: UI-driven binary search to locate regressions with log2 efficiency.
- **Forensic AI Reasoning**: Integrates Gemini 3 Pro to perform deep logic audits on every commit, predicting regressions before they're confirmed.
- **Binary Search HUD**: Real-time progress tracking, estimated steps, and commit elimination status.
- **Side-by-Side Diff Engine**: High-fidelity line-by-line diffs with jump-to-file navigation.

## Architecture
- **Frontend**: React (SPA), Tailwind CSS, D3.js.
- **Git Layer**: `GitService` abstraction (Mocked for browser environment, ready for Node.js `spawn` integration).
- **AI Layer**: `GeminiService` using Google's Generative AI SDK with structured JSON schemas.
- **Design Language**: "Black and Gold" Forensic HUD — focusing on high-contrast readability and enterprise aesthetics.

## Setup Instructions
1. Ensure `process.env.API_KEY` is configured for Google Gemini API access.
2. Run `npm install` (if using a local Node environment).
3. Start the application.
4. Input a repository path to begin the forensic audit.

## Developer Note
This tool is designed for senior engineers performing deep root-cause analysis. It prioritizes data density and reasoning over simple "diffing".
