export const transformTwitterUserToUser = (twitterUser) => {
  return {
    twitterId: twitterUser.id,
    twitterUsername: twitterUser.username,
    description: twitterUser.description,
    name: twitterUser.name,
    publicMetrics: twitterUser.public_metrics,
    topicIds: [],
  };
};

export const transformTwitterTweetToTweet = (
  twitterTweet,
  isFirstTweet,
  isThread
) => {
  return {
    authorId: twitterTweet.author_id,
    tweetId: twitterTweet.id,
    text: twitterTweet.text,
    publicMetrics: twitterTweet.public_metrics,
    isFirstTweet,
    isThread,
    topicIds: [],
  };
};
