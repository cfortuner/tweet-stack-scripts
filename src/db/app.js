import { db } from "./firebase.js";

export const updateUser = async (userId, userData) => {
  if (!userId) {
    await db.collection("users").add(userData);
  } else {
    await db.collection("users").doc(userId).set(userData, { merge: true });
  }
};

export const updateTweet = async (tweetData) => {
  await db
    .collection("tweets")
    .doc(tweetData.tweetId)
    .set(tweetData, { merge: true });
};
