import {
  fetchTweetsInTimeline,
  getCreatorListByName,
  getListMembers,
  getUserByUsername,
  getUsers,
} from "./twitter.js";
import { getLatestTweetId, updateTweets, updateUser } from "./db/twitter.js";

/**
 * A script to download users data and tweet timeline data
 *
 * Supports downloading up to the last 800 tweets from a user
 */

// get colin's creator list
const colinUser = await getUserByUsername("colinfortuner");
const creatorList = await getCreatorListByName(colinUser.data.id, "creators");
if (!creatorList) {
  process.exit(0);
}

// get list members
const listMembers = await getListMembers(creatorList.id);

// get users
const users = await getUsers(listMembers.map((lm) => lm.id));

// Fetch all tweets for a user using their timeline
for (let user of users) {
  const prevLatestTweetId = await getLatestTweetId(user.id);

  // Use the previous 'latestTweetId' so we don't refetch old tweets (to avoid hitting the tweet cap)
  const { tweets, latestTweetId } = await fetchTweetsInTimeline(
    user.id,
    prevLatestTweetId
  );

  // Save data in firebase
  await updateUser(user);
  await updateTweets(user.id, tweets, latestTweetId);
}
