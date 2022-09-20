import { readFile, writeFile } from "../../helpers.js";

import fetch from "node-fetch";
import convert from "xml-js";

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

export const cleanYTData = async (file, outputFolder) => {
  const j = readFile(".", file);

  const captions = j.automatic_captions["en"];
  const ttlm = captions.filter((c) => c.ext === "ttml").pop();
  const response = await fetch(ttlm.url);
  const data = await response.text();

  var result = convert.xml2json(data, { compact: true, spaces: 4 });
  const json = JSON.parse(result);
  const subtitlesJson = json.tt.body.div.p;

  const chapters = j.chapters;

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
  const output = {
    ...j,
    cleaned: {
      allSubtitles,
      chapterSubtitles,
    },
  };

  delete output["formats"];
  delete output["requested_subtitles"];
  delete output["requested_formats"];
  delete output["subtitles"];
  delete output["automatic_captions"];

  writeFile(`./${outputFolder}`, "cleaned.json", output);

  return output;
};
