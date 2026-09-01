type Category = keyof typeof categoryKeywords;

interface CategoryPredictionResult {
  category: Category | null;
  confidence: number;
}

const categoryKeywords = {
  Food: [
    "pizza",
    "burger",
    "restaurant",
    "food",
    "cafe",
    "coffee",
    "dinner",
    "lunch",
    "breakfast",
  ],

  Transport: [
    "uber",
    "taxi",
    "bus",
    "fuel",
    "petrol",
    "train",
    "transport",
  ],

  Entertainment: [
    "netflix",
    "movie",
    "cinema",
    "spotify",
    "game",
  ],

  Shopping: [
    "clothes",
    "shirt",
    "shoes",
    "shopping",
    "amazon",
  ],

  Bills: [
    "electricity",
    "water",
    "internet",
    "rent",
    "phone",
  ],
};

export function predictCategory(
  title: string,
): CategoryPredictionResult {
  if (!title || typeof title !== "string") {
    return {
      category: null,
      confidence: 0,
    };
  }

  const normalizedTitle = title.toLowerCase().trim();

  let bestCategory: Category | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;

    for (const keyword of keywords) {
      if (normalizedTitle.includes(keyword)) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as Category;
    }
  }

  if (!bestCategory) {
    return {
      category: null,
      confidence: 0,
    };
  }

  /*
   * Initial confidence strategy.
   *
   * This is a rule-based system, so this is not
   * a statistically trained probability.
   */
  const confidence = Math.min(
    0.95,
    0.7 + bestScore * 0.1,
  );

  return {
    category: bestCategory,
    confidence,
  };
}