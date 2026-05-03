import '../loadEnv.js'; // Import this FIRST

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const callOpenAI = async (query) => {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // cheap + fast
      messages: [
        {
          role: "system",
          content: `
You are a strict data API.

Return ONLY a JSON array of top 5 brand or product names.

Rules:
- No explanation
- No extra text
- No numbering
- No objects
- Only JSON array

Example:
["Brand A", "Brand B", "Brand C"]
          `,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.2,
    });

    const text = completion.choices[0].message.content;

    // 🔥 Critical: Parse safely
    const parsed = JSON.parse(text);
    console.log(parsed);

    return parsed;
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return [];
  }
};