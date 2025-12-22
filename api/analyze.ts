
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { commit } = req.body;

  if (!commit || !process.env.API_KEY) {
    return res.status(400).json({ error: 'Incomplete parameters' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const PRIMARY_MODEL = 'gemini-3-pro-preview';

  const diffContext = commit.diffs.map((d: any) => {
    return `### FILE: ${d.path} (${d.changes})\nPATCH:\n${d.patch}`;
  }).join('\n\n');

  const prompt = `
    Act as a lead software architect and forensic security auditor. Analyze this commit.
    
    [CONTEXT]
    Message: ${commit.message}
    Stats: +${commit.stats.insertions} / -${commit.stats.deletions}
    
    [CHANGESET]
    ${diffContext}
    
    [TASKS]
    1. Classify: 'logic', 'refactor', 'dependency', 'style', 'feat', 'fix', 'chore'.
    2. Conceptual Summary: High-level, non-technical architectural shift.
    3. Technical Summary: Brief intent.
    4. Logic Deltas: Identify micro-changes in logic flow.
    5. Danger Audit: Explain specific architectural or runtime risks.
    6. Bug Risk: 0-100 score.
    7. Remediation Advisory: Suggest 2-3 high-level 'fixStrategies'. 
       Focus on strategies like "Implement a circuit breaker", "Roll back and isolate state management", 
       or "Add unit test coverage for the async boundary". DO NOT provide raw code snippets.
    
    Respond in JSON.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
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
            fixStrategies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "High-level fix strategies without code." }
          },
          required: ["category", "conceptualSummary", "summary", "logicChanges", "bugRiskExplanation", "dangerReasoning", "probabilityScore", "riskFactors", "fixStrategies"]
        },
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Forensic analysis failed to produce a valid response.');
    }

    return res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI classification error:", error);
    return res.status(500).json({ error: 'AI classification failed' });
  }
}
