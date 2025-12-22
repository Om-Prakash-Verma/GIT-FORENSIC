
import { AIAnalysis, Commit } from "../types";

export class GeminiService {
  /**
   * analyzeCommit: Proxy the request to our secure serverless function.
   * This ensures the API_KEY remains on the server and never reaches the client.
   */
  async analyzeCommit(commit: Commit): Promise<AIAnalysis> {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commit }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze commit via server');
      }

      return await response.json() as AIAnalysis;
    } catch (error: any) {
      console.error("Forensic Analysis Error:", error.message);
      return this.generateHeuristicAnalysis(commit);
    }
  }

  private generateHeuristicAnalysis(commit: Commit): AIAnalysis {
    const risk = commit.stats.insertions > 200 || commit.stats.filesChanged > 5 ? 65 : 15;
    return {
      summary: "Automated reasoning engine unavailable (Server Error). Performing heuristic evaluation.",
      logicChanges: [`Manual audit recommended for ${commit.stats.filesChanged} modified files.`],
      bugRiskExplanation: "Heuristic evaluation based on change volume and file count. Accuracy is limited without LLM reasoning.",
      probabilityScore: risk,
      riskFactors: ["AI Service Interruption", "High Change Volume Heuristic"]
    };
  }
}
