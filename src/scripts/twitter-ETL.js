import fs from "fs";
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
import { readFile, writeFile } from "../helpers.js";
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
    for (let doc of refs.docs) {
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
    }

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
  const destFolder = "./scratch/runTweetETL";
  const batchSize = 100;
  let tweetIdToRawData = {};
  let conversationIdToTweetIds = {};

  if (!fs.existsSync(destFolder)) {
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
        for (let doc of refs.docs) {
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
        }

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
      writeFile(destFolder, userId, {
        tweetIdToRawData,
        conversationIdToTweetIds,
      });

      // reset data
      tweetIdToRawData = {};
      conversationIdToTweetIds = {};
    }
  }

  // for each file, read the tweets
  for (let userId of twitterUserIds) {
    const fileData = readFile(destFolder, userId);

    // for each tweet, transform the tweet
    let count = 0;
    for (let [tweetId, rawTweet] of Object.entries(fileData.tweetIdToRawData)) {
      // is this the beginning of a thread?
      const isFirstTweet = rawTweet.conversation_id === tweetId;

      const isThread =
        fileData.conversationIdToTweetIds[rawTweet.conversation_id].length > 1;

      // transform
      const tweetData = transformTwitterTweetToTweet(
        rawTweet,
        isFirstTweet,
        isThread
      );

      // update tweet in db
      await updateTweet(tweetData);

      // don't overwhelm firebase
      if (count % 500 === 0) {
        await sleepSecs(0.5);
      }

      count += 1;
    }
  }
};
