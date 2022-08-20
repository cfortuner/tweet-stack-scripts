import { readFile, writeFile } from "../helpers.js";

export const findEduContent = (tweetFolder) => {
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

    const threadsOnly = tweets.filter((tw) => tw.isThread);
    const firstTweets = filterFirstTweetsInConv(threadsOnly);
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

  writeFile("scratch/eduContent", "all", allEduPosts);

  allEduPosts = allEduPosts.filter((post) => {
    return post.isThread;
  });

  return allEduPosts;
};

export const filterFirstTweetsInConv = (tweets) => {
  return tweets.filter((t) => t.isFirstTweet);
};

export const textIncludesString = (text, str) => {
  const regex = new RegExp(`((\\W)|^)${str}((\\W)|$)`, "g");
  return regex.test(text);
};

export const textIncludesNumber = (text) => {
  return /\d/.test(text);
};

export const normalizeText = (text) => {
  return text
    .trim()
    .toLowerCase()
    .replaceAll(/\n/g, " ")
    .replaceAll(/\s+/g, " ");
};

export const replaceNumbersWithSymbol = (text, symbol) => {
  return text.replaceAll(/\d/g, symbol);
};
