// Okay, for each tweet, get userId by "authorId" === "twitterUserId"
// then update tweet "authorId" to be "userId"

const tweets = await db.collection("tweets").listDocuments();

const chunks = chunkArray(tweets, 250);

const fn = async (tweetRef) => {
  const tweetDoc = await tweetRef.get();
  const data = tweetDoc.data();

  const ss = await db
    .collection("users")
    .where("twitterUserId", "==", data.authorId)
    .get();
  if (ss.length > 0) {
    console.error(tweetDoc, data.authorId);
    throw "more than one user with same twitter id";
  }
  const userDoc = ss.docs.pop();
  await updateTweet(tweetDoc.id, {
    userId: userDoc.id,
    twitterUserId: data.authorId,
  });
};

const failures = [];
for (const chunk of chunks) {
  try {
    await Promise.all(chunk.map((tweetDoc) => fn(tweetDoc)));
  } catch (e) {
    failures.push(chunk);
    console.error(e);
  }
  await sleepSecs(0.5);
}

if (failures.length) {
  writeFile("./", "failures.json", failures);
}
