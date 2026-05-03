import axios from "axios";
import { safeParse } from "../utils/parser.js";

export const callGroq = async (query) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant", // ✅ UPDATED
        messages: [
          {
            role: "system",
            content: "Return ONLY a JSON array of 5 brand names."
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
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return safeParse(response.data.choices[0].message.content);

  } catch (err) {
    console.error("Groq Error:", err.response?.data || err.message);
    return [];
  }
};