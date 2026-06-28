import { prisma } from "../lib/prisma.js";

export const getProfile = async (userId: string) => {
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
};

export const updateProfile = async (
  userId: string,
  data: { name?: string; avatarUrl?: string; currency?: string; theme?: string }
) => {
  return prisma.user.update({ where: { id: userId }, data });
};

export const updateSettings = async (
  userId: string,
  data: { notificationsEnabled?: boolean; budgetAlertThreshold?: number }
) => {
  return prisma.user.update({ where: { id: userId }, data });
};

export const deleteAccount = async (userId: string) => {
  return prisma.user.delete({ where: { id: userId } });
};
