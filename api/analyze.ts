
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
  // Switching to Pro for superior reasoning in complex diffs
  const PRIMARY_MODEL = 'gemini-3-pro-preview';

  // Optimization: Increased context window for Pro
  const MAX_DIFF_CHARS = 4000; 
  const diffContext = commit.diffs.map((d: any) => {
    const patch = (d.patch || "").substring(0, MAX_DIFF_CHARS);
    return `### FILE: ${d.path}\nPATCH:\n${patch}${ (d.patch || "").length > MAX_DIFF_CHARS ? "\n[TRUNCATED]" : "" }`;
  }).join('\n\n');

  console.debug(`[API/Analyze] Diff context generated. Length: ${diffContext.length} chars`);

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

  try {
    console.log(`[API/Analyze] Calling Gemini 3 Pro with thinkingConfig...`);
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Enabling thinking for deep architectural reasoning
        thinkingConfig: { thinkingBudget: 16384 },
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

    const text = response.text;
    if (!text) {
      console.error("[API/Analyze] Pro model returned empty text. Checking candidates...");
      console.debug(JSON.stringify(response.candidates));
      throw new Error('Empty AI response');
    }

    console.log(`[API/Analyze] Gemini 3 Pro responded. Parsing JSON...`);
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error(`[API/Analyze] Critical failure using Gemini 3 Pro:`, error);
    
    // Check for "Requested entity was not found" or other model-specific errors
    if (error.message?.includes("not found")) {
      console.error("[API/Analyze] Model gemini-3-pro-preview may not be available for this API key.");
    }

    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message,
      model: PRIMARY_MODEL 
    });
  }
}
