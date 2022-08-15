import {
  fetchTweets,
  getCreatorListByName,
  getListMembers,
  getUserByUsername,
  getUsers,
} from "./twitter.js";
import { getLatestTweetId, updateTweets, updateUser } from "./db/twitter.js";

/**
 * Notes:
 * - need to Handle Rate Limits
 */

// get colin's creator list
const colinUser = await getUserByUsername("colinfortuner");
const creatorList = await getCreatorListByName(colinUser.data.id, "creators");
if (!creatorList) {
  process.exit(0);
}

// get list members
const listMembers = await getListMembers(creatorList.id);
const creatorUsers = await getUsers(listMembers.map((lm) => lm.id).slice(0, 2));

// test tweet fetching with with useTweetStack's tweets
// Fetch user and their pinned tweet
const tweetStackUser = await getUserByUsername("useTweetStack");

// Fetch all tweets for a creator using their timeline
/**
 * 0. Fetch latestTweetId from firebase
 * 1. fetch tweets from timeline
 * 2. record latest tweet id as last_tweet_id
 */
const prevLatestTweetId = await getLatestTweetId(tweetStackUser.data.id, true);
const { tweets, latestTweetId } = await fetchTweets(
  tweetStackUser.data.id,
  prevLatestTweetId
);

// Save data in firebase
await updateUser(tweetStackUser, true);
await updateTweets(tweetStackUser.data.id, tweets, latestTweetId, true);
