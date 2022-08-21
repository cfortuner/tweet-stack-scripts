import { Configuration, OpenAIApi } from "openai";
import fs from "fs";
import config from "../config.js";
import { readFile, shuffle, writeFile } from "../helpers.js";

const configuration = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(configuration);

const runTopicClassification = async (doc) => {
  const completion = await openai.createCompletion({
    model: "text-davinci-002",
    prompt: generateClassificationPrompt(doc),
    temperature: 0.6,
    max_tokens: 500,
  });

  return completion.data.choices;
};

const generateClassificationPrompt = (doc) => {
  return `Identify 1-3 topics for this text.

Text: Already feeling the weight of the week? Here's what I do when I'm already feeling overwhelmed by the week ahead. 2 steps you can do right now to banish the Sunday Scaries, be fully present, and enjoy your day. #ship30for30 #selfcare #worklifebalance
Topics: Improving you mental health, sunday scaries, work life balance
Text: Measuring user retention has been called as the single most important metric for Product Market Fit. But how do you start measuring it? Where do you start? Here's a 5 min primer.
Topics: measuring user retention, product management, product market fit metrics 
Text: I've spent 20+ years working for top companies in the world of finance. Along the way, I've made nearly every mistake in the book. nSome cost me thousands and maybe even millions of dollars. If I could speak to my 22-year-old self, here's the advice I'd give.
Topics: financial career advice, advice to younger self, how to avoid finance mistakes
Text: ${doc}
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
