
import { AIAnalysis, Commit } from "../types";

export class GeminiService {
  /**
   * analyzeCommit: Proxy the request to our secure serverless function.
   * Timeouts are removed to allow for Gemini 3 Pro's thinking process.
   */
  async analyzeCommit(commit: Commit): Promise<AIAnalysis> {
    console.log(`[GeminiService] Initiating deep AI analysis for commit: ${commit.hash.substring(0, 8)}`);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commit })
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error(`[GeminiService] API Error Response:`, errData);
        throw new Error(errData.error || 'Failed to analyze commit');
      }

      const result = await response.json() as AIAnalysis;
      console.log(`[GeminiService] AI Analysis successful for ${commit.hash.substring(0, 8)}`, result);
      return result;
    } catch (error: any) {
      console.error("[GeminiService] Analysis pipeline failed:", error.message);
      
      console.info(`[GeminiService] Triggering heuristic fallback for ${commit.hash.substring(0, 8)}`);
      return this.generateHeuristicAnalysis(commit);
    }
  }

  private generateHeuristicAnalysis(commit: Commit): AIAnalysis {
    const risk = commit.stats.insertions > 200 || commit.stats.filesChanged > 5 ? 65 : 15;
    const analysis = {
      summary: "AI reasoning stalled or unavailable. Performing local heuristic scan.",
      conceptualSummary: "Pattern-based intent recovery. Intent inferred from message and volatility stats.",
      category: commit.category || 'logic',
      logicChanges: [`Automated audit of ${commit.stats.filesChanged} files completed locally.`],
      bugRiskExplanation: "Heuristic evaluation based on churn volume. Deep logic delta tracing unavailable.",
      dangerReasoning: "Service interruption prevented deep forensic reasoning. Manual audit of logic deltas is required.",
      probabilityScore: risk,
      riskFactors: ["Service Timeout Fallback", "High Volatility Heuristic"],
      fixStrategies: ["Initiate manual code review", "Execute regression test suite"],
      failureSimulation: "Unknown. Heuristic scan suggests potential runtime regression in modified hot-paths.",
      hiddenCouplings: ["Potential env var usage in " + (commit.stats.filesChanged > 0 ? "modified modules" : "unidentified scope")]
    };
    console.debug(`[GeminiService] Generated heuristic results:`, analysis);
    return analysis;
  }
}
