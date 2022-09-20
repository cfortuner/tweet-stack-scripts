import { Configuration, OpenAIApi } from "openai";
import { db } from "../../db/firebase.js";
import config from "../../config.js";
import { sleepSecs, readFile, writeFile } from "../../helpers.js";

const configuration = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(configuration);

export const submit = async (
  prompt,
  topP = 1,
  model = undefined,
  temperature = 1,
  max_tokens = 1800
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
      best_of: 5,
      n: 5,
    });
  } catch (e) {
    console.log(e);
    return;
  }

  return completion.data.choices;
};

export const writeSummaries = async () => {
  const data = await readFile(".", "cleaned.json");

  console.log(data.cleaned);

  // build each chapter's subtitles

  const chapterSubtitles = data.cleaned.chapterSubtitles.map((cs) => {
    return {
      title: cs.title,
      subtitles: cs.subtitles.reduce((acc, st) => {
        return acc + " " + st.text;
      }, ""),
    };
  });

  const results = [];
  try {
    for (const chapter of chapterSubtitles) {
      console.log("gpt for chapter", chapter.title);

      const subs = chapter.subtitles.trim();
      const maxSubs = subs.split(" ").slice(0, 200).join(" ");

      const prompt = `Write a series of 6 tweets that summarize this podcast ${data.title}:\nTranscript: ${maxSubs}\n`;
      const choices = await submit(prompt);

      await sleepSecs(120);

      const cleanChoices = choices.map((c) => {
        return c.text.trim().replace(/\n+/g, "/n");
      });

      results.push({ ...chapter, choices: cleanChoices });
    }
  } catch (e) {}

  writeFile(".", "res", results);
};

export const runPodcastTest = async () => {
  // now that i have the summaries, let's fill in the details

  const data = await readFile(".", "summaries.json");

  const { title, subtitles, choices } = data[0];

  console.log("filling out details for: ", title);

  const choice = choices[0];

  const prompt = `
  `;
  await submit(prompt);

  writeFile(".", "details");
};
