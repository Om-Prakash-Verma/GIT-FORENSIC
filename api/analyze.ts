
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log(`[API/Analyze] Request received. Method: ${req.method}`);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { commit } = req.body;

  if (!commit) {
    console.error("[API/Analyze] Missing commit in request body");
    return res.status(400).json({ error: 'Incomplete parameters' });
  }

  if (!process.env.API_KEY) {
    console.error("[API/Analyze] API_KEY environment variable is not configured");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  console.log(`[API/Analyze] Processing high-fidelity forensic audit for ${commit.hash.substring(0, 8)}`);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Strategy: Try Pro first for deep reasoning, fallback to Flash if it fails.
  const modelsToTry = ['gemini-3-pro-preview', 'gemini-3-flash-preview'];
  let lastError = null;

  // Optimization: Truncate context to keep within safety limits
  const MAX_DIFF_CHARS = 3500; 
  const diffContext = commit.diffs.slice(0, 10).map((d: any) => {
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

  for (const modelName of modelsToTry) {
    try {
      console.log(`[API/Analyze] Attempting audit with model: ${modelName}`);
      
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

      // Only Pro supports thinkingConfig
      if (modelName.includes('pro')) {
        config.thinkingConfig = { thinkingBudget: 8192 }; // Reduced slightly for reliability
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config
      });

      const text = response.text;
      if (!text) throw new Error('Empty AI response');

      console.log(`[API/Analyze] Success with ${modelName}. Parsing JSON...`);
      const parsed = JSON.parse(text);
      return res.status(200).json(parsed);

    } catch (error: any) {
      console.warn(`[API/Analyze] Failed with model ${modelName}:`, error.message);
      lastError = error;
      // Continue to next model in fallback loop
    }
  }

  // If all models failed
  console.error(`[API/Analyze] All models failed. Last error:`, lastError);
  return res.status(500).json({ 
    error: 'Analysis failed after trying all fallback models', 
    details: lastError?.message || 'Unknown error'
  });
}
