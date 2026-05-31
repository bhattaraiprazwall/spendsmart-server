import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Read Firebase credentials from file path specified in environment variable
const firebaseCredentialsPath = process.env.FIREBASE_CREDENTIALS_PATH 
  ? path.resolve(process.env.FIREBASE_CREDENTIALS_PATH)
  : path.join(__dirname, "../../spendsmart-bc0f2-firebase-adminsdk-fbsvc-d905859c06.json");

if (!fs.existsSync(firebaseCredentialsPath)) {
  throw new Error(
    `Firebase credentials file not found at: ${firebaseCredentialsPath}\n` +
    "Please ensure the file exists or set FIREBASE_CREDENTIALS_PATH environment variable."
  );
}

const serviceAccount = JSON.parse(
  fs.readFileSync(firebaseCredentialsPath, "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(
    serviceAccount as admin.ServiceAccount
  ),
});

export default admin;