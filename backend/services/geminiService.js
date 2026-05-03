import '../loadEnv.js'; // Import this FIRST


import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const callGemini = async (query) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    const prompt = `
Return ONLY a JSON array of top 5 brands/products.

Rules:
- No explanation
- No numbering
- Only JSON

Example:
["Brand A", "Brand B", "Brand C"]

Query: ${query}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = JSON.parse(text);
    console.log(parsed)
    return parsed;

  } catch (err) {
    console.error("Gemini Error:", err.message);
    return [];
  }
};