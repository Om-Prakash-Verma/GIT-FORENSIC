
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, Commit } from "../types";

export class GeminiService {
  constructor() {
    // Client initialization is deferred to the method call to ensure context-fresh API keys.
  }

  async analyzeCommit(commit: Commit): Promise<AIAnalysis> {
    // Initialize the AI client immediately before use to adhere to security and race condition guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const diffContext = commit.diffs.map(d => {
      return `### FILE: ${d.path} (${d.changes})\nOLD VERSION:\n${d.oldContent}\nNEW VERSION:\n${d.newContent}`;
    }).join('\n\n');
    
    const prompt = `
      Act as a world-class senior software architect and static analysis specialist.
      Perform a deep-dive forensic audit of the following Git commit.
      
      [CONTEXT]
      Commit Message: ${commit.message}
      Author: ${commit.author}
      Stats: +${commit.stats.insertions} / -${commit.stats.deletions} lines, ${commit.stats.filesChanged} files.
      
      [CHANGESET]
      ${diffContext}
      
      [TASKS]
      1. Summarize the high-level intent of this change.
      2. Identify specific micro-level logic changes (e.g., modified loops, conditional state changes, updated async handling).
      3. Predict how these changes could lead to regressions (edge cases, race conditions, side effects).
      4. Assign a BUG PROBABILITY SCORE (0-100%) based on these factors:
         - Line count/Complexity (High change volume increases risk).
         - Critical file paths (Core logic vs. UI/Chore).
         - Conditional logic edits (Modified 'if' statements are high risk).
         - Removed safeguards (Deleted try/catch, validation, or null checks).
         - Commit message quality (Vague messages correlate with bugs).
      5. List the contributing "Risk Factors" that led to this score.
      
      Respond only in structured JSON.
    `;

    try {
      // Utilize 'gemini-3-pro-preview' for advanced reasoning with a defined thinking budget for quality output.
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          // Setting the max thinking budget for complex forensic reasoning.
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              logicChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
              bugRiskExplanation: { type: Type.STRING },
              probabilityScore: { type: Type.NUMBER },
              riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "logicChanges", "bugRiskExplanation", "probabilityScore", "riskFactors"]
          }
        }
      });

      // The response.text property provides direct access to the generated string.
      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      
      return JSON.parse(text) as AIAnalysis;
    } catch (error) {
      console.error("AI Forensic Analysis failed:", error);
      return {
        summary: "Automated reasoning engine encountered an interruption.",
        logicChanges: ["Could not extract logic deltas."],
        bugRiskExplanation: "Heuristic evaluation unavailable due to API timeout or error.",
        probabilityScore: 0,
        riskFactors: ["API Connection Failure"]
      };
    }
  }
}
