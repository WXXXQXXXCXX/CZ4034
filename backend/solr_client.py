import urllib3
import json
import pysolr
STORE_INFO_URL = "http://localhost:8983/solr/restaurant_info/"
REVIEW_URL = "http://localhost:8983/solr/restaurant_review/"
http = urllib3.PoolManager()

class SolrClient:
    def __init__(self):
        self.info_conn = pysolr.Solr('http://localhost:8983/solr/restaurant_info/', timeout=10, always_commit=True)
        self.review_conn = pysolr.Solr('http://localhost:8983/solr/restaurant_review/', timeout=10, always_commit=True)

    def update_restaurant(self, info):
        if not isinstance(info, list):
            info = [info]
        self.info_conn.add(info)

    def update_review(self, reviews):
        self.review_conn.add(reviews)
