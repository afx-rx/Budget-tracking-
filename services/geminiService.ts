import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: Transaction[], currency: string): Promise<string> => {
  try {
    const transactionSummary = transactions.map(t => 
      `- ${t.date.split('T')[0]}: ${t.title} (${t.type}) ${currency}${t.amount} [${t.status}] - Category: ${t.category}`
    ).join('\n');

    const prompt = `
      Act as a personal financial advisor. Analyze the following list of transactions and provide a brief, actionable summary in 3 bullet points.
      Focus on spending habits, pending liabilities, and potential savings. Keep it friendly and concise.
      
      Transactions:
      ${transactionSummary}
    `;

    const response = await ai.models.generateContent({
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
    const response = await ai.models.generateContent({
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