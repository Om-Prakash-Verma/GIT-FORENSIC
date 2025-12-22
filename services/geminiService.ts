
import { AIAnalysis, Commit } from "../types";

export class GeminiService {
  /**
   * analyzeCommit: Proxy the request to our secure serverless function.
   * Includes a 15-second timeout to prevent the UI from hanging.
   */
  async analyzeCommit(commit: Commit): Promise<AIAnalysis> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commit }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze commit');
      }

      return await response.json() as AIAnalysis;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Forensic Analysis Error:", error.name === 'AbortError' ? 'Request timed out' : error.message);
      // Fallback to heuristic analysis if AI stalls or fails
      return this.generateHeuristicAnalysis(commit);
    }
  }

  private generateHeuristicAnalysis(commit: Commit): AIAnalysis {
    const risk = commit.stats.insertions > 200 || commit.stats.filesChanged > 5 ? 65 : 15;
    return {
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
  }
}
