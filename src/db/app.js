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

export const addTopic = async (topicData) => {
  const exists = await db
    .collection("topics")
    .where("value", "==", topicData.value)
    .get();
  if (exists) {
    return;
  }

  await db.collection("topics").add({
    value: topicData.value,
    createdAt: FirebaseFirestore.Timestamp.now(),
  });
};

export const addPhrase = async (phraseData) => {
  const exists = await db
    .collection("phrases")
    .where("value", "==", phraseData.value)
    .get();
  if (exists) {
    return;
  }

  await db.collection("phrases").add({
    value: phraseData.value,
    topicIds: phraseData.topic_ids,
    topicPriorities: phraseData.topic_priorities,
    createdAt: FirebaseFirestore.Timestamp.now(),
  });
};
