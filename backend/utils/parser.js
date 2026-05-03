export const safeParse = (text) => {
  try {
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);

    // 🔥 Normalize everything to string
    return parsed.map(item => {
      if (typeof item === "string") return item;

      if (typeof item === "object" && item.brand) {
        return item.brand;
      }

      return "";
    }).filter(Boolean);

  } catch {
    return [];
  }
};