import axios from "axios";
import { safeParse } from "../utils/parser.js";

export const callOpenRouter = async (query) => {
  try {
   const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "inclusionai/ling-2.6-1t:free",
        messages: [
          {
            role: "system",
            content: "Return ONLY a JSON array of 5 brand names. No explanation."
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
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return safeParse(response.data.choices[0].message.content);

  } catch (err) {
    console.error("OpenRouter Error:", err.response?.data || err.message);
    return [];
  }
};