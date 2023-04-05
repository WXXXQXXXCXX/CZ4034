# Standard libs
import pandas as pd
import numpy as np

# DataPrep
import re
import nltk
from nltk import word_tokenize, sent_tokenize
from nltk.corpus import stopwords, wordnet
from nltk.stem import PorterStemmer
from nltk.stem import RSLPStemmer, WordNetLemmatizer
from sklearn import preprocessing
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer, TfidfTransformer
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
import joblib
import scipy
import scipy.sparse as sp
import string

# Modeling
from sklearn.model_selection import train_test_split
from sklearn.model_selection import GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.naive_bayes import MultinomialNB
from sklearn.preprocessing import FunctionTransformer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn import metrics
from sklearn.metrics import accuracy_score, classification_report
from sklearn.feature_selection import SelectKBest, chi2
import pickle

from tqdm import tqdm

class ModelPredict:
    def __init__(self):
        # Load models
        self.LinearSVC = pickle.load(open("LinearSVC.sav", 'rb'))
        self.MultinomialNB = pickle.load(open("MultinomialNB.sav",'rb'))
        self.GradientBoosting = pickle.load(open("GradientBoosting.sav",'rb'))
        self.LogisticRegression = pickle.load(open("LogisticRegression.sav",'rb'))

    def preprocess(self, text):
        
        custom_stop_words = {'not','no','never'}
        stop_words = set(stopwords.words('english')) - custom_stop_words
        stemmer = PorterStemmer()
        lemmatizer = WordNetLemmatizer()
        
        # Remove punctuation
        text = text.translate(str.maketrans("", "", string.punctuation))

        # Tokenize text
        tokens = word_tokenize(text.lower())
        
        # Custom stopwords removal
        words_clean = []
        is_negated = False # flag to keep track of negation
        for word in tokens:
            if word in custom_stop_words:
                is_negated = True # set the flag to True if the word is a negation word
            elif word in stop_words and not is_negated:
                continue # skip stopwords if not negated
            elif is_negated:
                words_clean.append("not_" + word) # prefix negated words with "not_"
                is_negated = False # reset the flag
            else:
                words_clean.append(word) # add non-stopwords to the list
        
        # Lemmatize words
        words = [lemmatizer.lemmatize(word) for word in words_clean]

        # Rejoin the tokens into a string
        return ' '.join(words)
    
    def tfidfConverter(self, text):
        cv = pickle.load(open("cv.pickle", 'rb'))
        tfidf_transformer = pickle.load(open("tfidf.pickle", 'rb'))
        x_cv = cv.transform([text])
        X_tfidf_text = tfidf_transformer.transform(x_cv)
        return X_tfidf_text
    
    def predict(self, text):
        processed_text = self.preprocess(text)
        x_test = self.tfidfConverter(processed_text)
        y_pred = self.LogisticRegression.predict(x_test)
        if (y_pred[0] == 1):
            result = 'Negative'
        elif (y_pred[0] == 2):
            result = 'Positive'
        else:
            result = None
        return result

if __name__ == '__main__':
    x = ModelPredict()
    print(x.predict('The food is not good! I would not come back again'))
