import { callGroq } from "../services/groqService.js";
import { callMistral } from "../services/mistralService.js";
import { callOpenRouter } from "../services/openrouterService.js";
import { calculateScores } from "../utils/scoring.js";

export const analyzeQuery = async (req, res) => {
  const { query } = req.body;

  try {
    const [groq, mistral, openrouter] = await Promise.all([
      callGroq(query),
      callMistral(query),
      callOpenRouter(query)
    ]);

    const scores = calculateScores(groq, mistral, openrouter);

    res.json({
      query,
      results: {
        groq,
        mistral,
        openrouter
      },
      scores
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze" });
  }
};