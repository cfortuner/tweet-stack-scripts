"""
1. download edu post tweets
2. grab text data
3. for each text, run bert
4. store topics with tweets
"""


from asyncore import write
from sklearn.feature_extraction.text import CountVectorizer
from keyphrase_vectorizers import KeyphraseCountVectorizer
from random import seed
from sklearn.datasets import fetch_20newsgroups
from bertopic import BERTopic
from keybert import KeyBERT
from keyphrase_vectorizers import KeyphraseCountVectorizer

import json
import pprint


pp = pprint.PrettyPrinter(indent=4)

# Fetch tweets from file
f = open("./scratch/topic-classification/openai.json")
tweetsWithTopics = json.load(f)
f.close()


# --- KeyBERT ---
vectorizer = KeyphraseCountVectorizer()
kw_model = KeyBERT()

res = []
for tweetWithTopic in tweetsWithTopics:
    # KeyBERT
    keywords = kw_model.extract_keywords(
        tweetWithTopic['topics'][0]['text'], vectorizer=vectorizer)
    print(tweetWithTopic['topics'][0]['text'])
    print(keywords)
    res.append({
        "tweet": tweetWithTopic["tweet"],
        "topics": tweetWithTopic["topics"],
        "keywords": keywords
    })

with open("./scratch/topic-extraction/keybert.json", "w+") as outfile:
    outfile.write(json.dumps(res, indent=4))

# ----- BERTopic -----
# topic_model = BERTopic(n_gram_range=(1, 2))
# topics, probs = topic_model.fit_transform(texts)
# # topic_labels = topic_model.generate_topic_labels(
# #     nr_words=1, topic_prefix=False, separator=" ")

# topic_docs = {topic: {
#     'topNLabels': topic_model.get_topic(topic),
#     'docs': []
# } for topic in set(topics)}

# for topic, doc in zip(topics, texts):
#     topic_docs[topic]['docs'].append(doc)

# json_object = json.dumps(topic_docs, indent=4)

# # Writing to sample.json
# with open("./scratch/keyword-extraction/topics.json", "w") as outfile:
#     outfile.write(json_object)


# # Mapping topics back to tweets
# tweetMap = {}
# for tweet in tweets:
#     tweetMap[tweet['text']] = tweet

# tweetsWithTopics = []

# # now for each topic, find tweet ids
# with open("./scratch/keyword-extraction/topics.json", "r") as outfile:
#     topic_docs = json.loads(outfile.read())
#     for topic in topic_docs.items():
#         topNLabels = topic[1]['topNLabels']
#         docs = topic[1]['docs']

#         for doc in docs:
#             tweetsWithTopics.append({
#                 'tweet': tweetMap[doc],
#                 'topics': topNLabels
#             })

# # store the file here
# with open("./scratch/keyword-extraction/tweetsWithTopics.json", "w") as outfile:
#     outfile.write(json.dumps(tweetsWithTopics, indent=4))
