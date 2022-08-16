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
