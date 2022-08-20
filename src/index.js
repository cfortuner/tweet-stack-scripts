import { db } from "./db/firebase.js";
import { downloadTransformedTweets } from "./scripts/download-transformed-tweets.js";
import fetchTwitterData from "./scripts/fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./scripts/twitter-ETL.js";
import { findEduContent } from "./scripts/filter-tweets-for-edu-content.js";
import { runTopicClassification } from "./topic-classification/generate.js";
import { readFile, writeFile } from "./helpers.js";

/* Fetch and transform data */
// await fetchTwitterData();
// const userIds = await runUsersETL();
// await runTweetETL(userIds);

/* Tweet Analysis */
// await downloadTransformedTweets();

// load the transform tweets and find the educational content
// findEduContent("scratch/downloadTransformedTweets");

const tweets = readFile("scratch/eduContent", "all");
// let limit = 10;
// let results = [];
// for (let tweet of tweets) {
//   limit -= 1;
//   const topics = await runTopicClassification(tweet.text);
//   results.push({
//     tweet,
//     topics,
//   });
//   if (limit === 0) {
//     break;
//   }
// }
// writeFile("scratch/topic-classification", "openai.json", results);
