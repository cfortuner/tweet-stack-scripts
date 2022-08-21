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


# ----- BERTopic -----
# Fetch tweets from file
# f = open("./allTopics.json")
# topics = json.load(f)
# f.close()
# topic_model = BERTopic(n_gram_range=(1, 2))
# topics, probs = topic_model.fit_transform(topics)
# topic_labels = topic_model.generate_topic_labels(
#     nr_words=1, topic_prefix=False, separator=" ")

# res = []
# for label in topic_labels:
#     cleaned = label.split(' ')
#     ans = []
#     prev = ""
#     for clean in cleaned:
#         if clean == prev:
#             continue
#         ans.append(clean)
#         prev = clean
#     res.append(" ".join(ans))


# with open("./allTopicLabels.json", "w+") as outfile:
#     outfile.write(json.dumps(list(set(res)), indent=4))

# --- KeyBERT ---
# Fetch tweets from file
f = open("./allTopicLabels.json")
labels = json.load(f)
f.close()
f2 = open("./tweetsWithTopics.json")
tweetsWithTopics = json.load(f2)
f2.close()

kw_model = KeyBERT()

res = []
for tweet in tweetsWithTopics:
    keywords = kw_model.extract_keywords(
        tweet['topics'], keyphrase_ngram_range=(1, 3), seed_keywords=labels)
    res.append({
        "tweet": tweet['tweet'],
        "topics": {
            'phrases': tweet['topics'],
            'keywords': keywords
        }
    })

with open("./allTweetsWithTopicsAndKeywords.json", "w+") as outfile:
    outfile.write(json.dumps(res, indent=4))
