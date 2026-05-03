import axios from "axios";
import { safeParse } from "../utils/parser.js";

export const callMistral = async (query) => {
  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-medium-2505", // fine if it's working for you
        messages: [
          {
            role: "system",
            content: `
Return ONLY a JSON array of top 5 brands/products.

Rules:
- Only JSON array
- No explanation
- No markdown
- No numbering

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
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content;

    // 🔥 SAFE PARSE (critical)
    const parsed = safeParse(text);

    console.log("Mistral Parsed:", parsed);

    return parsed;

  } catch (err) {
    console.error("Mistral Error:", err.response?.data || err.message);
    return [];
  }
};