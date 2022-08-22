import { db, firestore } from "./db/firebase.js";
import { downloadTransformedTweets } from "./scripts/download-transformed-tweets.js";
import fetchTwitterData from "./scripts/fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./scripts/twitter-ETL.js";
import { findEduContent } from "./scripts/filter-tweets-for-edu-content.js";
import {
  generateFinetuningTopicsDataset,
  getTopicPhrasesFromTweets,
  runFineTunedTopicClassification,
  runTopicClassification,
} from "./topic-classification/topic-classification.js";
import { chunkArray, readFile, writeFile } from "./helpers.js";
import {
  addPhrase,
  addTopic,
  getPhraseById,
  getPhrasesByIds,
  getTopicsByIds,
  updateTweet,
} from "./db/app.js";
import { sleepSecs } from "twitter-api-v2/dist/v1/media-helpers.v1.js";
import { updateUser } from "./db/twitter.js";

// --------------------
// 1) FETCH & TRANSFORM
// --------------------

// await fetchTwitterData();
// const userIds = await runUsersETL();
// await runTweetETL(userIds);

// --------------------
// 2) THREAD FILTERING
// --------------------

// await downloadTransformedTweets();
// findEduContent("scratch/downloadTransformedTweets");

// --------------------
// 3) TOPIC CLASSIFICATION
// --------------------

// TODO: Create a repeatable process for topic classification

// --------------------
// 4) ADD Topics to db
// --------------------

// TODO: create a repeatable process for adding topics to db

// --------------------
// 5) Build the Index Data in firebase
// --------------------

// Users
/**
 * get users in firebase
 * for each user,
 *    create userIndexRecord
 *    download the user document
 *    add to userIndexRecord
 *      twitterUsername, name, description, followersCount, userId (document id), twitterId, phrase_ids
 *    create phrase list
 *    create topic list
 *    create phraseIds list
 *    create topicIds list
 *    for each phrase in user phraseIds (in document)
 *      download the phrase document
 *      add to phrase list
 *      for each topic_id in phrase (in document)
 *        download the topic document
 *        add topicId to topicIds list
 *        add topic to topics list
 *    add phrase list to userIndexRecord
 *    add topic list to userIndexRecord
 *    add topicIds list to userIndexRecord
 *
 *    upload usersIndexRecord with all records
 *    get usersIndexRecord document id
 *    update userDoc with usersIndexRecord document id
 */

export const updateUsersIndex = async () => {
  const userDocRefs = await db.collection("users").listDocuments();
  for (const userDocRef of userDocRefs) {
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();
    let userIndexRecordId = userData.userIndexRecordId;
    const phraseIds = userData.phraseIds || [];

    // get Phrases
    const phraseDocs = await getPhrasesByIds(phraseIds);
    const phraseDatas = phraseDocs.map((phraseDoc) => phraseDoc.data());
    const phrases = phraseDatas.map((phraseData) => phraseData.value);

    // Update Topics and Topic Ids
    let topicIds = [];
    let topics = [];
    for (const phraseData of phraseDatas) {
      const topicDocs = await getTopicsByIds(phraseData.topicIds);
      topics = topics.concat(topicDocs.map((topicDoc) => topicDoc.data().name));
      topicIds = topicIds.concat(topicDocs.map((doc) => doc.id));
    }

    // Dedupe
    phrases = Array.from(new Set(phrases));
    topics = Array.from(new Set(topics));
    topicIds = Array.from(new Set(topicIds));

    // Create Record
    const userIndexRecord = {
      twitterUsername: userData.twitterUsername,
      name: userData.name,
      description: description,
      followersCount: userData.publicMetrics.followers_count,
      userId: userDoc.id,
      twitterId: userData.twitterId,
      phrases,
      topics,
      topicIds,
      phraseIds,
    };

    userIndexRecordId = await updateUserIndexRecord(
      userIndexRecordId,
      userIndexRecord
    );

    // store the index record id in the user doc for future use
    await updateUser(userDoc.id, { userIndexRecordId });
  }
};

/**
 * Update Threads index
 *
 * get tweets that are first tweet & thread in firebase
 * for each thread:
 *    create threadIndexRecord
 */
