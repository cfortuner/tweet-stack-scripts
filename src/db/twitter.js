import { sleepSecs } from "twitter-api-v2/dist/v1/media-helpers.v1.js";
import { db } from "./firebase.js";

export const updateUser = async (user) => {
  const usersCollection = db
    .collection("dataSources")
    .doc("twitter")
    .collection("users");

  await usersCollection.doc(user.id).set(user, {
    merge: true,
  });
};

/**
 * Update tweets in firebase for a user
 *
 * @param {*} userId string
 * @param {*} tweets TweetV2[]
 * @param {*} latestTweetId string
 * @returns
 */
export const updateTweets = async (userId, tweets, latestTweetId) => {
  if (!tweets.length) {
    console.debug(`No new tweets for user ${userId}`);
    return;
  }
  if (!latestTweetId) {
    throw "Must include latestTweetId to updateTweets in db ${userId}";
  }

  const usersCollection = db
    .collection("dataSources")
    .doc("twitter")
    .collection("users");

  // update the tweets collection
  let count = 0;
  for (let tweet of tweets) {
    count += 1;
    if (count > 400) {
      // only 400 doc writes per sec to avoid the 500 limit
      await sleepSecs(1);
      count = 0;
    }
    usersCollection.doc(userId).collection("tweets").doc(tweet.id).set(tweet);
  }

  // update the latestTweetId only if there was no error in saving the tweets
  await usersCollection.doc(userId).set(
    {
      latestTweetId,
    },
    {
      merge: true,
    }
  );
};

export const getLatestTweetId = async (userId) => {
  const usersCollection = db
    .collection("dataSources")
    .doc("twitter")
    .collection("users");
  const doc = await usersCollection.doc(userId).get();
  return doc.data()?.latestTweetId;
};

// this would be alot of reads lol
// export const getTweets = async (userId) => {
//   const userDoc = db
//     .collection("dataSources")
//     .doc("twitter")
//     .collection("users")
//     .doc(userId);

//   const snapshot = await userDoc.collection("tweets").listDocuments();
//   const documentData = snapshot.map(async (doc) => {
//     return doc.data();
//   });
//   return documentData;
// };

export const getUser = async (userId) => {
  const userDoc = await db
    .collection("dataSources")
    .doc("twitter")
    .collection("users")
    .doc(userId)
    .get();

  return userDoc.data();
};

export const getUsers = async (userIds) => {
  if (userIds) {
    const userDocs = await db
      .collection("dataSources")
      .doc("twitter")
      .collection("users")
      .where("id", "in", userIds)
      .get();
    let res = [];
    userDocs.docs.forEach((doc) => {
      const data = doc.data();
      res.push(data);
    });
    return res;
  }

  const documents = await db
    .collection("dataSources")
    .doc("twitter")
    .collection("users")
    .listDocuments();

  return documents.map(async (d) => {
    const doc = await d.get();
    return doc.data();
  });
};
