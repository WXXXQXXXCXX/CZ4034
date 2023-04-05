import time

import joblib
import re
import string
import nltk
import pickle
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
nltk.download('punkt')
nltk.download('wordnet')

class MLModels:
    def __init__(self):
        self.linearSVC = joblib.load("models/LinearSVC.sav")
        self.SGDClassifier = joblib.load("models/SGDClassifier.sav")

    def _clean_text(self, text):
        '''Make text lowercase, remove text in square brackets, remove punctuation, remove special symbols and remove words containing numbers.'''
        text = text.lower()
        text = re.sub('\[.*?]', '', text)
        text = re.sub('[%s]' % re.escape(string.punctuation), '', text)
        text = re.sub('\w*\d\w*', '', text)
        text = re.sub('[‘’“”…]', '', text)
        text = re.sub('\n', '', text)
        return text

    def _remove_stopwords(self, text):
        '''Remove stopwords'''
        stop =['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've",
               "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
               'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 
               'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 
               'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
               'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 
               'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against','im', 
               'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 
               'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
               'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
               'most', 'other', 'some', 'such', 'only', 'own', 'same', 'so', 'than', 'too','very', 's', 't', 
               'can', 'will', 'just', 'should', "should've", 'now', 'd','ll', 'm', 'o', 're', 've', 'y', 'ma']
        text = ' '.join([word for word in text.split() if word not in (stop)])
        return text

    def _tokenizer(self, text):
        text_tokens = word_tokenize(text)
        return text_tokens

    def _lemmatizer(self, text_tokens):
        lem_text = [WordNetLemmatizer().lemmatize(i) for i in text_tokens]
        return lem_text

    def _tfidf(self, lem_text):
        tf_saved = pickle.load(open("models/tfidf.pkl", 'rb'))
        tf = TfidfVectorizer(vocabulary = tf_saved.vocabulary_)
        lem_text = [' '.join(lem_text)]
        lem_text = tf.fit_transform(lem_text)
        return lem_text

    def predict(self, text, model='svc'):
        start = time.time()
        text = self._clean_text(text)
        text = self._remove_stopwords(text)
        text_tokens = self._tokenizer(text)
        lem_text = self._lemmatizer(text_tokens)
        lem_text = self._tfidf(lem_text)
        if model=='svc':
            pred = self.linearSVC.predict(lem_text)
            end = time.time()
            return pred, end-start
        elif model=='sgd':
            pred = self.SGDClassifier.predict(lem_text)
            end = time.time()
            return pred, end - start



if __name__ == '__main__':
    x =  MLModels()
    predicted_label_SVC= x.predict('I hate this place, service is very slow')

    