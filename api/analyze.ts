
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { commit, model: requestedModel, previousAnalyses } = req.body;
  if (!commit) return res.status(400).json({ error: 'Incomplete parameters' });

  const apiKey = process.env.API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server API Key missing' });

  const ai = new GoogleGenAI({ apiKey });
  
  // Model selection with Gemini 3 Pro as the preferred experimental target
  const modelIdMap: Record<string, string> = {
    'gemini-3-pro-preview': 'gemini-3-pro-preview',
    'gemini-3-flash-preview': 'gemini-3-flash-preview',
    'gemini-2.5-flash': 'gemini-flash-lite-latest',
    'auto': 'gemini-3-pro-preview' // Defaulting auto to Pro for deep experimentation
  };

  const targetId = modelIdMap[requestedModel] || 'gemini-3-pro-preview';
  
  // High-density sampling for architectural depth
  const MAX_FILE_CHARS = 8000;
  const allDiffs = [...(commit.diffs || [])].sort((a, b) => 
    ((b.stats.additions + b.stats.deletions) - (a.stats.additions + a.stats.deletions))
  );

  const sampleSize = 12;
  let sampledDiffs = allDiffs.length <= sampleSize ? allDiffs : [
    allDiffs[0], 
    allDiffs[allDiffs.length - 1],
    ...allDiffs.slice(1, sampleSize - 1)
  ];

  try {
    // PASS 1: RAW FORENSIC MAP (Uses Flash for speed in intermediate extraction)
    const chunkContext = sampledDiffs.map((d: any) => {
      const patch = (d.patch || "").substring(0, MAX_FILE_CHARS);
      return `### FILE: ${d.path}\nPATCH:\n${patch}`;
    }).join('\n\n');

    const mapResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep technical scan of these code changes. Identify logic pivots and architectural shifts:\n\n${chunkContext}`,
      config: { 
        systemInstruction: "You are a senior forensic code auditor. Focus on state machine changes and API breaking points. Be extremely dense.",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    // PASS 2: DEEP REASONING REDUCTION (Uses Pro with 32k Thinking Budget)
    const synthesisPrompt = `
COMMIT_MSG: ${commit.message}
HISTORY_CONTEXT: ${previousAnalyses || 'N/A'}
EXTRACTED_DELTAS: ${mapResponse.text}

[TASK]
Synthesize a production-grade Forensic Audit JSON. Use your full reasoning capabilities to predict regressions and find hidden couplings.

Structure:
{
  "category": "logic" | "refactor" | "feat" | "fix",
  "conceptualSummary": "High-level architectural pivot.",
  "summary": "Technical deep-dive.",
  "logicChanges": ["Change A", "Change B"],
  "bugRiskExplanation": "Detailed risk analysis.",
  "dangerReasoning": "Critical failure point.",
  "probabilityScore": 0-100,
  "riskFactors": ["Risk 1"],
  "fixStrategies": ["Strategy 1"],
  "failureSimulation": "Step-by-step prediction of what breaks first.",
  "hiddenCouplings": ["Non-obvious side effects"]
}`;

    const finalResponse = await ai.models.generateContent({
      model: targetId,
      contents: synthesisPrompt,
      config: {
        // Unlocking maximum thinking budget for Pro models
        thinkingConfig: { 
          thinkingBudget: targetId.includes('pro') ? 32768 : 0 
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            conceptualSummary: { type: Type.STRING },
            summary: { type: Type.STRING },
            logicChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
            bugRiskExplanation: { type: Type.STRING },
            dangerReasoning: { type: Type.STRING },
            probabilityScore: { type: Type.NUMBER },
            riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            fixStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
            failureSimulation: { type: Type.STRING },
            hiddenCouplings: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["category", "conceptualSummary", "summary", "logicChanges", "bugRiskExplanation", "dangerReasoning", "probabilityScore", "riskFactors", "fixStrategies", "failureSimulation", "hiddenCouplings"]
        }
      }
    });

    return res.status(200).json(JSON.parse(finalResponse.text || "{}"));

  } catch (error: any) {
    console.error("[API/Analyze] Forensic Pipeline failure:", error);
    return res.status(500).json({ error: 'Audit synthesis failed', details: error.message });
  }
}
