import { RequestHandler } from "express";
import { forecastMonthlySpending } from "../services/movingAverageForecast.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const getMonthlyForecast: RequestHandler =
  asyncHandler(async (req, res) => {
    const result = await forecastMonthlySpending(
      req.user!.id,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });