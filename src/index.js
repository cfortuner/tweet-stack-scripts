import { db } from "./db/firebase.js";
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
import { addPhrase, addTopic } from "./db/app.js";
import { sleepSecs } from "twitter-api-v2/dist/v1/media-helpers.v1.js";

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
// 4) ADD Topics
// --------------------

const tweetsAndTopics = readFile("./", "final.json");

const chunks = chunkArray(tweetsAndTopics, 10);

const addTopicsAndPhrases = async (tweetAndTopic) => {
  const { tweet, topics } = tweetAndTopic;

  // add topics and phrases
  for (let topic of topics) {
    let topicPriorities = [];
    for (let [keyword, priority] of topic.keywords) {
      const topicDoc = await addTopic({
        value: keyword,
      });
      topicPriorities.push({
        topicId: topicDoc.id,
        priority,
      });
    }

    await addPhrase({
      value: topic.phrase,
      topicPriorities,
    });
  }
};

// keep track of failured chunks
const failures = [];

while (chunks.length) {
  const chunk = chunks.pop();

  try {
    await Promise.all(chunk.map((data) => addTopicsAndPhrases(data)));

    sleepSecs(1);
  } catch (e) {
    failures = failures.concat(chunk);
  }
}

writeFile("./", "failures.json", failures);
