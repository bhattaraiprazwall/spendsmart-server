import { Request, Response } from "express";
import { analyzeSpending } from "../services/zScoreAnalytics.service.js";

export async function getSpendingAnomaly(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user!.id;

    const result = await analyzeSpending(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Spending anomaly error:", error);

    return res.status(500).json({
      message: "Failed to analyze spending",
    });
  }
}