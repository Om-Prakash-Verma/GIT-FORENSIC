
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { commit } = req.body;

  if (!commit) {
    return res.status(400).json({ error: 'Commit data is required' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: API Key missing' });
  }

  const ai = new GoogleGenAI({ apiKey });
  const primaryModel = "gemini-3-pro-preview";
  const fallbackModel = "gemini-3-flash-preview";

  const diffContext = commit.diffs.map((d: any) => {
    return `### FILE: ${d.path} (${d.changes})\nPATCH:\n${d.patch}`;
  }).join('\n\n');

  const prompt = `
    Act as a world-class senior software architect.
    Perform a deep-dive forensic audit of the following Git commit.
    
    [CONTEXT]
    Commit Message: ${commit.message}
    Author: ${commit.author}
    Stats: +${commit.stats.insertions} / -${commit.stats.deletions} lines, ${commit.stats.filesChanged} files.
    
    [CHANGESET]
    ${diffContext}
    
    [TASKS]
    1. Summarize the high-level intent of this change.
    2. Identify specific micro-level logic changes (e.g., modified loops, conditional state changes, updated async handling).
    3. Predict how these changes could lead to regressions (edge cases, race conditions, side effects).
    4. Assign a BUG PROBABILITY SCORE (0-100%).
    5. List the contributing "Risk Factors".
    
    Respond only in structured JSON.
  `;

  const config = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        logicChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
        bugRiskExplanation: { type: Type.STRING },
        probabilityScore: { type: Type.NUMBER },
        riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["summary", "logicChanges", "bugRiskExplanation", "probabilityScore", "riskFactors"]
    }
  };

  try {
    // Attempt with Primary Model
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config: { ...config, thinkingConfig: { thinkingBudget: 16384 } }
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.warn("Primary model failed, attempting fallback...", error.message);
    
    try {
      // Attempt with Fallback Model
      const fallbackResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents: prompt,
        config: { ...config, thinkingConfig: { thinkingBudget: 0 } }
      });
      return res.status(200).json(JSON.parse(fallbackResponse.text || '{}'));
    } catch (fallbackError: any) {
      console.error("All AI models failed:", fallbackError.message);
      return res.status(500).json({ error: 'AI analysis failed on all models' });
    }
  }
}
