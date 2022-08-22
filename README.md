# foundation

## setup

NOTE: pip install may fail on tokenizers. follow steps here to install https://huggingface.co/docs/tokenizers/installation

```
npm i
pip install -r requirements.txt
```

## Commands

Run index.js

```
npm run start
```

Prepare finetuning dataset

```
npm run finetuning:prepare
```

## Fine tuned model ids

8/21
trained on: file-crEG81FiJRyYyVk5WrT9LjF6
model: davinci:ft-personal-2022-08-21-13-54-08
resultfile: file-PnA3yRP1qTzPWZLS1I3ALkVV

## Notes

### DB Schema

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
        description
        name
        topicIds
        phraseIds
```

_tweets_

```
tweets
    tweet
        authorId
        tweetId
        isThread
        isFirstTweet
        phrase_ids
```

_topics_

```
topics
    topic
        name
        created_at
```

```
phrases
    phrase
        name
        topic_ids
        topic_priorities
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

## Updating the Indices

#### Users Index

https://console.firebase.google.com/u/2/project/tweetstack-29218/extensions/instances/firestore-algolia-search?tab=usage

User Fields

- twitterUserName
- name
- description
- topics
- phrases
- followersCount

NOT INDEXED

- userId
- twitterId
- topic_ids
- phrase_ids
- tweet_count

#### Threads Index

https://console.firebase.google.com/u/2/project/tweetstack-29218/extensions/instances/firestore-algolia-search-g20h?tab=usage

Thread Index contains:

- authorId
- authorTwitterUsername
- authorName
- topics
- phrases
- text (for all threads)
- likeCount
- reweetCount
- quoteCount

NOT INDEXED

- tweetType
- replyCount
- authorId
- authorTwitterId
- firstTweetId
- conversationIds
- topicIds
- phraseIds
