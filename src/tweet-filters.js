export const filterFirstTweetsInConv = (tweets) => {
  return tweets.filter((t) => t.isFirstTweet);
};

export const textIncludesString = (text, str) => {
  const regex = new RegExp(`((\\W)|^)${str}((\\W)|$)`, "g");
  return regex.test(text);
};

export const textIncludesNumber = (text) => {
  return /\d/.test(text);
};

export const normalizeText = (text) => {
  return text
    .trim()
    .toLowerCase()
    .replaceAll(/\n/g, " ")
    .replaceAll(/\s+/g, " ");
};

export const replaceNumbersWithSymbol = (text, symbol) => {
  return text.replaceAll(/\d/g, symbol);
};
