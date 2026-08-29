import { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as transactionService from "../services/transaction.service.js";

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const { transaction, alert } = await transactionService.createTransaction(
    req.user!.id,
    req.body,
  );
  res.status(201).json({
    success: true,
    data: { transaction, ...(alert ? { alert } : {}) },
    message: "Transaction created successfully",
  });
});

export const getAll: RequestHandler = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(
    req.user!.id,
    req.query as any,
  );
  res.json({ success: true, data: result });
});

export const getById: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ success: false, message: "Transaction id is required" });
    return;
  }
  const transaction = await transactionService.getTransaction(id, req.user!.id);
  res.json({ success: true, data: { transaction } });
});

export const update: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ success: false, message: "Transaction id is required" });
    return;
  }
  const { transaction, alert } = await transactionService.updateTransaction(
    id,
    req.user!.id,
    req.body,
  );
  res.json({
    success: true,
    data: { transaction, ...(alert ? { alert } : {}) },
    message: "Transaction updated successfully",
  });
});

export const remove: RequestHandler = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ success: false, message: "Transaction id is required" });
    return;
  }
  await transactionService.deleteTransaction(id, req.user!.id);
  res.json({ success: true, message: "Transaction deleted successfully" });
});
