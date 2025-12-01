import { GoogleGenAI } from "@google/genai";

export const generateCoverLetter = async (companyName: string, role: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a very brief, punchy, and professional cover letter for an internship application for the role of ${role} at ${companyName}. 
      Keep it under 150 words. Focus on enthusiasm and readiness to learn. Do not include placeholders like [Your Name].`,
    });
    
    return response.text || "Could not generate cover letter.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
