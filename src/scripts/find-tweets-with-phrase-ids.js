let paginator = db
  .collection("tweets")
  .where("isThread", "==", true)
  .where("isFirstTweet", "==", true)
  .limit(5000);
let res = [];
while (true) {
  const docs = await paginator.get();

  const threadsWithoutPhraseIds = docs.docs
    .filter((doc) => {
      return !doc.data().phraseIds?.length;
    })
    .map((doc) => doc.data());
  res = res.concat(threadsWithoutPhraseIds);

  // last page
  if (docs.docs.length < 20) {
    break;
  }

  paginator = db
    .collection("tweets")
    .where("isThread", "==", true)
    .where("isFirstTweet", "==", true)
    .startAfter(docs.docs.pop())
    .limit(5000);
}
console.log(res.length);
writeFile("./", "threadWithoutPhrases.json", res);
