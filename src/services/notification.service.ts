import { getMessaging } from "firebase-admin/messaging";
import { app } from "../config/firebase.js";

const messaging = getMessaging(app);

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
) => {
  return messaging.send({
    token: fcmToken,
    notification: {
      title,
      body,
    },
  });
};


export const sendPushNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
) => {
  const { prisma } = await import("../lib/prisma.js");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fcmToken: true,
    },
  });

  if (!user?.fcmToken) {
    throw new Error("User does not have an FCM token");
  }

  return sendPushNotification(
    user.fcmToken,
    title,
    body,
  );
};