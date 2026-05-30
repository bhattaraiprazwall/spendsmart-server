import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// import prisma from "../../prisma.config";

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { uid, email, name } = req.user;

    let user = await prisma.user.findUnique({
      where: {
        firebaseUID: uid,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUID: uid,
          email,
          name,
          role: "USER",
        },
      });
    }

    return res.json({
      message: "User synced",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error,
    });
  }
};
