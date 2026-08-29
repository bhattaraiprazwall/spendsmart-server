import { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as budgetService from "../services/budget.service.js";

export const getByMonth: RequestHandler = asyncHandler(async (req, res) => {
  const now = new Date();

  let month = Number(req.query.month) || now.getMonth() + 1;
  let year = Number(req.query.year) || now.getFullYear();

  if (month < 1 || month > 12) month = now.getMonth() + 1;
  if (year < 1970 || year > 9999) year = now.getFullYear();

  const budget = await budgetService.getBudget(req.user!.id, month, year);
  res.json({ success: true, data: { budget } });
});

export const createOrUpdate: RequestHandler = asyncHandler(async (req, res) => {
  const budget = await budgetService.createOrUpdateBudget(
    req.user!.id,
    req.body,
  );
  res.json({ success: true, data: { budget }, message: "Budget saved successfully" });
});

export const status: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ success: false, message: "Budget id is required" });
    return;
  }
  const data = await budgetService.getBudgetStatus(id, req.user!.id);
  res.json({ success: true, data });
});

export const update: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ success: false, message: "Budget id is required" });
    return;
  }
  const budget = await budgetService.updateBudget(id, req.user!.id, req.body);
  res.json({ success: true, data: { budget }, message: "Budget updated successfully" });
});

export const remove: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ success: false, message: "Budget id is required" });
    return;
  }
  await budgetService.deleteBudget(id, req.user!.id);
  res.json({ success: true, message: "Budget deleted successfully" });
});

export const addCategory: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ success: false, message: "Budget id is required" });
    return;
  }
  const budgetCategory = await budgetService.setBudgetCategory(
    id,
    req.user!.id,
    req.body,
  );
  res.json({
    success: true,
    data: { budgetCategory },
    message: "Category limit added successfully",
  });
});

export const updateCategory: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const categoryId = req.params.catId as string;
  if (!id || !categoryId) {
    res
      .status(400)
      .json({ success: false, message: "Budget id and category id are required" });
    return;
  }
  const budgetCategory = await budgetService.updateBudgetCategory(
    id,
    categoryId,
    req.user!.id,
    req.body,
  );
  res.json({
    success: true,
    data: { budgetCategory },
    message: "Category limit updated successfully",
  });
});

export const removeCategory: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const categoryId = req.params.catId as string;
  if (!id || !categoryId) {
    res
      .status(400)
      .json({ success: false, message: "Budget id and category id are required" });
    return;
  }
  await budgetService.removeBudgetCategory(id, categoryId, req.user!.id);
  res.json({ success: true, message: "Category limit removed successfully" });
});