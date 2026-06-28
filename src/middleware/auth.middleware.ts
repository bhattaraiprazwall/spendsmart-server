import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase.js";
import { prisma } from "../lib/prisma.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const token = header.split("Bearer ")[1];
    if (!token) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const decoded = await auth.verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token..." });
  }
};
