
import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from '../data/mock';

// We mock the process.env check to avoid runtime errors if not set, but logically it relies on it.
const API_KEY = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const generateAssistantResponse = async (userPrompt: string): Promise<string> => {
  if (!ai) {
    return "I'm sorry, I cannot connect to the intelligence service right now. Please check your API configuration.";
  }

  // Inject catalog context
  const catalogContext = PRODUCTS.map(p => 
    `- ${p.name} (${p.category}) by ${p.storeName}. Price: ₹${p.price}. Rating: ${p.rating}/5. Vertical: ${p.vertical}`
  ).join('\n');

  const systemInstruction = `
    You are ClearX Assistant, a helpful shopping guide for a unified commerce app in India.
    
    The app has three verticals:
    1. Deals Near Me (Hyperlocal clearance sales)
    2. Rural Gold (Farm-to-table produce)
    3. Makers Mart (Artisanal handcrafted goods)

    Your Goal: Help users find products from the available inventory below.
    
    Current Inventory:
    ${catalogContext}

    Rules:
    - Recommend items solely from the inventory list.
    - If the user asks for something not in the list, suggest the closest alternative or explain you don't have it yet.
    - Be polite, concise, and helpful.
    - Use Indian formatting for currency (₹).
    - If the user greets you, explain what ClearX does briefly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "I'm having trouble thinking right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I encountered an error while searching.";
  }
};
