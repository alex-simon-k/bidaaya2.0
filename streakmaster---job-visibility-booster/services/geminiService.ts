import { GoogleGenAI, Type } from "@google/genai";

export const getMotivationalTip = async (streak: number): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Keep pushing! Consistency is key to landing your dream job.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The user is a student applying for jobs. Their current application streak is ${streak} days.
      Give them a very short, punchy, 1-sentence motivational tip or compliment to keep them going.
      If the streak is 0, encourage them to start. If it's high, congratulate them.
      Do not use quotes.`,
      config: {
        maxOutputTokens: 50,
        temperature: 0.7,
      }
    });

    return response.text || "Every application brings you one step closer.";
  } catch (error) {
    console.error("Failed to fetch motivation:", error);
    return "Consistency is the bridge between goals and accomplishment.";
  }
};
