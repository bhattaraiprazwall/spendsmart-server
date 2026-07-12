import { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";
import { CategoryParams } from "../types/category.type.js";

export const getAll: RequestHandler = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories(req.user!.id);
  res.json({ success: true, data: { categories } });
});

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.user!.id, req.body);
  res.status(201).json({
    success: true,
    data: { category },
    message: "Category created successfully",
  });
});

export const update: RequestHandler<CategoryParams> = asyncHandler(
  async (req, res) => {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Category id is required",
      });
      return;
    }
    const category = await categoryService.updateCategory(
      id as string,
      req.user!.id,
      req.body,
    );
    res.json({
      success: true,
      data: { category },
      message: "Category updated successfully",
    });
  },
);

export const remove: RequestHandler = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id as string, req.user!.id);
  res.json({ success: true, message: "Category deleted successfully" });
});

export const predict: RequestHandler = asyncHandler(async (req, res) => {
  const title = req.query.title as string;
  if (!title) {
    res
      .status(400)
      .json({ success: false, message: "title query parameter is required" });
    return;
  }

  const result = await categoryService.predictCategory(title, req.user!.id);
  res.json({ success: true, data: result });
});
