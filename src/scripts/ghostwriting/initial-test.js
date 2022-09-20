import { Configuration, OpenAIApi } from "openai";
import { db } from "../../db/firebase.js";
import config from "../../config.js";
import { writeFile } from "../../helpers.js";

const configuration = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(configuration);

export const submit = async (
  prompt,
  topP = 1,
  model = undefined,
  temperature = 1,
  max_tokens = 2500
) => {
  let completion;
  try {
    completion = await openai.createCompletion({
      model: model || "text-davinci-002",
      prompt,
      temperature,
      frequency_penalty: 1,
      presence_penalty: 1,
      max_tokens,
      top_p: topP,
    });
  } catch (e) {
    console.log(e);
    return;
  }

  return completion.data.choices;
};

// get some threads from Shaan

export const runGhostwritingTest = async () => {
  const shaanTweets = await db
    .collection("threads-index")
    .where("twitterUsername", "==", "ShaanVP")
    .limit(1000)
    .get();

  const shaanBestTweets = shaanTweets.docs
    .map((t) => t.data())
    .sort((a, b) => (a.likeCount > b.likeCount ? -1 : 1))
    .filter((t) => t.text.length > 400)
    .slice(0, 10);

  const temperature = 1;
  let res = [];
  for (const tweet of shaanBestTweets) {
    const max_tokens = Math.min(tweet.conversationIds.length * 360, 1000);
    const prompt = `Write a tweet about the following topics:\n${tweet.phrases.map(
      (p) => `Topic: ${p}\n`
    )}Tweet:`;
    const choices = await submit(prompt);

    // console.log(prompt);
    console.log(choices);
    res.push({
      tweetId: tweet.tweetId,
      choices: choices.map((c) => c.text),
    });

    console.log("\n\n\n");
  }

  writeFile(
    "./scratch/ghostwriting",
    "shaan.json",
    JSON.stringify(res, undefined, 4)
  );
};

/**
 * 1.) Read tweets from file
 * 2.) Call open ai to classify the tweets
 * 3.) Store tweets in finetuning dataset
 */
export const mostViralTweetsDataset = async () => {
  const tweetDocs = await db
    .collection("threads-index")
    .orderBy("likeCount", "desc")
    .limit(500)
    .get();

  const dataset = [];

  for (const tweetRef of tweetDocs.docs) {
    const tweetData = tweetRef.data();

    console.log("\n\n");
    console.log(tweetData);
    console.log(
      `https://twitter.com/${tweetData.twitterUsername}/status/${tweetData.tweetId}`
    );
    console.log(tweetData.twitterUserId);
    console.log(tweetData.likeCount);
    console.log(tweetData.followersCount);
    console.log(tweetData.firstTweetText);
    console.log("\n\n");

    // dataset.push({
    //   prompt: `
    //     Write a viral tweet based on this content:
    //     Content: ${tweetData.text}
    //     `,
    // });
  }

  //   // scratch file for storage
  //   writeFile("./scratch/ghostwriting", "finetuning-most-viral.json");
};
