
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getHealingMessage = async (mood: string, intent: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is feeling ${mood} and wants ${intent}. Provide a short, beautiful, and deeply soothing healing affirmation (max 2-3 sentences) focused on love, peace, and crystal energy. Speak in a gentle, divine voice.`,
      config: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text || "May peace and light surround your heart in this moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The universe whispers peace into your soul. Breathe deeply and feel the light.";
  }
};
