import { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as userService from "../services/user.service.js";

export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user!.id);
  res.json({ success: true, data: user });
});

export const updateMe: RequestHandler = asyncHandler(async (req, res) => {
  const { name, avatarUrl, currency, theme } = req.body;
  const user = await userService.updateProfile(req.user!.id, {
    name,
    avatarUrl,
    currency,
    theme,
  });
  res.json({ success: true, data: user, message: "Profile updated" });
});

export const updateSettings: RequestHandler = asyncHandler(
  async (req, res) => {
    const { notificationsEnabled, budgetAlertThreshold } = req.body;
    const user = await userService.updateSettings(req.user!.id, {
      notificationsEnabled,
      budgetAlertThreshold,
    });
    res.json({ success: true, data: user, message: "Settings updated" });
  }
);

export const deleteMe: RequestHandler = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user!.id);
  res.json({ success: true, message: "Account deleted" });
});
