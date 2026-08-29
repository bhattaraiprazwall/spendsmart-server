import { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as dashboardService from "../services/dashboard.service.js";

export const summary: RequestHandler = asyncHandler(async (req, res) => {
  const now = new Date();

  let month = Number(req.query.month) || now.getMonth() + 1;
  let year = Number(req.query.year) || now.getFullYear();

  if (month < 1 || month > 12) month = now.getMonth() + 1;
  if (year < 1970 || year > 9999) year = now.getFullYear();

  const data = await dashboardService.getSummary(
    req.user!.id,
    req.user!.currency,
    month,
    year,
  );

  res.json({ success: true, data });
});