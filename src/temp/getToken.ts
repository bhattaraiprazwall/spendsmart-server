import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA8OdZv_x6KD7Y3lcsfvOJNyl82i6w286w",
  authDomain: "spendsmart-bc0f2.firebaseapp.com",
  projectId: "spendsmart-bc0f2",
};

console.log(firebaseConfig);

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

async function getToken() {
  const credential = await signInWithEmailAndPassword(
    auth,
    "admin@test.com",
    "123456",
  );

  const token = await credential.user.getIdToken();

  console.log(token);
}

getToken();
