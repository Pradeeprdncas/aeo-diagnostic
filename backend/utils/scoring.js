export const calculateScores = (gpt, claude, gemini) => {
  const brands = new Set([...gpt, ...claude, ...gemini]);

  const scores = [];

  brands.forEach((brand) => {
    let score = 0;

    if (gpt.includes(brand)) score += (5 - gpt.indexOf(brand));
    if (claude.includes(brand)) score += (5 - claude.indexOf(brand));
    if (gemini.includes(brand)) score += (5 - gemini.indexOf(brand));

    scores.push({ brand, score });
  });

  return scores.sort((a, b) => b.score - a.score);
};