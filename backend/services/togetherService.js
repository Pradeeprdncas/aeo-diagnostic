import '../loadEnv.js'; // Import this FIRST
import axios from "axios";
import { safeParse } from "../utils/parser.js";

export const callTogether = async (query) => {
  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
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
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content;

    return safeParse(text);

  } catch (err) {
    console.error("Together AI Error:", err.message);
    return [];
  }
};