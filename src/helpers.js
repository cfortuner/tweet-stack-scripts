import fs from "fs";

export const chunkArray = (arr, chunkSize) => {
  if (chunkSize <= 0) return [];

  let chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

export const sleepSecs = async (sec) => {
  return new Promise((r) => setImmediate(r, 1000 * sec));
};

export const writeFile = (folder, filename, data) => {
  try {
    fs.mkdirSync(folder);
  } catch (e) {}

  fs.writeFileSync(
    `./${folder}/${filename}`,
    JSON.stringify(data, undefined, 4),
    (err) => {
      if (err) console.log(err);
      console.log(`Successfully Written to File ${filename}`);
    }
  );
};

export const readFile = (folder, filename) => {
  const buf = fs.readFileSync(`./${folder}/${filename}`, "utf-8");
  return JSON.parse(buf);
};
