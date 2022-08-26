# foundation

## setup

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

## Updating the index

If you reconfigure the indexed fields, you need to run this ->

#### Thread Index

https://console.firebase.google.com/u/2/project/tweetstack-29218/extensions/instances/firestore-algolia-search-g20h?tab=usage

```
npx firestore-algolia-search
```

then fill in:

```
What is the Region? us-east4
What is the Project Id? tweetstack-29218
What is the Algolia App Id? 617CKR15Z7
What is the Algolia Api Key? { unspecified parameter }
What is the Algolia Index Name? threads-index
What is the Collection Path? threads-index
What are the Fields to extract? twitterUsername,twitterName,username,userDescription,followersCount,text,likeCount,retweetCount,quoteCount,phrases,topics
What is the Transform Function? { unspecified parameter }
What is the path to the Google Application Credential File? </path/to/service/account/key>
```

Index contains:

    twitterUsername,twitterName,username,userDescription,followersCount,text,likeCount,retweetCount,quoteCount,phrases,topics

NOT INDEXED but included

- tweetId
- userId
- twitterUserId
- conversationIds
- topicIds
- phraseIds
