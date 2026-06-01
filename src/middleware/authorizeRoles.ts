import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const authorizeRoles = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dbUser = await prisma.user.findUnique({
        where: {
          firebaseUID: req.user.uid,
        },
      });

      if (!dbUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (!roles.includes(dbUser.role)) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      req.dbUser = dbUser;

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Server Error",
        error,
      });
    }
  };
};
