
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, Commit } from "../types";

export class GeminiService {
  private primaryModel = "gemini-3-pro-preview";
  private fallbackModel = "gemini-3-flash-preview";

  async analyzeCommit(commit: Commit): Promise<AIAnalysis> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const diffContext = commit.diffs.map(d => {
      return `### FILE: ${d.path} (${d.changes})\nPATCH:\n${d.patch}`;
    }).join('\n\n');
    
    const prompt = `
      Act as a world-class senior software architect.
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
      4. Assign a BUG PROBABILITY SCORE (0-100%).
      5. List the contributing "Risk Factors".
      
      Respond only in structured JSON.
    `;

    const config = {
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
    };

    // Try Primary Model
    try {
      return await this.executeGeneration(ai, this.primaryModel, prompt, { ...config, thinkingConfig: { thinkingBudget: 16384 } });
    } catch (proError) {
      console.warn(`Primary model (${this.primaryModel}) failed. Falling back to ${this.fallbackModel}...`, proError);
      
      // Try Fallback Model
      try {
        return await this.executeGeneration(ai, this.fallbackModel, prompt, { ...config, thinkingConfig: { thinkingBudget: 0 } });
      } catch (flashError) {
        console.error("All AI reasoning models failed:", flashError);
        return this.generateHeuristicAnalysis(commit);
      }
    }
  }

  private async executeGeneration(ai: any, modelName: string, prompt: string, config: any): Promise<AIAnalysis> {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: config
    });

    const text = response.text;
    if (!text) throw new Error(`Empty response from ${modelName}`);
    return JSON.parse(text) as AIAnalysis;
  }

  private generateHeuristicAnalysis(commit: Commit): AIAnalysis {
    const risk = commit.stats.insertions > 200 || commit.stats.filesChanged > 5 ? 65 : 15;
    return {
      summary: "Automated reasoning engine unavailable. Performing heuristic evaluation.",
      logicChanges: [`Manual audit recommended for ${commit.stats.filesChanged} modified files.`],
      bugRiskExplanation: "Heuristic evaluation based on change volume and file count. Accuracy is limited without LLM reasoning.",
      probabilityScore: risk,
      riskFactors: ["AI Service Interruption", "High Change Volume Heuristic"]
    };
  }
}
