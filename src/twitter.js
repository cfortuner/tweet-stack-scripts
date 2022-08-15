import { TwitterApi } from "twitter-api-v2";
import { config } from "./config.js";
import { chunkArray } from "./helpers.js";

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

/**
 * Fetches users, in batches of 100 users at a time.
 *
 * WARNING: Does not handle rate limiting
 */
export const getUsers = async (userIds) => {
  const results = [];
  const batches = chunkArray(userIds, 1);
  let batch;
  while (!!(batch = batches.pop())) {
    const res = await twitterClient.v2.users(batch, {
      expansions: "pinned_tweet_id",
      "user.fields":
        "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
      "tweet.fields":
        "author_id,created_at,context_annotations,public_metrics,text,source,conversation_id,attachments,in_reply_to_user_id,lang,entities,geo,id,referenced_tweets",
    });

    results.push(res);
  }

  if (results.length < 2) {
    return results;
  }

  // join results
  return results.reduce(
    (prev, curr) => {
      return {
        data: prev.data.concat(curr.data),
        errors: prev.errors.concat(curr.errors || []),
        includes: {
          media: prev.includes.media.concat(curr.includes?.media || []),
          places: prev.includes?.places.concat(curr.includes?.places || []),
          polls: prev.includes?.polls.concat(curr.includes?.polls || []),
          tweets: prev.includes?.tweets.concat(curr.includes?.tweets || []),
          users: prev.includes?.users.concat(curr.includes?.users || []),
        },
      };
    },
    {
      data: [],
      errors: [],
      includes: {
        media: [],
        places: [],
        polls: [],
        tweets: [],
        users: [],
      },
    }
  );
};

/** Warning, no pagination yet */
// TODO: add pagination
export const getCreatorListByName = async (userId, listName) => {
  const lists = await twitterClient.v2.listsOwned(userId);
  return lists.data.data.find((l) => l.name === listName);
};

export const getListMembers = async (listId, options) => {
  const listMembers = await twitterClient.v2.listMembers(listId, {
    "user.fields":
      "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
    "tweet.fields": "author_id,text,created_at",
    expansions: ["pinned_tweet_id"],
  });
  let creatorUsers = [];
  let done = false;
  while (!done) {
    for await (const member of listMembers) {
      creatorUsers.push(member);
    }
    done = listMembers.done;
  }
  return creatorUsers;
};

/**
 * Fetch 100 tweets for a user starting at sinceTweetId
 *
 * WARNING: excludes retweets and replies
 */
export const fetchTweets = async (userId, sinceTweetId) => {
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

  let latestTweet;
  let data = [];
  for await (let tweet of tweets) {
    data.push(tweet);
    if (!latestTweet) {
      latestTweet = tweet;
    }
  }

  return {
    tweets: data,
    latestTweetId: latestTweet?.id,
  };
};
