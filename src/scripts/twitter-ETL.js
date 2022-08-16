/**
 * This script creates / updates the app's firebase collections from the dataSources.

/**
 * Update Users
 *
 * 1. paginate through users in firebase
 * 2. get their info
 * 3. post in users collection (set is fine)
 */

import { sleepSecs } from "twitter-api-v2/dist/v1/media-helpers.v1.js";
import { updateTweet, updateUser } from "../db/app.js";
import { db } from "../db/firebase.js";
import { readFileSyncWithCallback, writeFile } from "../helpers.js";
import {
  transformTwitterTweetToTweet,
  transformTwitterUserToUser,
} from "../transforms/twitter-to-app.js";

export const runUsersETL = async () => {
  const batchSize = 100;

  let userIdsProcessed = [];

  let userPaginator = db
    .collection("dataSources")
    .doc("twitter")
    .collection("users")
    .orderBy("id")
    .limit(batchSize);

  while (true) {
    const refs = await userPaginator.get();
    let lastDoc;
    refs.docs.forEach(async (doc) => {
      lastDoc = doc;
      const twitterUserData = doc.data();
      if (!twitterUserData) {
        console.error(`Error no data for user ${doc.id}`);
        throw "error no data for user in twitter userETL";
      }

      // store twitter userid
      userIdsProcessed.push(twitterUserData.id);

      // transform
      const userData = transformTwitterUserToUser(twitterUserData);

      // update user in db
      const userDoc = await db
        .collection("users")
        .where("twitterId", "==", twitterUserData.id)
        .get();

      let userId = userDoc.docs.pop()?.id;
      await updateUser(userId, userData);
    });

    // last doc
    if (refs.size < batchSize) {
      break;
    }

    // don't update fb too fast
    await sleepSecs(0.2);

    // update the paginator
    userPaginator = db
      .collection("dataSources")
      .doc("twitter")
      .collection("users")
      .orderBy("id")
      .startAfter(lastDoc)
      .limit(batchSize);
  }

  return userIdsProcessed;
};

/**
 * Update Tweets
 *
 * 1. Iterate through Users
 * 2. iterate through their tweets
 * 3. store data in memory
 * 4. figure out which tweets are threads
 * 4. post in tweets collection
 */

export const runTweetETL = async (twitterUserIds) => {
  const filenamePrefix = "runTweetETL_";
  const batchSize = 100;
  let tweetIdToRawData = {};
  let conversationIdToTweetIds = {};

  for (let userId of twitterUserIds) {
    let userPaginator = db
      .collection("dataSources")
      .doc("twitter")
      .collection("users")
      .doc(userId)
      .collection("tweets")
      .orderBy("id")
      .limit(batchSize);

    while (true) {
      const refs = await userPaginator.get();
      let lastDoc;
      refs.docs.forEach(async (doc) => {
        lastDoc = doc;

        const rawData = doc.data();
        if (!rawData) {
          throw `Error no data for tweet ${doc.id} user ${userId}`;
        }

        tweetIdToRawData[rawData.id] = rawData;
        conversationIdToTweetIds[rawData.conversation_id] = [
          ...(conversationIdToTweetIds[rawData.conversation_id] || []),
          rawData.id,
        ];
      });

      // last doc
      if (refs.size < batchSize) {
        break;
      }

      // update the paginator
      userPaginator = db
        .collection("dataSources")
        .doc("twitter")
        .collection("users")
        .doc(userId)
        .collection("tweets")
        .orderBy("id")
        .startAfter(lastDoc)
        .limit(batchSize);
    }

    // need to store in files b/c its a lot of data
    writeFile(`${filenamePrefix}${userId}`, {
      tweetIdToRawData,
      conversationIdToTweetIds,
    });

    // reset data
    tweetIdToRawData = {};
    conversationIdToTweetIds = {};
  }

  // for each file, read the tweets
  for (let userId of twitterUserIds) {
    readFileSyncWithCallback(`${filenamePrefix}${userId}`, (fileData) => {
      // for each tweet, transform the tweet
      Object.entries(fileData.tweetIdToRawData).forEach(
        async ([tweetId, rawTweet], count) => {
          // is this the beginning of a thread?
          isFirstTweetInThread =
            rawTweet.conversation_id === tweetId &&
            fileData.conversationIdToTweetIds[rawTweet.conversation_id].length >
              1;

          // transform
          const tweetData = transformTwitterTweetToTweet(rawData);

          // update tweet in db
          await updateTweet(tweetData);

          // don't overwhelm firebase
          if (count % 500) {
            await sleepSecs(0.2);
          }
        }
      );
    });
  }
};

// ---- Part 2 ----

/**
 * Update Topics
 *
 * 1. Iterate through tweets
 * 2. Pull out topics by running topic collection code
 * 3. Update topics, users, tweets and playlists.
 */
