import {
  fetchTweetsInTimeline,
  getCreatorListByName,
  getFollowing,
  getListMembers,
  getUserByUsername,
  getUsers,
} from "../twitter.js";
import { getLatestTweetId, updateTweets, updateUser } from "../db/twitter.js";

/**
 * A script to download users data and tweet timeline data
 *
 * Can fetch ~800 tweets for each user.
 *
 * Note: Keeps track of last fetched tweet and only fetches new tweets
 */

const fetchTwitterData = async () => {
  // get colin's creator list
  const tweetStackUser = await getUserByUsername("useTweetStack");
  const userIds = await getFollowing(tweetStackUser.data.id);

  // get users
  const users = await getUsers(userIds);

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
};

export default fetchTwitterData;
