import { Configuration, OpenAIApi } from "openai";
import { db } from "../../db/firebase.js";
import config from "../../config.js";
import { sleepSecs, readFile, writeFile, chunkArray } from "../../helpers.js";

import { encode, decode } from "gpt-3-encoder";

const countTokens = (prompt) => {
  return encode(prompt).length;
};

const splitParts = (content, maxTokens) => {
  const encoded = encode(content);
  if (encoded < maxTokens) {
    return encoded;
  }

  const chunks = chunkArray(encoded, maxTokens);

  return chunks.map((chunk) => decode(chunk));
};

// @colin add context to each prompt, run them multiple times until you reach a token goal.

const prompts = [
  {
    name: "transcript to summary",
    prompt: (chapter, transcript, last) =>
      `Transcript:${transcript}\nA list of paragraphs based on each topic in the transcript:`,
    type: "summary",
    times: 2,
  },
];

const utilityPrompts = {
  clean: {
    firstPerson: (content, name) =>
      `${content}\nNow rewrite those sentences and replace I with ${name}\n`,
  },
  summaries: {
    hooksToSentences: (content) =>
      `${content}\nNow convert that into a series of sentences:\nSentence 1:`,
  },
  hooks: {
    whyReadThis: (content) =>
      `${content}\nWho is this content for and why will it help them?\n`,
    invokeEmotion: (content) =>
      `${content}\nNow invoke emotion in the reader by comparing it to something they have done:\n`,
  },
};

const configuration = new Configuration({
  apiKey: config.openai.apiKey,
});
const openai = new OpenAIApi(configuration);

export const submit = async (prompt, max_tokens = 300) => {
  let completion;
  try {
    completion = await openai.createCompletion({
      model: "text-davinci-002",
      prompt,
      temperature: 1,
      frequency_penalty: 1,
      presence_penalty: 1,
      max_tokens,
      top_p: 1,
      best_of: 1,
      n: 1,
    });
  } catch (e) {
    console.log(e);
    return;
  }

  return completion.data.choices[0];
};

const runTranscriptPipeline = async (chapter, transcript) => {
  let content = transcript;
  let last = "";
  let output = "";
  for (const prompt of prompts) {
    let i = 0;
    const p = prompt.prompt(chapter, content, last);
    let r = await submit(p, 1000);
    output += " " + r.text;

    await sleepSecs(2);
  }

  return output;
};

const getChaptersFromTranscript = (data) => {
  // build each chapter's subtitles
  const chapterSubtitles = data.cleaned.chapterSubtitles.reduce((acc, cs) => {
    const transcript = cs.subtitles
      .reduce((acc, st) => {
        return acc + " " + st.text;
      }, "")
      .trim();

    let sections = splitParts(transcript, 3000);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      // too many tokens so break this in half
      acc.push({
        title: cs.title,
        section,
        part: i + 1,
      });
    }

    return acc;
  }, []);

  return chapterSubtitles;
};

export const runPodcastToThread = async (data, outputFolder) => {
  // chapters: { title, part }[]
  const chapters = getChaptersFromTranscript(data);

  let results = [];
  for (const { title, part, section } of chapters) {
    let output = await runTranscriptPipeline(title, section);

    // make sure it's told in first person about alex
    // output = utilityPrompts.clean.firstPerson(output, "Alex");

    // const emotionalHook = await submit(
    //   utilityPrompts.hooks.invokeEmotion(output)
    // );
    // const whyReadThisHook = await submit(
    //   utilityPrompts.hooks.whyReadThis(output)
    // );
    // const sentenceSummary = await submit(
    //   utilityPrompts.summaries.hooksToSentences(output)
    // );

    results.push({
      title,
      part,
      output,
      // emotionalHook: emotionalHook.text,
      // whyReadThisHook: whyReadThisHook.text,
      // sentenceSummary: sentenceSummary.text,
    });

    await sleepSecs(2);
  }

  try {
    writeFile(`./${outputFolder}`, "podcastToThread.json", results);
  } catch (e) {}

  return await cleanResults(results);
};

export const cleanResults = async (results) => {
  const combined = results.reduce((acc, r, i) => {
    if (r.part > 1) {
      acc[acc.length - 1].output += " " + r.output;
    } else {
      acc.push(r);
    }
    return acc;
  }, []);

  await sleepSecs(2);

  try {
    writeFile(`./${outputFolder}`, "podcastToThreadClean.json", combined);
  } catch (e) {}

  return combined;
};

export const addStyles = async () => {
  const combined = readFile(".", "combined-results.json");

  const res = [];
  for (const { title, output: content } of combined) {
    const why = `${content}\nWho is this content for and why will it help them?\n`;
    const emotion = `${content}\nNow invoke emotion in the reader by comparing it to something they have done:\n`;
    const funny = `${content}\nRewrite the content to be really funny and relatable but be nice:\n`;
    const curse = `${content}\nRewrite the content with a lot of curse words:\n`;
    const contrarian = `${content}\nRewrite the content and come up with a contrarian idea that it represents:\n`;
    const attentionGrabbing = `${content}\nRewrite the content and make it attention grabbing:\n`;

    const styles = {
      why,
      emotion,
      funny,
      curse,
      contrarian,
      attentionGrabbing,
    };

    let chapter = {
      title,
      output: content,
      styles: {},
    };

    for (const [style, prompt] of Object.entries(styles)) {
      const r = await submit(prompt);
      await sleepSecs(1);
      chapter.styles[style] = {
        style,
        prompt,
        output: r.text,
      };
    }

    res.push(chapter);
  }

  writeFile(".", "final.json", res);
};
