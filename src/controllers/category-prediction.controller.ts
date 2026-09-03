// import { RequestHandler } from "express";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import * as categoryPredictionService from "../services/category-prediction.service.js";

// export const predictCategory: RequestHandler = asyncHandler(async (req, res) => {
//   const { title } = (req.body ?? {}) as { title?: unknown };

//   if (typeof title !== "string" || !title.trim()) {
//     res.status(400).json({
//       success: false,
//       message: "Expense title is required",
//     });
//     return;
//   }

//   const prediction = await categoryPredictionService.predictCategory(
//     title.trim(),
//   );

//   res.status(200).json({
//     success: true,
//     message: "Category predicted successfully",
//     data: {
//       title: title.trim(),
//       category: prediction.category,
//       confidence: prediction.confidence,
//       probabilities: prediction.probabilities,
//     },
//   });
// });

import type { RequestHandler } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";

import * as analyticsService from "../services/analytics.service.js";

export const predictCategory: RequestHandler = asyncHandler(
  async (req, res) => {
    const { title } = (req.body ?? {}) as {
      title?: unknown;
    };

    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        success: false,
        message: "Expense title is required",
      });

      return;
    }

    const prediction =
      await analyticsService.predictExpenseCategory(
        req.user!.id,
        title.trim(),
      );

    res.status(200).json({
      success: true,
      message: "Category predicted successfully",
      data: prediction,
    });
  },
);