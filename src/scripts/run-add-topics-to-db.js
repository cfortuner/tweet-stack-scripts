/**
 * The script used to add topics to db, for reference
 */
// --------------------
// 4) ADD Topics to db
// --------------------

// const final = readFile("./", "final.json");

// const chunks = chunkArray(tweetsAndTopics, 20);

// const addTopicsAndPhrases = async (tweetAndTopic) => {
//   const { tweet, topics } = tweetAndTopic;
//   let lastKWP = "";

//   const phraseIds = [];

//   try {
//     // add topics and phrases
//     for (let topic of topics) {
//       let topicPriorities = [];
//       let topicIds = [];
//       for (let keywordPriority of topic.keywords) {
//         lastKWP = keywordPriority;
//         const [keyword, priority] = keywordPriority;
//         const topicDoc = await addTopic({
//           name: keyword,
//         });
//         topicIds.push(topicDoc.id);
//         topicPriorities.push({
//           topicId: topicDoc.id,
//           priority,
//         });
//       }

//       const phraseDoc = await addPhrase({
//         value: topic.phrase,
//         topicIds,
//         topicPriorities,
//       });

//       phraseIds.push(phraseDoc.id);
//     }

//     updateTweet(tweet.tweetId, {
//       phraseIds,
//       topicIds: firestore.FieldValue.delete(),
//     });
//   } catch (e) {
//     console.error(e, lastKWP);
//     throw e;
//   }
// };

// // keep track of failured chunks
// let failures = [];

// while (chunks.length) {
//   const chunk = chunks.pop();

//   try {
//     await Promise.all(chunk.map((data) => addTopicsAndPhrases(data)));

//     await sleepSecs(1);
//   } catch (e) {
//     failures = failures.concat(chunk);
//   }
// }

// writeFile("./", "failures.json", failures);
