
// remove phrases

// const ss = await db.collection("phrases").where("", "==", []).get();
// for (const doc of ss.docs) {
//   const tweetsIncludingPhrase = await db
//     .collection("tweets")
//     .where("phraseIds", "array-contains", doc.id)
//     .get();

//   for (const tweet of tweetsIncludingPhrase.docs) {
//     const newTweetPhraseIds = tweet.phraseIds.filter((pid) => pid !== doc.id);
//     await updateTweet(tweet.id, { phraseIds: newTweetPhraseIds });
//   }

//   // move to new collection
//   await db.collection("phrases-deleted").doc(doc.id).set(doc.data());

//   // delete phrase
//   await db.collection("phrases").doc(doc.id).delete();
// }
