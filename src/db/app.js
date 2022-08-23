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

export const getTweetById = async (tweetId) => {
  return await db.collection("tweets").doc(tweetId).get();
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
  const topicRefs = topicIds.map((tid) => {
    return db.collection("topics").doc(tid);
  });
  return db.getAll(...topicRefs);
};

export const getPhrasesByIds = async (phraseIds) => {
  const docRefs = phraseIds.map((pid) => {
    return db.collection("phrases").doc(pid);
  });
  return await db.getAll(...docRefs);
};

// index helpers

export const updateIndex = async () => {
  const tweetDocs = await getAllTweetsByType("Educational");

  const chunks = chunkArray(tweetDocs, 10);

  const processDoc = async (tweetDoc) => {
    const tweetData = tweetDoc.data();
    const indexRecord = await createIndexRecord(tweetData);
    await updateIndexRecord(tweetData.indexRecordId, indexRecord);
  };

  const failures = [];

  for (const chunk of chunks) {
    try {
      await Promise.all(chunk.map((doc) => processDoc(doc)));
    } catch (e) {
      console.error(e);
      failures.push(chunk);
    }

    await sleepSecs(1);
  }

  return failures;
};

export const createIndexRecord = async (tweetData) => {
  const userDoc = await getUserById(tweetData.userId);
  const userData = userDoc.data();

  const conversationTweetDatas = await getConversation(
    tweetData.tweetId,
    userData.twitterUserId
  );
  const entireThreadText = getEntireThreadText(conversationTweetDatas);

  const phraseDocs = await getPhrasesByIds(tweetData.phraseIds);
  const phraseDatas = phraseDocs.map((phraseDoc) => phraseDoc.data());
  let phraseIds = phraseDocs.map((d) => d.id);
  phraseIds = Array.from(new Set(phraseIds));
  let phrases = phraseDatas.map((phrase) => phrase.value);
  phrases = Array.from(new Set(phrases));

  let topicIds = [];
  let topics = [];
  for (const phraseData of phraseDatas) {
    const topicDocs = await getTopicsByIds(phraseData.topicIds);
    const topicDatas = topicDocs.map((t) => t.data());
    topics = topics.concat(topicDatas.map((d) => d.value));
    topicIds = topicIds.concat(topicDocs.map((topicDoc) => topicDoc.id));
  }
  topics = Array.from(new Set(topics));
  topicIds = Array.from(new Set(topicIds));

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
    topics,
    phrases,

    // not indexed
    tweetId: tweetData.tweetId,
    userId: userDoc.id,
    twitterUserId: userData.twitterUserId,
    conversationIds: conversationTweetDatas.map((td) => td.id),
    topicIds,
    phraseIds,
  };
};

export const updateIndexRecord = async (indexRecordId, indexRecord) => {
  if (indexRecordId) {
    await db
      .collection("index")
      .doc(indexRecordId)
      .set(indexRecord, { merge: true });
    return indexRecordId;
  }

  const doc = await db.collection("index").add(indexRecord);
  return doc.id;
};

export const getConversation = async (firstTweetId, twitterUserId) => {
  const tweetDocs = await db
    .collection("dataSources")
    .doc("twitter")
    .collection("users")
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
        const firstRefTweet = td.referenced_tweets?.[0];
        return firstRefTweet?.id === id;
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
  textArr.unshift(nextTweet.text);

  return textArr.join("\n");
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
