import { Request, Response, NextFunction }
from "express";

import admin from "../config/firebase";



export const firebaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      await admin.auth().verifyIdToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized",
      error,
    });
  }
};