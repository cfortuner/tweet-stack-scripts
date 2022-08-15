export const chunkArray = (arr, chunkSize) => {
  if (chunkSize <= 0) return [];

  let chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

export const sleepSec = async (sec) => {
  return new Promise((r) => setTimeout(r, 1000 * sec));
};
