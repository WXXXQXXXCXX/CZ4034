import re

import numpy as np
from keras.models import load_model
import transformers
from keras import backend as K
from nltk import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from tokenizers.implementations import BertWordPieceTokenizer

import nltk
# nltk.download('stopwords')
# nltk.download('wordnet')

def recall_m(y_true, y_pred):
    true_positives = K.sum(K.round(K.clip(y_true * y_pred, 0, 1)))
    possible_positives = K.sum(K.round(K.clip(y_true, 0, 1)))
    recall = true_positives / (possible_positives + K.epsilon())
    return recall

def precision_m(y_true, y_pred):
    true_positives = K.sum(K.round(K.clip(y_true * y_pred, 0, 1)))
    predicted_positives = K.sum(K.round(K.clip(y_pred, 0, 1)))
    precision = true_positives / (predicted_positives + K.epsilon())
    return precision

def f1_m(y_true, y_pred):
    precision = precision_m(y_true, y_pred)
    recall = recall_m(y_true, y_pred)
    return 2*((precision*recall)/(precision+recall+K.epsilon()))

class BertPolarity:
    def __init__(self):
        self.bert_model = load_model('yelp_bert.h5',
                                custom_objects={
                                    "TFDistilBertModel": transformers.TFDistilBertModel.from_pretrained(
                                        'distilbert-base-multilingual-cased'),
                                    "f1_m": f1_m,
                                    "precision_m": precision_m,
                                    "recall_m": recall_m
                                })
        self.lm=WordNetLemmatizer()
        self.tokenizer = transformers.DistilBertTokenizer.from_pretrained('distilbert-base-multilingual-cased')
        self.tokenizer.save_pretrained('.')
        self.fast_tokenizer = BertWordPieceTokenizer('vocab.txt', lowercase=False)
        self.MAX_LEN = 192

    def _preprocess(self, text):
        text = text.lower()
        text = re.sub('[^A-Za-z]+', ' ', str(text))
        text = re.sub(r'w+:/{2}[dw-]+(.[dw-]+)*(?:(?:/[^s/]*))*', '', str(text))
        text = re.sub('\n', ' ', str(text))
        text = re.sub(' +', ' ', str(text))
        text = re.sub(r"\W+|_", ' ', text)
        text = word_tokenize(text)
        words = [self.lm.lemmatize(word) for word in text if word not in set(stopwords.words('english'))]
        return " ".join(words)

    def _fast_encode(self, texts, tokenizer, chunk_size=256, maxlen=512):

        tokenizer.enable_truncation(max_length=maxlen)
        tokenizer.enable_padding(length=self.MAX_LEN)
        all_ids = []

        for i in range(0, len(texts), chunk_size):
            text_chunk = texts[i:i + chunk_size]
            encs = tokenizer.encode_batch(text_chunk)
            all_ids.extend([enc.ids for enc in encs])
        return np.array(all_ids)

    def predict(self, txt):
        txt_cleaned = [self._preprocess(i) for i in txt]
        x = self._fast_encode(txt_cleaned, self.fast_tokenizer, self.MAX_LEN)
        y = self.bert_model.predict(x)
        return y

if __name__ == '__main__':
    x = BertPolarity()
    print(x.predict(['the food here is really good, i will definitely come back!']))
