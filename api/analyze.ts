
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log(`[API/Analyze] Request received. Method: ${req.method}`);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { commit, model: requestedModel } = req.body;

  if (!commit) {
    console.error("[API/Analyze] Missing commit in request body");
    return res.status(400).json({ error: 'Incomplete parameters' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("[API/Analyze] API_KEY environment variable is not configured");
    return res.status(500).json({ error: 'Server API Key missing' });
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Base stages for fallback - using official model identifiers from guidelines
  const allStages = [
    { model: 'gemini-3-pro-preview', useThinking: true },
    { model: 'gemini-3-pro-preview', useThinking: false },
    { model: 'gemini-3-flash-preview', useThinking: false },
    { model: 'gemini-flash-latest', useThinking: false } // Fallback to standard Flash
  ];

  // If the user requested a specific model, we prioritize it
  let executionStages = allStages;
  if (requestedModel && requestedModel !== 'auto') {
    // Mapping friendly names to API IDs
    const modelIdMap: Record<string, string> = {
      'gemini-3-pro-preview': 'gemini-3-pro-preview',
      'gemini-3-flash-preview': 'gemini-3-flash-preview',
      'gemini-2.5-flash': 'gemini-flash-latest' // Correcting the user-facing name to internal ID
    };

    const targetId = modelIdMap[requestedModel] || requestedModel;
    const isPro = targetId.includes('pro');
    
    executionStages = [
      { model: targetId, useThinking: isPro }, 
      ...allStages.filter(s => s.model !== targetId) 
    ];
  }

  const MAX_DIFF_CHARS = 2500; // Slightly more conservative for stability
  const diffContext = commit.diffs.slice(0, 6).map((d: any) => {
    const patch = (d.patch || "").substring(0, MAX_DIFF_CHARS);
    return `### FILE: ${d.path}\nPATCH:\n${patch}${ (d.patch || "").length > MAX_DIFF_CHARS ? "\n[TRUNCATED]" : "" }`;
  }).join('\n\n');

  const prompt = `Act as a senior software architect and world-class security researcher. 
Perform a deep forensic audit of this commit diff. Identify architectural risks, potential regressions, and semantic intent.

Commit Msg: ${commit.message}
Stats: +${commit.stats.insertions} / -${commit.stats.deletions}

[COMMIT DIFF DATA]
${diffContext}

[INSTRUCTIONS]
Return a JSON object following this EXACT structure:
{
  "category": "logic" | "refactor" | "dependency" | "style" | "feat" | "fix" | "chore",
  "conceptualSummary": "Single sentence high-level intent.",
  "summary": "Detailed technical summary.",
  "logicChanges": ["Change 1", "Change 2"],
  "bugRiskExplanation": "Why this is or isn't risky.",
  "dangerReasoning": "One specific architectural failure point.",
  "probabilityScore": 0-100,
  "riskFactors": ["Factor 1", "Factor 2"],
  "fixStrategies": ["Strategy 1", "Strategy 2"],
  "failureSimulation": "Predict the exact component that fails first.",
  "hiddenCouplings": ["Non-obvious coupling 1", "Non-obvious coupling 2"]
}

Respond ONLY with valid JSON.`;

  let lastError: any = null;

  for (const stage of executionStages) {
    try {
      console.log(`[API/Analyze] Attempting Stage: Model=${stage.model}, Thinking=${stage.useThinking}`);
      
      const config: any = {
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
      };

      if (stage.useThinking) {
        config.thinkingConfig = { thinkingBudget: 4096 }; 
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: stage.model,
        contents: prompt,
        config
      });

      const text = response.text;
      if (!text) continue;

      const parsed = JSON.parse(text);
      console.log(`[API/Analyze] Success with ${stage.model}`);
      return res.status(200).json({ ...parsed, modelUsed: stage.model });

    } catch (error: any) {
      lastError = error;
      console.warn(`[API/Analyze] Stage ${stage.model} failed:`, error.message);
      // If thinking isn't available, we don't want to fail the whole request
      if (error.message.includes('thinkingConfig') || error.message.includes('404')) {
        continue;
      }
    }
  }

  return res.status(500).json({ 
    error: 'Forensic audit failed', 
    details: lastError?.message || 'The AI service was unable to process this diff.'
  });
}
