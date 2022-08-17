import { TwitterApi } from "twitter-api-v2";
import { config } from "./config.js";
import { chunkArray, sleepSecs } from "./helpers.js";

// API Client docs -> https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/v2.md#Followings
export const twitterClient = new TwitterApi(config.twitter.bearerToken);

// Common Fields
// "media.fields":
//   "duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width,alt_text",
// "place.fields":
//   "contained_within,country,country_code,full_name,geo,id,name,place_type",
// "user.fields":
//   "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
// "tweet.fields":
//   "attachments,author_id,context_annotations,conversation_id,created_at,entities,geo,id,in_reply_to_user_id,lang,non_public_metrics,public_metrics,organic_metrics,promoted_metrics,possibly_sensitive,referenced_tweets,reply_settings,source,text,withheld",

export const getUserByUsername = async (username) => {
  return await twitterClient.v2.userByUsername(username, {
    expansions: "pinned_tweet_id",
    "user.fields":
      "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
    "tweet.fields":
      "author_id,created_at,context_annotations,public_metrics,text,source,conversation_id,attachments,in_reply_to_user_id,lang,entities,geo,id,referenced_tweets",
  });
};

export const getFollowing = async (userId) => {
  const following = await twitterClient.v2.following(userId, {
    asPaginator: true,
    max_results: 100,
    expansions: "pinned_tweet_id",
    "user.fields":
      "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
  });

  let userIds = [];
  for await (const user of following) {
    userIds.push(user.id);
  }
  return userIds;
};

/**
 * Fetches users, in batches of 100 users at a time.
 *
 * WARNING: Does not handle rate limiting
 */
export const getUsers = async (userIds) => {
  let results = [];
  const batches = chunkArray(userIds, 100);
  let batch;
  while (!!(batch = batches.pop())) {
    const res = await twitterClient.v2.users(batch, {
      expansions: "pinned_tweet_id",
      "user.fields":
        "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
      "tweet.fields":
        "author_id,created_at,context_annotations,public_metrics,text,source,conversation_id,attachments,in_reply_to_user_id,lang,entities,geo,id,referenced_tweets",
    });

    results = results.concat(res.data || []);
  }

  return results;
};

export const getCreatorListByName = async (userId, listName) => {
  const lists = await twitterClient.v2.listsOwned(userId);
  for await (const list of lists) {
    if (list.name === listName) {
      return list;
    }
  }
};

export const getListMembers = async (listId, options) => {
  const listMembers = await twitterClient.v2.listMembers(
    listId,
    {
      "user.fields":
        "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
      "tweet.fields": "author_id,text,created_at",
      expansions: ["pinned_tweet_id"],
      max_results: 100,
    },
    options
  );
  let results = [];
  for await (const member of listMembers) {
    results.push(member);
  }
  return results;
};

/**
 * Fetch tweets for a user starting at sinceTweetId
 *
 * WARNING: excludes retweets and replies
 */
export const fetchTweetsInTimeline = async (userId, sinceTweetId) => {
  try {
    let tweets = await twitterClient.v2.userTimeline(userId, {
      exclude: ["retweets", "replies"],
      expansions: [
        "attachments.poll_ids",
        "attachments.media_keys",
        "author_id",
        "referenced_tweets.id",
        "in_reply_to_user_id",
        "geo.place_id",
        "entities.mentions.username",
        "referenced_tweets.id.author_id",
      ],
      "tweet.fields":
        "attachments,author_id,context_annotations,conversation_id,created_at,entities,geo,id,in_reply_to_user_id,lang,public_metrics,possibly_sensitive,referenced_tweets,reply_settings,source,text,withheld",
      "media.fields":
        "duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics,alt_text,variants",
      "place.fields":
        "contained_within,country,country_code,full_name,geo,id,name,place_type",
      max_results: 100,
      // use this when updating with latest tweets
      since_id: sinceTweetId,
    });

    const start = Date.now();

    let latestTweet;
    let data = [];

    while (true) {
      // store the tweets
      for (let tweet of tweets) {
        data.push(tweet);
        if (!latestTweet) {
          latestTweet = tweet;
        }
      }

      // no more pages
      if (tweets.done) {
        break;
      }

      // rate limit is 100 req in 60 seconds so ~.6 per second + buffer
      await sleepSecs(0.5);

      // req next page
      tweets = await tweets.next();
    }

    console.log(
      `Fetched ${data.length} tweets in`,
      (Date.now() - start) / 1000,
      "seconds"
    );

    return {
      tweets: data,
      latestTweetId: latestTweet?.id,
    };
  } catch (e) {
    console.error(e);
    console.debug("skipping user tweets");

    // don't return tweets since the req failed.
    return {
      tweets: [],
      latestTweetId: sinceTweetId,
    };
  }
};
