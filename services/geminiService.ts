import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Lazy initialization to prevent app crash on load if key is missing
let ai: GoogleGenAI | null = null;

const getAi = () => {
  if (ai) return ai;
  
  // process.env.API_KEY is replaced by Vite at build time
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Please add API_KEY to your Netlify environment variables.");
    return null;
  }
  
  try {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (e) {
    console.error("Failed to initialize Gemini Client", e);
    return null;
  }
};

export const getFinancialInsights = async (transactions: Transaction[], currency: string): Promise<string> => {
  try {
    const client = getAi();
    if (!client) {
      return "AI service unavailable. Please configure the API Key in settings.";
    }

    const transactionSummary = transactions.map(t => 
      `- ${t.date.split('T')[0]}: ${t.title} (${t.type}) ${currency}${t.amount} [${t.status}] - Category: ${t.category}`
    ).join('\n');

    const prompt = `
      Act as a personal financial advisor. Analyze the following list of transactions and provide a brief, actionable summary in 3 bullet points.
      Focus on spending habits, pending liabilities, and potential savings. Keep it friendly and concise.
      
      Transactions:
      ${transactionSummary}
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep reasoning for simple summary
      }
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Sorry, I couldn't analyze your finances right now. Please try again later.";
  }
};

export const generateAppIcon = async (): Promise<string | null> => {
  try {
    const client = getAi();
    if (!client) return null;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { 
            text: "A high-quality 3D app icon for a modern budget tracking app named 'Budgy'. features a sleek black leather wallet with a glowing green coin and a rising green graph arrow popping out of it. Minimalist, modern UI style, dark mode aesthetic with indigo and purple neon rim lighting. Rounded square shape suitable for a mobile app icon. High resolution, glossy finish." 
          },
        ],
      },
    });

    // Iterate through parts to find the image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating icon:", error);
    return null;
  }
};