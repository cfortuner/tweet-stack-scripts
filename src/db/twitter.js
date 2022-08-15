import { db } from "./firebase.js";

export const getTwitterUsersCollection = async (isTest) => {
  const docId = isTest ? "twitter-test" : "twitter";
  return db.collection("dataSources").doc(docId).collection("users");
};

export const updateUser = async (user, isTest) => {
  const usersCollection = await getTwitterUsersCollection(isTest);

  await usersCollection.doc(user.data.id).set(user, {
    merge: true,
  });
};

/**
 * Update tweets in firebase for a user
 *
 * @param {*} userId string
 * @param {*} tweets TweetV2[]
 * @param {*} latestTweetId string
 * @param {*} isTest boolean
 * @returns
 */
export const updateTweets = async (userId, tweets, latestTweetId, isTest) => {
  if (!tweets.length) {
    console.debug(`No new tweets for user ${userId}`);
    return;
  }
  if (!latestTweetId) {
    throw "Must include latestTweetId to updateTweets in db ${userId}";
  }

  const usersCollection = await getTwitterUsersCollection(isTest);

  // update the latestTweetId
  await usersCollection.doc(userId).set(
    {
      latestTweetId,
    },
    {
      merge: true,
    }
  );

  // update the tweets collection
  tweets.forEach(async (tweet) => {
    await usersCollection
      .doc(userId)
      .collection("tweets")
      .doc(tweet.id)
      .set(tweet);
  });
};

export const getLatestTweetId = async (userId, isTest) => {
  const usersCollection = await getTwitterUsersCollection(isTest);
  const doc = await usersCollection.doc(userId).get();
  return doc.data()?.latestTweetId;
};
