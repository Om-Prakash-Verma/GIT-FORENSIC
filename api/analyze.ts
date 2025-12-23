
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { commit, model: requestedModel, previousAnalyses } = req.body;
  if (!commit) return res.status(400).json({ error: 'Incomplete parameters' });

  const apiKey = process.env.API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server API Key missing' });

  const ai = new GoogleGenAI({ apiKey });
  
  const modelIdMap: Record<string, string> = {
    'gemini-3-pro-preview': 'gemini-3-pro-preview',
    'gemini-3-flash-preview': 'gemini-3-flash-preview',
    'gemini-2.5-flash': 'gemini-flash-lite-latest'
  };

  const targetId = modelIdMap[requestedModel] || 'gemini-3-pro-preview';
  
  // Configuration for Context Sliding
  const CHUNK_SIZE = 5; // Files per chunk
  const MAX_FILE_CHARS = 6000;
  
  const allDiffs = [...(commit.diffs || [])].sort((a, b) => 
    ((b.stats.additions + b.stats.deletions) - (a.stats.additions + a.stats.deletions))
  );

  // Divide into windows
  const chunks = [];
  for (let i = 0; i < allDiffs.length; i += CHUNK_SIZE) {
    chunks.push(allDiffs.slice(i, i + CHUNK_SIZE));
  }

  try {
    const partialSummaries: string[] = [];

    // PASS 1: MAP PHASE (Sliding Window Analysis)
    for (let i = 0; i < Math.min(chunks.length, 3); i++) { // Limit to 3 chunks for latency
      const chunkContext = chunks[i].map((d: any) => {
        const patch = (d.patch || "").substring(0, MAX_FILE_CHARS);
        return `FILE: ${d.path}\nPATCH:\n${patch}`;
      }).join('\n\n');

      const partialResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Use faster model for map phase
        contents: `Analyze this subset of code changes and provide a high-density technical summary of logic shifts and potential bugs:\n\n${chunkContext}`,
        config: { systemInstruction: "You are a specialized code analyzer. Be extremely concise and technical." }
      });
      
      if (partialResponse.text) partialSummaries.push(partialResponse.text);
    }

    // PASS 2: REDUCE PHASE (Final Synthesis)
    const synthesisPrompt = `
Commit Message: ${commit.message}
Historical Context: ${previousAnalyses || 'None'}

[PARTIAL FORENSIC SUMMARIES FROM CHUNKS]
${partialSummaries.join('\n---\n')}

[TASK]
Synthesize the final forensic audit JSON. Focus on cross-module impacts and architectural risk.
Structure:
{
  "category": "logic" | "refactor" | "feat" | "fix",
  "conceptualSummary": "...",
  "summary": "...",
  "logicChanges": ["..."],
  "bugRiskExplanation": "...",
  "dangerReasoning": "...",
  "probabilityScore": 0-100,
  "riskFactors": ["..."],
  "fixStrategies": ["..."],
  "failureSimulation": "...",
  "hiddenCouplings": ["..."]
}`;

    const finalResponse = await ai.models.generateContent({
      model: targetId,
      contents: synthesisPrompt,
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
    console.error("[API/Analyze] Error:", error);
    return res.status(500).json({ error: 'Audit synthesis failed', details: error.message });
  }
}
