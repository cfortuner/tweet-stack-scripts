import { db } from "../db/firebase.js";
import { downloadTransformedTweets } from "./download-transformed-tweets.js";
import fetchTwitterData from "./fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./twitter-ETL.js";
import { findEduContent } from "./filter-tweets-for-edu-content.js";
import {
  generateFinetuningTopicsDataset,
  getTopicPhrasesFromTweets,
  runFineTunedTopicClassification,
  runTopicClassification,
} from "../topic-classification/topic-classification.js";
import { readFile, writeFile } from "../helpers.js";

/**
 * This is a one off script that is just a reference point for the
 * next time i want to do this. It shouldn't be used again.
 */

// --------------------
// 3) TOPIC CLASSIFICATION
// --------------------

// This is just a quick way to get a bunch of prompts and reasonable results.
// results are cached unless you override with true.
// if you fetch new data, you'll have to inspect / update each completion in the resulting file
// await generateFinetuningTopicsDataset("scratch/eduContent", "all", 100, true);

// testing classification
// let res;
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

// ---------
// further classification
// ---------

// const tweets = readFile("./", "tweetsWithTopicPhrases.json");
// const hyphenated = readFile("./", "hyphenated copy.json");
// const hyphenatedExact = readFile("./", "hyphenated.json");

// const allTopics = [];
// const tweetsWithTopics = [];

// let count = 0;
// for (let tweet of tweets) {
//   let topicResponse;
//   try {
//     topicResponse = tweet.topics.pop();
//   } catch (e) {
//     count += 1;
//     console.log(e);
//     continue;
//   }
//   let topics = topicResponse.text.replace(/(\r\n|\n|\r)/gm, "").split("- ");
//   topics = topics
//     .filter((t) => t !== "")
//     .reduce((prev, top) => {
//       const indexOf = hyphenatedExact.indexOf(top);
//       if (indexOf >= 0) {
//         const hyphRes = hyphenated[indexOf].split("*").filter((t) => t !== "");
//         return [...prev, ...hyphRes];
//       } else {
//         return [...prev, top];
//       }
//     }, []);

//   for (let topic of topics) {
//     if (hyphenated.includes(topic)) {
//       hyphenated.push(topic);
//     }
//     allTopics.push(topic);
//   }

//   tweetsWithTopics.push({
//     tweet: tweet.tweet,
//     topics,
//   });
// }

// writeFile("./", "allTopics.json", allTopics);
// writeFile("./", "tweetsWithTopics.json", tweetsWithTopics);

// we have all topics,

// const f = readFile("./", "allTweetsWithTopicsAndKeywords.json");

// let res = [];
// for (let tweet of f) {
//   let topics = [];
//   for (let i = 0; i < tweet.topics.phrases.length; i++) {
//     let keywords = tweet.topics.keywords;
//     topics.push({
//       phrase: tweet.topics.phrases[i],
//       keywords: keywords[i],
//     });
//   }

//   res.push({
//     tweet: tweet.tweet,
//     topics,
//   });
// }
// writeFile("./", "final.json", res);
