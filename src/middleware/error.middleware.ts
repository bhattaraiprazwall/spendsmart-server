import { NextFunction, Request, Response } from "express";
// Global error handler — catches anything asyncHandler forwards via next(error)
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(error.message);
  return res.status(400).json({
    success: false,
    message: error.message,
  });
};
