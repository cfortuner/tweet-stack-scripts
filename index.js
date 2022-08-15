import { db } from "./firebase.js";
import { config } from "./config.js";
import {
  getCreatorListByName,
  getListMembers,
  getUserByUsername,
  getUsers,
  twitterClient,
} from "./twitter.js";

/**
 * Steps
 *
 * 1. Download colin's creator list including profile
 * 2. For each creator in the list
 *      fetch timeline
 *        first get last_tweet_received for user
 *        record last_tweet_received for timeline
 * 7.   update firebase with new data
 *        twitter
 *          users
 *            user_id
 *              profile_data...
 *              last tweet received
 *              tweets
 *
 * Notes:
 * - need to Handle Rate Limits
 * - need to include extensions + proper fields
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
// console.log(creatorUsers);

// test tweet fetching with with useTweetStack's tweets
// Fetch user and their pinned tweet
const tweetStackUser = await getUserByUsername("useTweetStack");
// console.log(tweetStackUser.data);
// console.log(tweetStackUser.data.entities);
// console.log(tweetStackUser.includes?.tweets);
// console.log(tweetStackUser.includes?.tweets?.[0]?.context_annotations);

// Fetch all tweets for a creator using their timeline
/**
 * 1. fetch tweets from timeline
 * 2. record latest tweet id as last_tweet_id
 */
const tweets = await twitterClient.v2.userTimeline(tweetStackUser.data.id, {
  exclude: ["retweets", "replies"],
  expansions:
    "attachments.poll_ids,attachments.media_keys,author_id,referenced_tweets.id,in_reply_to_user_id,geo.place_id,entities.mentions.username,referenced_tweets.id.author_id",
  "tweet.fields":
    "attachments,author_id,context_annotations,conversation_id,created_at,entities,geo,id,in_reply_to_user_id,lang,public_metrics,possibly_sensitive,referenced_tweets,reply_settings,source,text,withheld",
});
let latestTweet;
for (let tweet of tweets) {
  console.log(tweet);
  if (!latestTweet) {
    latestTweet = tweet;
  }
}
