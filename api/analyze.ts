
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Vercel Serverless Function: AI Forensic Analyzer
 * Keeps the API_KEY secure on the server.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { commit } = req.body;
  const apiKey = process.env.API_KEY;

  if (!commit) {
    return res.status(400).json({ error: 'Commit data is required' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: API Key missing' });
  }

  const ai = new GoogleGenAI({ apiKey });
  const PRIMARY_MODEL = "gemini-3-pro-preview";
  const FALLBACK_MODEL = "gemini-3-flash-preview";

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
    2. Identify specific micro-level logic changes (loops, async flow, state mutation).
    3. Predict how these changes could lead to regressions (edge cases, race conditions).
    4. Assign a BUG PROBABILITY SCORE (0-100%).
    5. List the contributing "Risk Factors".
    
    Respond strictly in JSON.
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
    // Attempt 1: Gemini 3 Pro (Higher reasoning capacity)
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: { ...config, thinkingConfig: { thinkingBudget: 16384 } }
    });

    const result = JSON.parse(response.text || '{}');
    return res.status(200).json(result);

  } catch (error: any) {
    console.warn(`Primary model (${PRIMARY_MODEL}) failed. Error: ${error.message}. Attempting fallback...`);
    
    try {
      // Attempt 2: Gemini 3 Flash (Higher availability/speed fallback)
      const fallbackResponse = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: prompt,
        config: { ...config, thinkingConfig: { thinkingBudget: 0 } }
      });

      const fallbackResult = JSON.parse(fallbackResponse.text || '{}');
      return res.status(200).json(fallbackResult);

    } catch (fallbackError: any) {
      console.error("Critical AI Failure: Both models failed.", fallbackError.message);
      return res.status(500).json({ error: 'AI Forensic analysis failed on all models' });
    }
  }
}
