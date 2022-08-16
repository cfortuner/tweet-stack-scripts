# foundation

## DB Schema

_dataSources_

```
dataSources
    twitter
       users
         userId
           ...data
           last tweet received
           tweets
             tweetId
               ...data
```

_users_

```
users
    user
        twitterId
        bio
        name
        topicIds
```

_tweets_

```
tweets
    tweet
        authorId
        tweetId
        isThread
        isFirstTweet
        topic_ids
        topic_priorities
```

_topics_

```
topics
    topic
        name
        created_at
```

_playlists_

```
playlists
    playlist
        authorIds
        tweetId
        creatorId
        topicIds
        description
        name
```

## Accessing DataSources

```
db.collection('dataSources').doc('twitter').collection('users')
db.collection('dataSources').doc('twitter').collection('users').doc(userId).collection(tweets).document(tweetId)
```
