import { db } from "./db/firebase.js";
import { readFile, writeFile } from "./helpers.js";
import { downloadTransformedTweets } from "./scripts/download-transformed-tweets.js";
import fetchTwitterData from "./scripts/fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./scripts/twitter-ETL.js";
import {
  filterFirstTweetsInConv,
  normalizeText,
  replaceNumbersWithSymbol,
  textIncludesString,
} from "./tweet-filters.js";

/* Fetch and transform data */

// await fetchTwitterData();

/* ETL data into app collections */
// const userIds = await runUsersETL();
// await runTweetETL(userIds);

// -----------------------

/* Tweet Analysis */

/* download app tweets data into files for analysis */
// await downloadTransformedTweets();

/**
 * Finding Edu content
 * - find first tweets from datasets
 * - Apply heurisitics to data to filter out noise
 */

const findEduContent = (tweetFolder) => {
  let fileNumber = 0;
  let totalEduPosts = 0;
  let totalFirstTweets = 0;

  let allEduPosts = [];

  while (true) {
    let tweets;
    try {
      tweets = readFile(tweetFolder, fileNumber.toString());
    } catch (e) {
      break;
    }
    fileNumber += 1;

    const firstTweets = filterFirstTweetsInConv(tweets);
    totalFirstTweets += firstTweets.length;

    const results = firstTweets.filter((tweet) => {
      let text = tweet.text;

      // remove links so they don't match
      text = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "");
      text = normalizeText(text);

      let numberSymbol = "###";

      text = replaceNumbersWithSymbol(text, numberSymbol);

      const isEduContent = [
        `these ${numberSymbol}`,
        `${numberSymbol} things`,
        `${numberSymbol} ways`,
        `${numberSymbol} steps`,
        `${numberSymbol} common`,
        `${numberSymbol} common`,
        `${numberSymbol} tips`,
        `a guide`,
        `a guide to`,
        `avoid these`,
        `common mistakes`,
        "🧵",
        "here are",
        "here's how",
        `here's ${numberSymbol}`,
        "here's why",
        "here's what",
        "that will make you",
        "thread",
        "the solution",
        "things that",
        "tips",
        "follow this",
        "framework",
        "masterclass",
        "struggle with",
        "solution",
        "you need",
        "do this instead",
        "how to",
        "how you should",
        "how you can",
        "if you want to",
        "lessons",
        "👉",
      ].reduce((prev, str) => {
        const doesMatch = textIncludesString(text, str);
        return prev || doesMatch;
      }, false);

      return isEduContent;
    });

    totalEduPosts += results.length;
    allEduPosts = allEduPosts.concat(results);
  }
  console.log(
    "------------------------\n",
    "Total number of edu posts",
    totalEduPosts,
    "out of ",
    totalFirstTweets
  );
  return allEduPosts;
};

const allEduContent = findEduContent("downloadTransformedTweets");

writeFile("eduContent", "all", allEduContent);
