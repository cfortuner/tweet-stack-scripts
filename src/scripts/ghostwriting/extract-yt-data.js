import { db, firestore } from "./db/firebase.js";
import { downloadTransformedTweets } from "./scripts/download-transformed-tweets.js";
import fetchTwitterData from "./scripts/fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./scripts/twitter-ETL.js";
import { findEduContent } from "./scripts/filter-tweets-for-edu-content.js";
import {
  generateFinetuningTopicsDataset,
  getTopicPhrasesFromTweets,
  runFineTunedTopicClassification,
  runTopicClassification,
} from "./topic-classification/topic-classification.js";
import { chunkArray, readFile, writeFile } from "./helpers.js";
import {
  addPhrase,
  addTopic,
  getConversation,
  getEntireThreadText,
  getPhraseById,
  getPhrasesByIds,
  getTopicsByIds,
  getTweetById,
  getUserByTwitterUserId,
  updateIndex,
  updateTweet,
  updateUser,
} from "./db/app.js";
import { sleepSecs } from "twitter-api-v2/dist/v1/media-helpers.v1.js";
import {
  mostViralTweetsDataset,
  runGhostwritingTest,
} from "./scripts/ghostwriting/initial-test.js";
import fs from "fs";
import fetch from "node-fetch";
import convert from "xml-js";

const j = readFile(".", "data.json");

const captions = j.automatic_captions["en"];
const ttlm = captions.filter((c) => c.ext === "ttml").pop();
const response = await fetch(ttlm.url);
const data = await response.text();

var result = convert.xml2json(data, { compact: true, spaces: 4 });
const json = JSON.parse(result);
const subtitlesJson = json.tt.body.div.p;

const chapters = j.chapters;

const toHHMMSS = (t) => {
  var sec_num = parseInt(t, 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - hours * 3600) / 60);
  var seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return hours + ":" + minutes + ":" + seconds + ".00";
};

const chaptersWithStartEnd = chapters.map((c) => {
  return {
    title: c.title,
    start: toHHMMSS(c.start_time),
    end: toHHMMSS(c.end_time),
  };
});

const allSubtitles = subtitlesJson.map((l) => {
  return {
    begin: l._attributes.begin,
    end: l._attributes.end,
    text: l._text,
  };
});

const chapterSubtitles = chaptersWithStartEnd.map((chapter) => {
  return {
    ...chapter,
    subtitles: allSubtitles.filter((sub) => {
      return chapter.start <= sub.begin && chapter.end >= sub.end;
    }),
  };
});
writeFile(".", "cleaned.json", {
  ...j,
  cleaned: {
    allSubtitles,
    chapterSubtitles,
  },
});
