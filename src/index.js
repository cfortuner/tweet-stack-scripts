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
import { readFile, writeFile } from "./helpers.js";

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

// This is just a quick way to get a bunch of prompts and reasonable results.
// results are cached unless you override with true.
// if you fetch new data, you'll have to inspect / update each completion in the resulting file
// await generateFinetuningTopicsDataset("scratch/eduContent", "all", 100, true);

// testing classification
let res;
//res = await runTopicClassification(
//   "Why I think NFTs will force Hollywood, Harvard, Salesforce, Nintendo etc to reinvent themselves \n\nA thread about how NFTs will shake things up:"
// );
// console.log(res);
// res = await runTopicClassification(
//   "There's never been a harder time to hire than right now.\n\nThese 5 threads show you the step-by-step process I used to recruit A+ players when no one else could.\n\nThe Hiring Thread of All Threads 🧵👇"
// );
// console.log(res);
// res = await runTopicClassification(
//   "Why start a startup? When something is so broken and you know you can fix it. Film schools cost $250K, admit 50, and rely on “who you know” for jobs. We changed that: teaching millions of learners, paying $10M+ to workers we hire. After 5 pivots here’s how @creatorup did it. A 🧵"
// );
// console.log(res);

// await getTopicPhrasesFromTweets("./scratch/eduContent", "all");
