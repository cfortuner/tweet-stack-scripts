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
export const getUserByTwitterUserId = async (twitterUserId) => {
  const ss = await db
    .collection("users")
    .where("twitterUserId", "==", twitterUserId)
    .get();
  return ss.docs.pop();
};
export const getUserById = async (userId) => {
  return await db.collection("users").doc(userId).get();
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

export const updateIndex = async () => {
  await db.collection("users").listDocuments();

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

  const chunks = chunkArray(userDocRefs, 1);
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
  // 8/22/22 should at least include the following indexed fields
  // twitterUsername,twitterName,name,description,followersCount

  // Create Record
  const userIndexRecord = {
    // indexed
    twitterUsername: userData.twitterUsername,
    twitterName: userData.twitterName,
    name: userData.name,
    description: userData.description,
    followersCount: userData.publicMetrics.followers_count,

    // not indexed, but available in the record
    userId,
    twitterUserId: userData.twitterUserId,
    tweetCount: userData.publicMetrics.tweet_count,
  };

  return userIndexRecord;
};

const createIndex = async (tweetId, tweetData, userId, userData) => {
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
    topics = topics.concat(topicDocs.map((topicDoc) => topicDoc.data().value));
    topicIds = topicIds.concat(topicDocs.map((doc) => doc.id));
  }

  // Dedupe
  phrases = Array.from(new Set(phrases));
  topics = Array.from(new Set(topics));
  topicIds = Array.from(new Set(topicIds));

  // 8/22/22 should contain at least the following indexed fields
  // authorName,topics,phrases,text,authorTwitterUsername,likeCount,retweetCount,quoteCount

  // Create Record
  const threadIndexRecord = {
    // indexed
    authorName,
    topics,
    phrases,
    text, // text for all tweets
    authorTwitterUsername,
    likeCount: tweetData.publicMetrics.like_count,
    retweetCount: tweetData.publicMetrics.retweet_count,
    quoteCount: tweetData.publicMetrics.quote_count,

    // not indexed
    tweetId: tweetData.tweetId,
    tweetType,
    replyCount: tweetData.publicMetrics.reply_count,
    authorId: tweetData.authorId,
    isFirstTweet: tweetData.isFirstTweet,
    isThread: tweetData.isThread,
    conversationIds,
    topicIds,
    phraseIds: tweetData.phraseIds,
  };

  return threadIndexRecord;
};

const getAllUsers = async () => {
  const userRefs = await db.collection("users").listDocuments();
  let userDocs = [];
  for (const userRef of userRefs) {
    const userDoc = await userRef.get();
    userDocs.push(userDoc);
  }
  return userDocs;
};

const getAllTweetsByType = async (tweetType) => {
  const batchSize = 500;

  let tweetPaginator = db
    .collection("tweets")
    .where("tweetType", "==", tweetType)
    .limit(batchSize);

  let tweetDocs = [];
  while (true) {
    const snapshots = await tweetPaginator.get();

    tweetDocs = tweetDocs.concat(snapshots.docs);

    if (snapshots.docs.length < batchSize) {
      // last batch
      break;
    }

    tweetPaginator = tweetPaginator.startAfter(snapshots.docs.pop());
  }

  return tweetDocs;
};

export const updateIndexV2 = async () => {
  // get all threads of type Education
  const tweetDocs = await getAllTweetsByType("Educational");

  for (const tweetDoc of tweetDocs) {
    const indexRecord = await createIndexRecord(tweetDoc, tweetData);
    const tweetData = tweetDoc.data();
    await updateUserIndexRecord(tweetData.indexRecordId, indexRecord);
  }
};

export const getConversationIds = async (firstTweetId, twitterUserId) => {
  const tweetDocs = await db
    .collection("dataSources")
    .doc(twitterUserId)
    .collection("tweets")
    .where("conversation_id", "==", firstTweetId)
    .limit(1000)
    .get();

  return tweetDocs.docs.map((doc) => doc.data());
};

export const getEntireThreadText = (tweetDatas) => {
  let tweetIdToTweet = {};
  tweetDatas.forEach((td) => {
    tweetIdToTweet[td.id] = td;
  });

  const lastTweetId = tweetDatas
    .map((d) => d.id)
    .filter((id) => {
      const found = tweetDatas.find((td) => {
        const firstRefTweet = td.referenced_tweets?.shift();
        return firstRefTweet.id === id;
      });

      return !found;
    });

  // now build up the text backwards

  let textArr = [];
  let nextTweet = tweetIdToTweet[lastTweetId];
  while (nextTweet.referenced_tweets?.length) {
    textArr.unshift(nextTweet.text);
    nextTweet = tweetIdToTweet[nextTweet.referenced_tweets[0].id];
  }

  return textArr.reverse().join("\n");
};

const createIndexRecord = async (tweetData) => {
  const userDoc = await getUserById(tweetData.userId);
  const userData = userDoc.data();

  const conversationTweetDatas = await getConversation(tweetData.tweetId);
  const entireThreadText = getEntireThreadText(
    tweetData.tweetId,
    conversationTweetDatas
  );

  const phraseDocs = await getPhrasesByIds(tweetData.phrases);
  const phraseDatas = phraseDocs.map((phraseDoc) => phraseDoc.data());
  const phraseIds = phraseDocs.map((d) => d.id);

  let topicIds = [];
  let topics = [];
  for (const phraseData of phraseDatas) {
    const topicDocs = await getTopicsByIds(phraseData.topicIds);
    const topicDatas = topicDocs.map((t) => t.data());
    topics = topics.concat(topicDatas.map((d) => d.value));
    topicIds = topics.concat(topicDocs.map((d) => d.id));
  }

  return {
    twitterUsername: userData.twitterUsername,
    twitterName: userData.twitterName,
    username: userData.name,
    userDescription: userData.description,
    text: entireThreadText,
    followersCount: userData?.publicMetrics?.followers_count,
    likeCount: tweetData.publicMetrics.like_count,
    retweetCount: tweetData.publicMetrics.retweet_count,
    quoteCount: tweetData.publicMetrics.quote_count,
    phrases: phraseDatas.map((phrase) => phrase.value),
    topics,

    // not indexed
    tweetId: tweetData.tweetId,
    userId: userDoc.id,
    twitterUserId: userData.twitterUserId,
    firstTweetId: tweetData.id,
    conversationIds,
    topicIds,
    phraseIds,
  };
};
