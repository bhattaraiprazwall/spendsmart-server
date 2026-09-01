import { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as insightsService from "../services/insights.service.js";

export const getInsights: RequestHandler = asyncHandler(async (req, res) => {
  const period = (req.query.period as "Weekly" | "Monthly" | "Yearly") || "Monthly";
  const result = await insightsService.getCategoryBreakdown(req.user!.id, period);
  res.json({ success: true, data: result });
});
