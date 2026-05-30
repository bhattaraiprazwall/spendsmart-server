import { prisma } from "../lib/prisma";

export async function dbConnection() {
  try {
    await prisma.$connect();
    console.log("DB Connected..");
  } catch (error) {
    console.log("DB Error..");
  }
}
