import { auth } from "../config/firebase.js";
import { prisma } from "../lib/prisma.js";
import "dotenv/config";

//register service
const FIREBASE_SIGNUP_ERROR_MAP: Record<string, string> = {
  EMAIL_EXISTS: "An account with this email already exists",
  INVALID_EMAIL: "Please enter a valid email address",
  WEAK_PASSWORD: "Password must be at least 6 characters",
  OPERATION_NOT_ALLOWED: "Email/password registration is not enabled",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Please try again later",
};
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

//for login service
const FIREBASE_ERROR_MAP: Record<string, string> = {
  INVALID_LOGIN_CREDENTIALS: "Invalid email or password",
  EMAIL_NOT_FOUND: "No account found with this email",
  INVALID_PASSWORD: "Invalid email or password",
  USER_DISABLED: "This account has been disabled",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Please try again later",
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
  // console.log(data.error);
  if (!response.ok) {
    const firebaseCode = data.error?.message ?? "LOGIN FAILED";
    // Map Firebase code to friendly message, fallback to generic
    const friendlyMessage =
      FIREBASE_ERROR_MAP[firebaseCode] ?? "Login failed.Please try again!!";

    throw new Error(friendlyMessage);
  }
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
};
