import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { analyzeSpending } from "../services/zScoreAnalytics.service.js";
import { sendAnomalyNotification } from "../services/anomalyNotification.service.js";

export function startAnomalyNotificationJob() {
    // Runs every day at 9:00 AM server time.
    cron.schedule(
        "0 9 * * *",
        async () => {
            console.log(
                "Running scheduled spending anomaly analysis...",
            );

            try {
                const users = await prisma.user.findMany({
                    where: {
                        notificationsEnabled: true,
                        fcmToken: {
                            not: null,
                        },
                    },
                    select: {
                        id: true,
                    },
                });

                for (const user of users) {
                    try {
                        const result = await analyzeSpending(user.id);

                        if (
                            result.status === "ANALYZED" &&
                            result.isAnomaly === true
                        ) {
                            await sendAnomalyNotification(user.id);

                            console.log(
                                `Anomaly notification processed for user ${user.id}`,
                            );
                        }
                    } catch (error) {
                        console.error(
                            `Failed anomaly analysis for user ${user.id}:`,
                            error,
                        );
                    }
                }

                console.log(
                    "Scheduled spending anomaly analysis completed.",
                );
            } catch (error) {
                console.error(
                    "Anomaly notification job failed:",
                    error,
                );
            }
        },
        { timezone: "Asia/Kathmandu", },
    );

    console.log(
        "Anomaly notification job scheduled successfully.",
    );
}

//////////////////////////////////////
export async function runAnomalyNotificationJob() {
  console.log(
    "Running spending anomaly analysis manually...",
  );

  try {
    const users = await prisma.user.findMany({
      where: {
        notificationsEnabled: true,
        fcmToken: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });

    for (const user of users) {
      try {
        const result = await analyzeSpending(user.id);

        console.log(
          `User ${user.id}:`,
          {
            status: result.status,
            zScore: result.zScore,
            isAnomaly: result.isAnomaly,
          },
        );

        if (
          result.status === "ANALYZED" &&
          result.isAnomaly === true
        ) {
          await sendAnomalyNotification(user.id);

          console.log(
            `Anomaly notification processed for user ${user.id}`,
          );
        }
      } catch (error) {
        console.error(
          `Failed anomaly analysis for user ${user.id}:`,
          error,
        );
      }
    }

    console.log(
      "Manual anomaly analysis completed.",
    );
  } catch (error) {
    console.error(
      "Manual anomaly analysis failed:",
      error,
    );
  }
}