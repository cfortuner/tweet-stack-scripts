"""
1. download edu post tweets
2. grab text data
3. for each text, run bert
4. store topics with tweets
"""


from random import seed
from sklearn.datasets import fetch_20newsgroups
from bertopic import BERTopic
from keybert import KeyBERT
import json
import pprint

# Opening JSON file
f = open("eduContent/all")

# returns JSON object as
# a dictionary
tweets = json.load(f)

# Iterating through the json


count = 0

results = []

kw_model = KeyBERT()

topic_model = BERTopic(n_gram_range=(1, 2))
texts = [tweet['text'] for tweet in tweets]
topics, probs = topic_model.fit_transform(texts)

hierarchical_topics = topic_model.hierarchical_topics(texts, topics)

# Generating label from topics
topic_labels = topic_model.generate_topic_labels(nr_words=2,
                                                 topic_prefix=False,
                                                 separator=" "
                                                 )
topic_model.set_topic_labels(topic_labels)


topic_data = {}
for topic in topic_labels:
    similar_topics, similarity = topic_model.find_topics(topic, top_n=3)
    topic_data[topic] = []
    for simtopic in similar_topics:
        topic_data[topic].append(topic_model.get_topic(simtopic))

pp = pprint.PrettyPrinter(indent=4)
pp.pprint(topic_data)

# fig = topic_model.visualize_topics()
# fig.write_html("topic_vis.html")
# figbar = topic_model.visualize_barchart()
# fighierarchy = topic_model.visualize_hierarchy(
#     hierarchical_topics=hierarchical_topics)
# fighierarchy.write_html("topic_vis_hierarchy.html")
# figbar = topic_model.visualize_barchart()
# figbar.write_html("topic_vis_bar.html")

# Closing file
f.close()
