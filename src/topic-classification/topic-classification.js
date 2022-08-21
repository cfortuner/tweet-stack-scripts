import { Configuration, OpenAIApi } from "openai";
import fs, { write } from "fs";
import config from "../config.js";
import { chunkArray, readFile, shuffle, writeFile } from "../helpers.js";
import { sleepSecs } from "twitter-api-v2/dist/v1/media-helpers.v1.js";

const configuration = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(configuration);

export const runTopicClassification = async (doc) => {
  let completion;
  try {
    completion = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: generateClassificationPrompt(doc),
      temperature: 0.6,
      max_tokens: 50,
    });
  } catch (e) {
    console.log(e);
    return;
  }

  return completion.data.choices;
};

export const runFineTunedTopicClassification = async (
  doc,
  model = "davinci:ft-personal-2022-08-21-13-54-08"
) => {
  const completion = await openai.createCompletion({
    model,
    prompt: doc,
    temperature: 0.2,
    max_tokens: 30,
  });

  return completion.data.choices;
};

const generateClassificationPrompt = (doc) => {
  return `What are 1-3 topics for the following tweet:

Tweet: Already feeling the weight of the week? Here's what I do when I'm already feeling overwhelmed by the week ahead. 2 steps you can do right now to banish the Sunday Scaries, be fully present, and enjoy your day. #ship30for30 #selfcare #worklifebalance
Topics: - Improving you mental health\n- work life balance\n- self care
Tweet: Measuring user retention has been called as the single most important metric for Product Market Fit. But how do you start measuring it? Where do you start? Here's a 5 min primer.
Topics: - measuring user retention\n- product management\n- product market fit metrics 
Tweet: I've spent 20+ years working for top companies in the world of finance. Along the way, I've made nearly every mistake in the book. nSome cost me thousands and maybe even millions of dollars. If I could speak to my 22-year-old self, here's the advice I'd give.
Topics: - financial career advice\n- advice to younger self\n- how to avoid finance mistakes
Tweet: We live in the age of binge-reading. People listen to podcasts, articles, and audiobooks at 3x speed. But this speed consumption strategy is based on a flawed model of learning. Turns out, there's a more effective way to learn. 🧵",
Topics: - learning\n- how to learn from podcasts articles and audiobooks\n- speed reading\n- productivity
Tweet: Cognitive biases that make people buy, marketing trends, and predictions to watch out, one-person 8 figure growth marketing lessons. Here are the 9 best marketing tweets &amp; threads you might have missed last week:",
Topics: - cognitive bias\n- marketing\n- entrepreneurship\n- growth marketing lessons
Tweet: ${doc}
Topics:

`;
};

/**
 * 1.) Read tweets from file
 * 2.) Call open ai to classify the tweets
 * 3.) Store tweets in finetuning dataset
 */
export const generateFinetuningTopicsDataset = async (
  fromFolder,
  fromFile,
  limit = -1,
  forceFetch = false
) => {
  // don't fetch if we have data already
  if (!forceFetch && fs.existsSync(fromFolder + "/" + fromFile)) {
    console.log("not fetching new data, use forceFetch to override");
    return;
  }

  let tweets = readFile(fromFolder, fromFile);

  // shuffle so we get a mix of tweets
  tweets = shuffle(tweets);

  let results = [];
  for (let tweet of tweets) {
    if (limit > 0) {
      limit -= 1;
    }
    const topics = await runTopicClassification(tweet.text);
    results.push({
      prompt: tweet.text,
      completion: " " + topics.pop()?.text,
    });

    if (limit === 0) {
      break;
    }
  }

  // scratch file for storage
  writeFile(
    "./scratch/topic-classification",
    "finetuning-topics.json",
    results
  );
};

// After you’ve fine-tuned a model, remember that your prompt has to end with the indicator string `\n\n###\n\n` for the model to start generating completions, rather than continuing with the prompt. Make sure to include `stop=[" undefined"]` so that the generated texts ends at the expected place.
// Once your model starts training, it'll approximately take 4.73 minutes to train a `curie` model, and less for `ada` and `babbage`. Queue will approximately take half an hour per job ahead of you.

export const getTopicPhrasesFromTweets = async (fromFolder, fromFile) => {
  console.log(config.openai);
  let tweets = readFile(fromFolder, fromFile);
  const alreadyClassified = readFile(
    "./scratch/topic-classification",
    "./tweetsWithTopicPhrases.json"
  );

  tweets = tweets.filter((t) => {
    return !alreadyClassified.find((ac) => {
      return ac.tweet.tweetId === t.tweetId;
    });
  });

  let results = [];

  const processTweet = async (tweet) => {
    const topics = await runTopicClassification(tweet.text);
    results.push({
      tweet,
      topics,
    });
  };

  for (let tweet of tweets) {
    try {
      await processTweet(tweet);
    } catch (e) {
      console.error("error processing tweet", e);
    }
    await sleepSecs(1);
  }

  writeFile(
    "./scratch/topic-classification",
    "tweetsWithTopicPhrases2.json",
    results
  );
};
