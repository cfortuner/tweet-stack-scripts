import { Configuration, OpenAIApi } from "openai";
import config from "../config.js";

const configuration = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(configuration);

export const runTopicClassification = async (doc) => {
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
