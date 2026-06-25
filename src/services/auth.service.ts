import { response } from "express";
import { auth } from "../config/firebase.js";
import { prisma } from "../lib/prisma.js";
import "dotenv/config";

export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  const firebaseUser = await auth.createUser({
    displayName: name,
    email,
    password,
  });

  const dbUser = await prisma.user.create({
    data: {
      firebaseUid: firebaseUser.uid,
      name: name,
      email,
    },
  });
  return dbUser;
};

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error.message);
  }
  return data;
};
