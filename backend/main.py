import json
from flask import Flask, request, Response
# from pyabsa import ABSAInstruction as absa_instruction

from models.MLModels import MLModels
from models.polarity_bert import BertPolarity
from solr_client import SolrClient
from flask_cors import CORS
from scrape import crawl

app = Flask(__name__)
CORS(app)
bert = BertPolarity()
#absa = absa_instruction.ABSAGenerator("multilingual")
ml_models = MLModels()
solr = SolrClient()

# @app.route("/update", methods=['POST'])
# def update():
#     data = request.get_data()
#     data = json.loads(data)
#     I, R = crawl(absa, solr, data['location'],data['url'], data['num_reviews'], data['num_restaurants'])
#     resp = Response(json.dumps({'num_store':I, 'num_review':R}), mimetype='application/json')
#     resp.headers['Access-Control-Allow-Origin'] = '*'
#     return resp

@app.route("/polarity", methods=['POST'])
def polarity_analysis():
    data = request.get_data()
    data = json.loads(data)
    models = data['models']
    text = data['text']
    preds = []
    for model in models:
        if model=='svc' or model=='sgd':
            pred, t = ml_models.predict(text, model)
            pred = 'positive' if pred==2 else 'negative'
            preds.append({'model': model, 'prediction': pred, 'time':round(t, 3)})
        elif model=='bert':
            pred, t = bert.predict([text])
            print(pred)
            preds.append({'model': model, 'prediction': str(round(pred[0][0], 3)), 'time':round(t, 3)})

    resp = Response(json.dumps(preds), mimetype='application/json')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


if __name__ == '__main__':
    app.run(host="localhost", port=5000, debug=True)


