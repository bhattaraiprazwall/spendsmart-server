import { RequestHandler } from "express";
import {
  changePassword,
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "zod";
import {refreshUserToken} from "../services/auth.service.js";

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const user = await registerUser(
    req.body.name,
    req.body.email,
    req.body.password,
  );

  res.status(201).json(user);
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const tokens = await loginUser(req.body.email, req.body.password);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: tokens,
  });
});

export const changePass: RequestHandler = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await changePassword(
    req.user!.email,
    req.user!.firebaseUid,
    currentPassword,
    newPassword,
  );
  res.json({ success: true, message: "Password changed successfully" });
});



export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: "Refresh token is required" });
    return;
  }
  const tokens = await refreshUserToken(refreshToken);
  res.status(200).json({ success: true, data: tokens });
});