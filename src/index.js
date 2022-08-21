import { db } from "./db/firebase.js";
import { downloadTransformedTweets } from "./scripts/download-transformed-tweets.js";
import fetchTwitterData from "./scripts/fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./scripts/twitter-ETL.js";
import { findEduContent } from "./scripts/filter-tweets-for-edu-content.js";
import { generateFinetuningTopicsDataset } from "./topic-classification/topic-classification.js";
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
await generateFinetuningTopicsDataset("scratch/eduContent", "all", 100, true);
