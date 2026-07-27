import { prisma } from "../lib/prisma.js";

interface TrainingSample {
  title: string;
  categoryId: string;
  categoryName: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface PredictionResult {
  predictedCategory: CategoryInfo | null;
  confidence: number;
}

class MnbPredictor {
  private categories: CategoryInfo[] = [];
  private priors: Map<string, number> = new Map();
  private wordProbs: Map<string, Map<string, number>> = new Map();
  private vocabulary: Set<string> = new Set();
  private totalDocs = 0;

  train(samples: TrainingSample[], allCategories: CategoryInfo[]) {
    this.categories = allCategories;
    this.totalDocs = samples.length;

    if (samples.length === 0) return;

    const categoryDocs: Map<string, string[]> = new Map();
    for (const cat of allCategories) {
      categoryDocs.set(cat.id, []);
    }
    for (const s of samples) {
      const existing = categoryDocs.get(s.categoryId);
      if (existing) {
        existing.push(s.title);
      } else {
        categoryDocs.set(s.categoryId, [s.title]);
      }
    }
    const categoryWordCounts: Map<string, Map<string, number>> = new Map();
    const categoryTotalWords: Map<string, number> = new Map();

    for (const [catId, docs] of categoryDocs) {
      const wordCounts = new Map<string, number>();
      let total = 0;
      for (const doc of docs) {
        const tokens = this.tokenize(doc);
        for (const token of tokens) {
          wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
          this.vocabulary.add(token);
          total++;
        }
      }
      categoryWordCounts.set(catId, wordCounts);
      categoryTotalWords.set(catId, total);
    }

    const vocabSize = this.vocabulary.size;
    const numCategories = allCategories.length;

    for (const cat of allCategories) {
      const catId = cat.id;
      const docCount = (categoryDocs.get(catId) || []).length;
      this.priors.set(
        catId,
        Math.log((docCount + 1) / (this.totalDocs + numCategories)),
      );

      const wordCounts = categoryWordCounts.get(catId) || new Map();
      const totalWords = categoryTotalWords.get(catId) || 0;
      const catWordProbs = new Map<string, number>();

      for (const word of this.vocabulary) {
        const count = wordCounts.get(word) || 0;
        catWordProbs.set(
          word,
          Math.log((count + 1) / (totalWords + vocabSize)),
        );
      }
      this.wordProbs.set(catId, catWordProbs);
    }
  }

  predict(title: string): PredictionResult {
    const tokens = this.tokenize(title);

    if (this.totalDocs === 0 || this.categories.length === 0) {
      return { predictedCategory: null, confidence: 0 };
    }

    let bestCategory: CategoryInfo | null = null;
    let bestScore = -Infinity;

    for (const cat of this.categories) {
      const prior = this.priors.get(cat.id) || 0;
      const probs = this.wordProbs.get(cat.id);
      if (!probs) continue;

      let score = prior;
      for (const token of tokens) {
        score += probs.get(token) || Math.log(1 / (1 + this.vocabulary.size));
      }

      if (score > bestScore) {
        bestScore = score;
        bestCategory = cat;
      }
    }

    const confidence = bestCategory
      ? Math.min(Math.exp(bestScore) * 2, 1.0)
      : 0;

    return {
      predictedCategory: bestCategory
        ? {
            id: bestCategory.id,
            name: bestCategory.name,
            icon: bestCategory.icon,
            color: bestCategory.color,
          }
        : null,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }
}

export const predictCategoryMNB = async (
  title: string,
  userId: string,
): Promise<PredictionResult> => {
  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      select: { title: true, categoryId: true },
    }),
    prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId }] },
      select: { id: true, name: true, icon: true, color: true },
    }),
  ]);

  if (transactions.length === 0) {
    return { predictedCategory: null, confidence: 0 };
  }

  const samples: TrainingSample[] = [];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  for (const t of transactions) {
    const catName = categoryMap.get(t.categoryId);
    if (catName) {
      samples.push({
        title: t.title,
        categoryId: t.categoryId,
        categoryName: catName,
      });
    }
  }

  const predictor = new MnbPredictor();
  predictor.train(
    samples,
    categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color })),
  );

  return predictor.predict(title);
};
