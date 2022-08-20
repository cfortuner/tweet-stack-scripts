import { db } from "../db/firebase.js";
import { writeFile } from "../helpers.js";

export const downloadTransformedTweets = async () => {
  const batchSize = 250;
  let paginator = db.collection("tweets").limit(batchSize);

  let tweetData = [];

  const filenamePrefix = "transformedTweets_";

  let batchId = 0;
  while (true) {
    const refs = await paginator.get();

    let lastDoc;
    for (let doc of refs.docs) {
      lastDoc = doc;

      const data = doc.data();
      if (!data) {
        throw `Error no data for tweet ${doc.id}`;
      }
      tweetData.push(data);
    }

    // store in file
    writeFile("scratch/downloadTransformedTweets", batchId, tweetData);

    tweetData = [];

    // last doc
    if (refs.size < batchSize) {
      break;
    }

    // update the paginator
    paginator = db.collection("tweets").limit(batchSize).startAfter(lastDoc);

    batchId += 1;
  }
};
