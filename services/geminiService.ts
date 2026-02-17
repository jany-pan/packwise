
import { GoogleGenAI, Type } from "@google/genai";
import { GearItem, PackStats, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPackInsights = async (items: GearItem[], stats: PackStats, language: Language) => {
  const gearSummary = items.map(i => `${i.name} (Qty: ${i.quantity}, ${i.category}): ${i.weight}g each, €${i.price}${i.isWorn ? ' [WORN]' : ''}${i.isConsumable ? ' [CONSUMABLE]' : ''}`).join('\n');
  
  const prompt = `
    As an expert group trek organizer and ultralight backpacking consultant, analyze this participant's gear list for a group trip and provide 3-4 concise, actionable insights.
    
    Stats:
    Total Carried Weight: ${(stats.baseWeight / 1000).toFixed(2)} kg
    Consumables (Food/Fuel): ${(stats.consumableWeight / 1000).toFixed(2)} kg
    Total Cost: €${stats.totalPrice}
    
    Gear List:
    ${gearSummary}
    
    Look for:
    1. Redundant items that could be shared (stoves, filters).
    2. Distribution of food vs base weight.
    
    IMPORTANT: Response in ${language === 'sk' ? 'Slovak' : 'English'}.
    Format: JSON array of objects with 'title', 'advice', and 'priority' ('High', 'Medium', 'Low').
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              advice: { type: Type.STRING },
              priority: { type: Type.STRING }
            },
            required: ["title", "advice", "priority"]
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response text");
    return JSON.parse(resultText.trim());
  } catch (error) {
    console.error("AI Insights Error:", error);
    throw error;
  }
};
