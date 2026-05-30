import admin from "firebase-admin";

import serviceAccount
from "../../spendsmart-bc0f2-firebase-adminsdk-fbsvc-d905859c06.json";

admin.initializeApp({
  credential: admin.credential.cert(
    serviceAccount as admin.ServiceAccount
  ),
});

export default admin;