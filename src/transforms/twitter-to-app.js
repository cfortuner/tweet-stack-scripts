export const transformTwitterUserToUser = (twitterUser) => {
  return {
    twitterUserId: twitterUser.id,
    twitterUsername: twitterUser.username,
    description: twitterUser.description,
    name: twitterUser.name,
    publicMetrics: twitterUser.public_metrics,
  };
};

export const transformTwitterTweetToTweet = (
  twitterTweet,
  isFirstTweet,
  isThread
) => {
  return {
    twitterUserId: twitterTweet.author_id,
    tweetId: twitterTweet.id,
    text: twitterTweet.text,
    publicMetrics: twitterTweet.public_metrics,
    isFirstTweet,
    isThread,
  };
};
