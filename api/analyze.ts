
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log(`[API/Analyze] Request received. Method: ${req.method}`);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { commit, model: requestedModel, previousAnalyses } = req.body;

  if (!commit) {
    return res.status(400).json({ error: 'Incomplete parameters' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API Key missing' });
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const modelIdMap: Record<string, string> = {
    'gemini-3-pro-preview': 'gemini-3-pro-preview',
    'gemini-3-flash-preview': 'gemini-3-flash-preview',
    'gemini-2.5-flash': 'gemini-flash-lite-latest'
  };

  const targetId = modelIdMap[requestedModel] || (requestedModel !== 'auto' ? requestedModel : 'gemini-3-pro-preview');

  const allStages = [
    { model: 'gemini-3-pro-preview', useThinking: true },
    { model: 'gemini-3-flash-preview', useThinking: false },
    { model: 'gemini-flash-lite-latest', useThinking: false }
  ];

  let executionStages = allStages;
  if (requestedModel && requestedModel !== 'auto') {
    const isPro = targetId.includes('pro');
    executionStages = [
      { model: targetId, useThinking: isPro },
      ...allStages.filter(s => s.model !== targetId)
    ];
  }

  // ENHANCEMENT: Increased limits and impact-based sorting
  const MAX_DIFF_CHARS = 8000; 
  const MAX_FILES = 20;

  const sortedDiffs = [...(commit.diffs || [])].sort((a, b) => 
    ((b.stats.additions + b.stats.deletions) - (a.stats.additions + a.stats.deletions))
  );

  const diffContext = sortedDiffs.slice(0, MAX_FILES).map((d: any) => {
    const patch = (d.patch || "").substring(0, MAX_DIFF_CHARS);
    return `### FILE: ${d.path}\nPATCH:\n${patch}${ (d.patch || "").length > MAX_DIFF_CHARS ? "\n[TRUNCATED]" : "" }`;
  }).join('\n\n');

  const systemInstruction = `You are a world-class senior software architect. 
Perform a deep forensic audit. Identify architectural risks and semantic intent.
${previousAnalyses ? `CONTEXT FROM PREVIOUS AUDITS: ${previousAnalyses}` : ''}
Return a strictly valid JSON response.`;

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
  "bugRiskExplanation": "Why this change is or isn't high risk.",
  "dangerReasoning": "One specific architectural failure point.",
  "probabilityScore": 0-100,
  "riskFactors": ["Specific risk factor 1"],
  "fixStrategies": ["Remediation strategy 1"],
  "failureSimulation": "What component fails first if a bug exists.",
  "hiddenCouplings": ["Non-obvious dependency 1"]
}`;

  let lastError: any = null;

  for (const stage of executionStages) {
    try {
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
        config.maxOutputTokens = 24000;
        config.thinkingConfig = { thinkingBudget: 16000 }; 
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: stage.model,
        contents: userPrompt,
        config
      });

      const text = response.text;
      if (!text) continue;

      const parsed = JSON.parse(text);
      return res.status(200).json({ ...parsed, modelUsed: stage.model });

    } catch (error: any) {
      lastError = error;
      continue;
    }
  }

  return res.status(500).json({ 
    error: 'Forensic audit failed', 
    details: lastError?.message || 'AI service error.'
  });
}
