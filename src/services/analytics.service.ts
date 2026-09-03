import { predictCategory } from "./category-prediction.service.js";
import type { PredictionResponse } from "./category-prediction.service.js";
import { resolveCategoryByLabel } from "./category-mapper.js";
import type { ResolvedCategory } from "./category-mapper.js";
import { canonicalKeyFromLabel } from "../constants/canonicalCategories.js";

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
} as const;

type ConfidenceLevel = "high" | "medium" | "low";

interface AlternativePrediction {
  category: string;
  probability: number;
}

export interface CategoryPredictionResult {
  title: string;
  category: ResolvedCategory | null;
  categoryLabel: string | null;
  canonicalKey: string | null;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  shouldSuggest: boolean;
  isHighConfidence: boolean;
  alternative: AlternativePrediction | null;
  probabilities?: Record<string, number>;
}

const getConfidenceLevel = (
  confidence: number,
): ConfidenceLevel => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    return "high";
  }

  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return "medium";
  }

  return "low";
};

const getAlternativeCategory = (
  probabilities: Record<string, number> | undefined,
  predictedCategory: string | null,
): AlternativePrediction | null => {
  if (!probabilities || !predictedCategory) {
    return null;
  }

  const alternatives = Object.entries(probabilities)
    .filter(([category]) => category !== predictedCategory)
    .sort(([, probabilityA], [, probabilityB]) => {
      return probabilityB - probabilityA;
    });

  if (alternatives.length === 0) {
    return null;
  }

  const first = alternatives[0];
  if (!first) return null;

  const [category, probability] = first;

  return {
    category,
    probability,
  };
};

export const predictExpenseCategory = async (
  userId: string,
  title: string,
): Promise<CategoryPredictionResult> => {
  const result: PredictionResponse =
    await predictCategory(title);

  const confidence = Number(result.confidence);

  const confidenceLevel =
    getConfidenceLevel(confidence);

  const alternative =
    getAlternativeCategory(
      result.probabilities,
      result.category,
    );

  const shouldSuggest =
    confidence >= CONFIDENCE_THRESHOLDS.MEDIUM;

  const isHighConfidence =
    confidence >= CONFIDENCE_THRESHOLDS.HIGH;

  const resolved = result.category
    ? await resolveCategoryByLabel(userId, result.category)
    : null;

  return {
    title,
    category: resolved,
    categoryLabel: result.category,
    canonicalKey: result.category
      ? (resolved?.canonicalKey ??
          canonicalKeyFromLabel(result.category))
      : null,
    confidence,
    confidenceLevel,
    shouldSuggest,
    isHighConfidence,
    alternative,
    ...(result.probabilities
      ? { probabilities: result.probabilities }
      : {}),
  };
};