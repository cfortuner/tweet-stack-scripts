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
 * - need to sa
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
console.log(creatorUsers);

// test tweet fetching with with useTweetStack's tweets
// Fetch user and their pinned tweet
const tweetStackUser = await getUserByUsername("useTweetStack");
const userIdsToFetch = [tweetStackUser];
// console.log(tweetStackUser.data);
// console.log(tweetStackUser.data.entities);
// console.log(tweetStackUser.includes?.tweets);
// console.log(tweetStackUser.includes?.tweets?.[0]?.context_annotations);
