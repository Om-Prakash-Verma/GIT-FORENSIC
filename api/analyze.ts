
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
  const PRIMARY_MODEL = 'gemini-3-flash-preview';

  // Optimization: Extreme truncation for high-speed forensic scanning
  // We only need the first 2000 chars of each file to understand intent
  const MAX_DIFF_CHARS = 2000;
  const diffContext = commit.diffs.map((d: any) => {
    const patch = (d.patch || "").substring(0, MAX_DIFF_CHARS);
    return `### FILE: ${d.path}\nPATCH:\n${patch}${ (d.patch || "").length > MAX_DIFF_CHARS ? "\n[TRUNCATED]" : "" }`;
  }).join('\n\n');

  const prompt = `Act as a senior software architect. Audit this commit diff.
Commit Msg: ${commit.message}
Stats: +${commit.stats.insertions} / -${commit.stats.deletions}

[DIFF]
${diffContext}

[TASK]
Return a JSON object with:
1. "category": (logic, refactor, dependency, style, feat, fix, or chore)
2. "conceptualSummary": 1-sentence high-level intent.
3. "summary": Brief technical summary.
4. "logicChanges": Array of 2 strings describing flow/state changes.
5. "bugRiskExplanation": Risk level description.
6. "dangerReasoning": 1 specific runtime or architectural risk.
7. "probabilityScore": Number (0-100).
8. "riskFactors": Array of 2 risk strings.
9. "fixStrategies": Array of 2 conceptual remediation strategies.

Respond ONLY with valid JSON.`;

  try {
    // Optimization: Using simple string contents for fastest processing
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
            fixStrategies: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["category", "conceptualSummary", "summary", "logicChanges", "bugRiskExplanation", "dangerReasoning", "probabilityScore", "riskFactors", "fixStrategies"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty AI response');

    return res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    console.error("Forensic API Error:", error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
