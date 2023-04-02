import json
import time
from pprint import pprint

import dateutil
from pyabsa import AspectTermExtraction as ATEPC, available_checkpoints, ModelSaveOption, DeviceTypeOption, \
    TaskCodeOption
import pandas as pd
import warnings
import nltk
import re
from nltk.tokenize import sent_tokenize, word_tokenize
from pyabsa import ABSAInstruction as absa_instruction
import os
# nltk.download('punkt')
warnings.filterwarnings("ignore")

def absa():
    aspect_extractor = ATEPC.AspectExtractor('checkpoints/checkpoint',
                                             auto_device=False,  # False means load model on CPU
                                             cal_perplexity=True)
    # instance inference
    res = aspect_extractor.predict(["We came here to celebrate our wedding anniversary, and it did not disappoint!",
                                    "Our table was available promptly at our 6p reservation. ",
                                    "Our waiter was very friendly and knowledgeable.",
                                    "And we had some of the best food we've ever had.",
                                    "It was just the two of us and we ordered 5 dishes.",
                                    "It's a tapas style restaurant, so we were excited to try many things on the menu.",
                                    "We had the Chickpea Fritters (reminded me of a yummy Indian chaat), Goat Empanadas, Salmon (was one our top 2 favs), Crispy Short Ribs (our other top 2 fav), and the Grilled Skirt Steak.",
                                    "Everything had so much flavor, and the price wasn't bad at about $130 total.",
                                    "We'll definitely be back soon!"],
                                   save_result=False,
                                   print_result=True,  # print the result
                                   ignore_error=True )
    print(res)


def absa_dataset():
    df = pd.read_csv('./data/restaurant_reviews.csv')
    txt = df.sample(frac=0.1)['review_text'].values.astype(str)
    pd.DataFrame(txt[:1000]).to_csv('./data/yelp_absa.csv', header=False, index = False)



def quad_extract(t, quadruple_extractor):
    ans = quadruple_extractor.predict(t)
    return ans['Quadruples']


def extract_tags(review, quadruple_extractor):
    txt = review['review_txt']
    quads = quad_extract(txt, quadruple_extractor)
    sentiments = []
    tag = []
    for i in quads:
        if 'FOOD' in i['category'] or 'DRINKS' in i['category']:
            tag.append(i['aspect'])
        sentiments.append('{}|{}|{}'.format(i['aspect'], i['polarity'], i['category']))
    review['sentiment'] = sentiments
    review['tag'] = tag

    return review


if __name__ == '__main__':
    #absa_dataset()
    #train_quad_extraction()
    #extract_tags()
    quadruple_extractor = absa_instruction.ABSAGenerator("multilingual")
    # with open('./data/review_sample.json', 'r') as fp_in:
    #     data = json.load(fp_in)
    # reviews = []
    # for review in data:
    #     reviews.append(extract_tags(review, quadruple_extractor))
    #
    # with open('./data/reviews.json', 'w') as fp:
    #     json.dump(reviews, fp)
    quad_extract('kids friendly', quadruple_extractor)
    # df = pd.read_csv('./data/restaurant_reviews.csv')
    # with open('reviews.json', 'w', encoding='utf-8') as fp:
    #     fp.write('[')
    #     for idx, row in df.iterrows():
    #         date = time.strptime(row['review_date'],'%m/%d/%Y')
    #         date_str = time.strftime('%Y-%m-%dT%H:%M:%S.0Z')
    #         print(idx, date_str)
    #         review = {
    #             'user_name': row['user_name'],
    #             'user_loc': row['user_origin'],
    #             'rating': row['rating'],
    #             'review_date': date_str,
    #             'review_txt': row['review_text'],
    #             'restaurant': row['restaurant_id'],
    #             'review_lang': row['language'],
    #         }
    #
    #         review = extract_tags(review, quadruple_extractor)
    #         fp.write('{},\n'.format(json.dumps(review, ensure_ascii=False)))
    #     fp.write(']')




