import { NextFunction, Request, Response } from "express";
import { ZodAny, ZodError, ZodObject } from "zod";
import { ZodTypeAny } from "zod/v3";

export const validate =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.body);
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.issues,
        });
      }
      next(error);
    }
  };
