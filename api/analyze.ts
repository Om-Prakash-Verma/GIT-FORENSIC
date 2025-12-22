
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log(`[API/Analyze] Request received. Method: ${req.method}`);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { commit, model: requestedModel } = req.body;

  if (!commit) {
    return res.status(400).json({ error: 'Incomplete parameters' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API Key missing' });
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Model Mapping - Normalize user-facing labels to internal API identifiers
  const modelIdMap: Record<string, string> = {
    'gemini-3-pro-preview': 'gemini-3-pro-preview',
    'gemini-3-flash-preview': 'gemini-3-flash-preview',
    'gemini-2.5-flash': 'gemini-flash-latest'
  };

  const targetId = modelIdMap[requestedModel] || (requestedModel !== 'auto' ? requestedModel : 'gemini-3-pro-preview');

  // Base fallback strategy
  const allStages = [
    { model: 'gemini-3-pro-preview', useThinking: true },
    { model: 'gemini-3-flash-preview', useThinking: false },
    { model: 'gemini-flash-latest', useThinking: false }
  ];

  // Re-order stages to prioritize user selection
  let executionStages = allStages;
  if (requestedModel && requestedModel !== 'auto') {
    const isPro = targetId.includes('pro');
    executionStages = [
      { model: targetId, useThinking: isPro },
      ...allStages.filter(s => s.model !== targetId)
    ];
  }

  const MAX_DIFF_CHARS = 2800; 
  const diffContext = commit.diffs.slice(0, 8).map((d: any) => {
    const patch = (d.patch || "").substring(0, MAX_DIFF_CHARS);
    return `### FILE: ${d.path}\nPATCH:\n${patch}${ (d.patch || "").length > MAX_DIFF_CHARS ? "\n[TRUNCATED]" : "" }`;
  }).join('\n\n');

  const systemInstruction = `You are a world-class senior software architect and security researcher. 
Perform a deep forensic audit of commit diffs to identify architectural risks, potential regressions, and semantic intent.
Return a strictly valid JSON response describing the commit's impact.`;

  const userPrompt = `Commit Message: ${commit.message}
Stats: +${commit.stats.insertions} / -${commit.stats.deletions} insertions/deletions across ${commit.stats.filesChanged} files.

[COMMIT DIFF DATA]
${diffContext}

[INSTRUCTIONS]
Return a JSON object following this EXACT structure:
{
  "category": "logic" | "refactor" | "dependency" | "style" | "feat" | "fix" | "chore",
  "conceptualSummary": "One sentence describing the core technical pivot.",
  "summary": "Detailed technical explanation of the changes.",
  "logicChanges": ["Significant logic change 1", "Significant logic change 2"],
  "bugRiskExplanation": "Why this change is or isn't high risk for production bugs.",
  "dangerReasoning": "One specific architectural failure point that could arise from this change.",
  "probabilityScore": 0-100,
  "riskFactors": ["Specific risk factor 1", "Specific risk factor 2"],
  "fixStrategies": ["Remediation strategy 1", "Remediation strategy 2"],
  "failureSimulation": "Predict exactly which component or flow fails first if a bug exists.",
  "hiddenCouplings": ["Non-obvious dependency 1", "Non-obvious dependency 2"]
}`;

  let lastError: any = null;

  for (const stage of executionStages) {
    try {
      console.log(`[API/Analyze] Invoking: ${stage.model} (Thinking: ${stage.useThinking})`);
      
      const config: any = {
        systemInstruction,
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
        // Critical: When setting thinkingBudget, maxOutputTokens must be explicitly defined and larger than the budget.
        config.maxOutputTokens = 20000;
        config.thinkingConfig = { thinkingBudget: 16384 }; 
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: stage.model,
        contents: userPrompt,
        config
      });

      const text = response.text;
      if (!text || text.trim() === '') {
        console.warn(`[API/Analyze] Empty output from ${stage.model}. Attempting fallback...`);
        continue;
      }

      const parsed = JSON.parse(text);
      console.log(`[API/Analyze] Audit complete. Successful model: ${stage.model}`);
      return res.status(200).json({ ...parsed, modelUsed: stage.model });

    } catch (error: any) {
      lastError = error;
      console.warn(`[API/Analyze] Stage ${stage.model} failed:`, error.message);
      // Skip to next stage if this one failed
      continue;
    }
  }

  return res.status(500).json({ 
    error: 'Forensic audit failed across all model tiers', 
    details: lastError?.message || 'Unknown upstream AI failure.'
  });
}
