import { db, firestore } from "./db/firebase.js";
import { downloadTransformedTweets } from "./scripts/download-transformed-tweets.js";
import fetchTwitterData from "./scripts/fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./scripts/twitter-ETL.js";
import { findEduContent } from "./scripts/filter-tweets-for-edu-content.js";
import {
  generateFinetuningTopicsDataset,
  getTopicPhrasesFromTweets,
  runFineTunedTopicClassification,
  runTopicClassification,
} from "./topic-classification/topic-classification.js";
import { chunkArray, readFile, writeFile } from "./helpers.js";
import {
  addPhrase,
  addTopic,
  getConversation,
  getEntireThreadText,
  getPhraseById,
  getPhrasesByIds,
  getTopicsByIds,
  getTweetById,
  getUserByTwitterUserId,
  updateIndex,
  updateTweet,
  updateUser,
} from "./db/app.js";
import { sleepSecs } from "twitter-api-v2/dist/v1/media-helpers.v1.js";
import {
  mostViralTweetsDataset,
  runGhostwritingTest,
} from "./scripts/ghostwriting/initial-test.js";
import { runPodcastTest } from "./scripts/ghostwriting/podcast-test.js";
import {
  cleanResults,
  runPodcastToThread,
} from "./scripts/ghostwriting/prompt-pipelining.js";
import { cleanYTData } from "./scripts/ghostwriting/extract-yt-data.js";

// --------------------
// 1) FETCH & TRANSFORM
// --------------------

// await fetchTwitterData();
// const userIds = await runUsersETL();
// await runTweetETL(userIds);

// --------------------
// 2) THREAD FILTERING
// --------------------

// await downloadTransformedTweets();
// findEduContent("scratch/downloadTransformedTweets");

// --------------------
// 3) TOPIC CLASSIFICATION
// --------------------

// TODO: Create a repeatable process for topic classification

// --------------------
// 4) ADD Topics to db
// --------------------

// TODO: create a repeatable process for adding topics to db

// --------------------
// 5) Build the Index Data in firebase
// --------------------

// await updateIndex();

// await runGhostwritingTest();

// const f = readFile("./scratch/ghostwriting", "shaan");
// const d = JSON.parse(f);

// const r = d.map((f) => {
//   return {
//     tweetId: f.tweet.tweetId,
//     choices: f.choices?.data?.text,
//   };
// });

// writeFile("./scratch/ghostwriting", "shaan_formatted", JSON.stringify(r));

const uploadToFirebase = async (videoData, results) => {
  await db
    .collection("dataSources")
    .doc("youtube")
    .collection("videos")
    .doc(videoData.id)
    .set(
      {
        ...videoData,
      },
      { merge: true }
    );

  for (const draft of results) {
    await db
      .collection("dataSources")
      .doc("youtube")
      .collection("videos")
      .doc(videoData.id)
      .collection("drafts")
      .add({ ...draft });
  }
};

const outputFolder = "shaan";
let videoData = readFile(`./${outputFolder}`, "cleaned.json");
if (!videoData) {
  videoData = await cleanYTData("shaan-data.json", outputFolder);
}

let results = readFile(`./${outputFolder}`, "podcastToThread.json");
if (!results) {
  results = await runPodcastToThread(videoData, outputFolder);
}
await uploadToFirebase(videoData, results);
