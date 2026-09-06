import { prisma } from "../lib/prisma.js";
import { sendPushNotificationToUser } from "./notification.service.js";

export async function sendAnomalyNotification(
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notificationsEnabled: true,
      fcmToken: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 1. Check notification settings
  if (!user.notificationsEnabled) {
    return {
      sent: false,
      reason: "NOTIFICATIONS_DISABLED",
    };
  }

  // 2. Check FCM token
  if (!user.fcmToken) {
    return {
      sent: false,
      reason: "NO_FCM_TOKEN",
    };
  }

  // 3. Get current month
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  // 4. Check whether notification was already sent
  const existingNotification =
    await prisma.anomalyNotification.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
    });

  if (existingNotification) {
    return {
      sent: false,
      reason: "ALREADY_SENT",
    };
  }

  // 5. Send notification
  await sendPushNotificationToUser(
    userId,
    "Unusual Spending Detected ⚠️",
    "Your spending is significantly higher than usual.",
  );

  // 6. Record notification
  await prisma.anomalyNotification.create({
    data: {
      userId,
      year,
      month,
    },
  });

  return {
    sent: true,
    reason: "ANOMALY_NOTIFICATION_SENT",
  };
}