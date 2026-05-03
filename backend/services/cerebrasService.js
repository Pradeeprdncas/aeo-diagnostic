import '../loadEnv.js'; // Import this FIRST
import axios from "axios";
import { safeParse } from "../utils/parser.js";

export const callCerebras = async (query) => {
  try {
    const response = await axios.post(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        model: "llama3.1-70b",
        messages: [
          {
            role: "system",
            content: `
Return ONLY a JSON array of top 5 brands/products.

Rules:
- No explanation
- No text
- No numbering
- Only JSON array

Example:
["Brand A", "Brand B", "Brand C"]
            `
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content;

    return safeParse(text);

  } catch (err) {
    console.error("Cerebras Error:", err.message);
    return [];
  }
};