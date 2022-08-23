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
        twitterUsername
        twitterName
        name
        phraseIds
        indexRecordId
```

_tweets_

```
tweets
    tweet
        userId
        tweetType
        text
        publicMetrics
        tweetId
        isThread
        isFirstTweet
        phraseIds
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

NOTE: NOT USING THIS FOR NOW.

https://console.firebase.google.com/u/2/project/tweetstack-29218/extensions/instances/firestore-algolia-search?tab=usage

User Fields

- twitterUsername
- twitterName
- name
- description
- followersCount

NOT INDEXED

- userId
- twitterUserId
- tweetCount

#### Index

https://console.firebase.google.com/u/2/project/tweetstack-29218/extensions/instances/firestore-algolia-search-g20h?tab=usage

Index contains:

- twitterUsername
- twitterName
- username
- userDescription
- text (for all threads)
- likeCount
- retweetCount
- quoteCount
- phrases
- topics
- followersCount

NOT INDEXED

- tweetId
- tweetType
- replyCount
- userId
- twitterUserId
- conversationIds
- topicIds
- phraseIds

#### Topic Index

NOTE: Not using this for now

Phrase Index contains:

- phrase
- topics

NOT INDEXED

- phraseId
- topicPriorities
