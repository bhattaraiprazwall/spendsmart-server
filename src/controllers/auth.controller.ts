import { RequestHandler } from "express";
import { loginUser, registerUser } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
    messasge: "Login successful",
    data: tokens,
  });
});
