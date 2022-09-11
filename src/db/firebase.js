import admin from "firebase-admin";
import { config } from "../config.js";

const app = admin.initializeApp({
  credential: admin.credential.cert(config.firebase.serviceAccountFilePath),
});

const auth = admin.auth(app);
const storage = admin.storage(app);
const db = admin.firestore(app);
const firestore = admin.firestore;

db.settings({
  ignoreUndefinedProperties: true,
});

export { app, auth, storage, db, firestore };
