import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "../../spendsmart-bc0f2-firebase-adminsdk-fbsvc-d905859c06.json" with { type: "json" };

const app = initializeApp({
  //   credential: cert(serviceAccount as { projectId: string; privateKey: string; clientEmail: string }),
  credential: cert({
    projectId: serviceAccount.project_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
  }),
});

const auth = getAuth(app);

export { auth, app };
