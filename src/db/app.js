import { sleepSecs } from "twitter-api-v2/dist/v1/media-helpers.v1.js";
import { chunkArray } from "../helpers.js";
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
      .set(userIndexRecord, { merge: true });
    return userIndexRecordId;
  }
};

export const updateUsersIndex = async (userIds) => {
  const userDocRefs = userIds?.length
    ? await db.collection("users").where("id", "in", userIds).listDocuments()
    : await db.collection("users").listDocuments();

  const updateFn = async (userDocRef) => {
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    const userIndexRecord = await createUserIndexRecord(userDoc.id, userData);
    const userIndexRecordId = await updateUserIndexRecord(
      userData.userIndexRecordId,
      userIndexRecord
    );

    // store the index record id in the user doc for future use
    await updateUser(userDoc.id, { userIndexRecordId });
  };

  const chunks = chunkArray(userDocRefs, 10);
  for (const chunk of chunks) {
    try {
      await Promise.all(chunk.map((userDocRef) => updateFn(userDocRef)));
    } catch (e) {
      console.error(chunk);
      console.error(e);
    }
    await sleepSecs(1);
  }
};

const createUserIndexRecord = async (userId, userData) => {
  // Get Phrases
  const phraseIds = userData.phraseIds || [];
  const phraseDocs = await getPhrasesByIds(phraseIds);
  const phraseDatas = phraseDocs.map((phraseDoc) => phraseDoc.data());
  const phrases = phraseDatas.map((phraseData) => phraseData.value);

  // Update Topics and Topic Ids
  let topicIds = [];
  let topics = [];
  for (const phraseData of phraseDatas) {
    const topicDocs = await getTopicsByIds(phraseData.topicIds);
    topics = topics.concat(topicDocs.map((topicDoc) => topicDoc.data().name));
    topicIds = topicIds.concat(topicDocs.map((doc) => doc.id));
  }

  // Dedupe
  phrases = Array.from(new Set(phrases));
  topics = Array.from(new Set(topics));
  topicIds = Array.from(new Set(topicIds));

  // 8/22/22 should at least include the following indexed fields
  // twitterUsername,name,description,topics,phrases,followersCount,tweetCount

  // Create Record
  const userIndexRecord = {
    // indexed
    twitterUsername: userData.twitterUsername,
    name: userData.name,
    description: description,
    topics,
    phrases,
    followersCount: userData.publicMetrics.followers_count,

    // not indexed, but available in the record
    userId,
    twitterId: userData.twitterId,
    topicIds,
    phraseIds,
    tweetCount: userData.publicMetrics.tweet_count,
  };

  return userIndexRecord;
};

/**
 * 
 *   "tweet": {
            "isThread": true,
            "tweetId": "1387045851495755776",
            "authorId": "1218201923947548672",
            "isFirstTweet": true,
            "text": "All the mistakes you will every make in your life have already been made by those before you. \n\nDo you really think the challenges you are facing are unique to you?\n\n• Read with an open mind \n• Listen to people’s stories + lessons \n• Converse with mentors + experts",
            "publicMetrics": {
                "retweet_count": 39,
                "reply_count": 17,
                "quote_count": 3,
                "like_count": 220
            },
            "topicIds": []
 */

const createThreadIndexRecord = async (tweetId, tweetData) => {
  // Tweet data for Index
  const threadIndexData = {
    authorId: tweetData.authorId,
    isFirstTweet: tweetData.isFirstTweet,
    isThread: tweetData.isThread,
    name: userData.name,
    tweetId: tweetData.tweetId,
    phraseIds: tweetData.phraseIds,
    likeCount: tweetData.publicMetrics.like_count,
    retweetCount: tweetData.publicMetrics.retweet_count,
    quoteCount: tweetData.publicMetrics.quote_count,
    replyCount: tweetData.publicMetrics.reply_count,
  };

  // get from user
  const authorTwitterUsername = "";
  const authorName = "";

  // compile all thread text into one
  const text = "";
  const conversationIds = [];

  // Get Phrases
  const phraseIds = tweetData.phraseIds || [];
  const phraseDocs = await getPhrasesByIds(phraseIds);
  const phraseDatas = phraseDocs.map((phraseDoc) => phraseDoc.data());
  const phrases = phraseDatas.map((phraseData) => phraseData.value);

  // Update Topics and Topic Ids
  let topicIds = [];
  let topics = [];
  for (const phraseData of phraseDatas) {
    const topicDocs = await getTopicsByIds(phraseData.topicIds);
    topics = topics.concat(topicDocs.map((topicDoc) => topicDoc.data().name));
    topicIds = topicIds.concat(topicDocs.map((doc) => doc.id));
  }

  // Dedupe
  phrases = Array.from(new Set(phrases));
  topics = Array.from(new Set(topics));
  topicIds = Array.from(new Set(topicIds));

  // Create Record
  const threadIndexRecord = {
    ...threadIndexData,
    authorTwitterUsername,
    authorName,
    text,
    conversationIds,
    phrases,
    topics,
    topicIds,
    phraseIds,
  };

  return threadIndexRecord;
};
