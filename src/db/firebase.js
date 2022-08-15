import admin from "firebase-admin";

const app = admin.initializeApp({
  credential: admin.credential.cert("./secrets/firebase-service-account.json"),
});

const auth = admin.auth(app);
const storage = admin.storage(app);
const db = admin.firestore(app);

export { app, auth, storage, db };
