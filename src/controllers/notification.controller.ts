import { Request, Response } from "express";
import { sendPushNotificationToUser } from "../services/notification.service.js";

export async function sendTestNotification(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user!.id;

    await sendPushNotificationToUser(
      userId,
      "SpendSmart Test",
      "FCM notifications are working successfully! 🎉",
    );

    return res.status(200).json({
      success: true,
      message: "Test notification sent",
    });
  } catch (error) {
    console.error("Test notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send test notification",
    });
  }
}