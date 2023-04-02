import json
from flask import Flask, request, Response
from pyabsa import ABSAInstruction as absa_instruction
from solr_client import SolrClient
from flask_cors import CORS
from scrape import crawl

app = Flask(__name__)
CORS(app)
absa = absa_instruction.ABSAGenerator("multilingual")
solr = SolrClient()

@app.route("/update", methods=['POST'])
def update():
    data = request.get_data()
    data = json.loads(data)
    I, R = crawl(absa, solr, data['location'],data['url'], data['num_restaurants'], data['num_reviews'])
    resp = Response(json.dumps({'num_store':I, 'num_review':R}), mimetype='application/json')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

@app.route("/polarity", methods=['POST'])
def polarity_analysis():
    data = request.get_data()
    data = json.loads(data)