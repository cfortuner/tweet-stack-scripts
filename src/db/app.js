import { db, firestore } from "./firebase.js";

export const updateUser = async (userId, userData) => {
  if (!userId) {
    await db.collection("users").add(userData);
  } else {
    await db.collection("users").doc(userId).set(userData, { merge: true });
  }
};

export const updateTweet = async (tweetId, tweetData) => {
  if (!(tweetId && tweetData)) {
    throw "error updating tweet";
  }
  await db.collection("tweets").doc(tweetId).set(tweetData, { merge: true });
};

export const getTopicByName = async (topicName) => {
  return await db.collection("topics").where("name", "==", topicName).get();
};

export const addTopic = async (topicData) => {
  const topicSnapshot = await getTopicByName(topicData.name);
  if (!topicSnapshot.empty) {
    return topicSnapshot.docs.pop();
  }

  return await db.collection("topics").add({
    value: topicData.name,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const addPhrase = async (phraseData) => {
  const phraseSnapshot = await db
    .collection("phrases")
    .where("value", "==", phraseData.value)
    .get();
  if (!phraseSnapshot.empty) {
    return phraseSnapshot.docs.pop();
  }

  return await db.collection("phrases").add({
    value: phraseData.value,
    topicIds: phraseData.topicIds,
    topicPriorities: phraseData.topicPriorities,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getPhraseById = async (phraseId) => {
  const ss = await db.collection("phrases").get(phraseId);
  return ss.docs.pop();
};
export const getTopicById = async (topicId) => {
  const ss = await db.collection("topics").get(topicId);
  return ss.docs.pop();
};

export const getTopicsByIds = async (topicIds) => {
  const ss = await db.collection("topics").where("id", "in", topicIds).get();
  return ss.docs;
};

export const getPhrasesByIds = async (phraseIds) => {
  const ss = await db.collection("phrases").where("id", "in", phraseIds).get();
  return ss.docs;
};

// index helpers

export const updateUserIndexRecord = async (
  userIndexRecordId,
  userIndexRecord
) => {
  if (!userIndexRecordId) {
    const doc = await db.collection("users-index").add(userIndexRecord);
    return doc.id;
  } else {
    await db
      .collection("users-index")
      .doc(userIndexRecordId)
      .set(userIndexRecord);
    return userIndexRecordId;
  }
};
