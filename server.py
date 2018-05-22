import json
from collections import defaultdict

from bottle import Bottle, route, run, response
import boto3
from bottle.ext.websocket import GeventWebSocketServer
from bottle.ext.websocket import websocket


app = Bottle()
g = boto3.client('glue')


@app.hook('after_request')
def benrify():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'PUT, GET, POST, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token'
    response.headers['Content-Type'] = 'application/json'


def fetch_jobs():
    data = {
        'runs': [],
        'jobs': [],
    }
    for j in sorted([x['Name'] for x in g.get_jobs()['Jobs']]):
        data['jobs'].append(j)
        job_runs = g.get_job_runs(JobName=j)['JobRuns']
        data['runs'].append({
            'job': j,
            'runs': [{
                'id': r['Id'],
                'state': r['JobRunState'],
                'started_at': r['StartedOn'].strftime('%Y/%m/%d %H:%M:%S'),
                'args': r['Arguments'],
            } for r in sorted(job_runs, key=lambda x: x['StartedOn'], reverse=True)],
        })
    return data


@app.route('/jobs')
def jobs():
    return json.dumps(fetch_jobs())


import time

@app.get('/ws', apply=[websocket])
def fetch(ws):
    while True:
        msg = ws.receive()
        if msg is not None:
            ws.send(json.dumps(fetch_jobs()))


run(app, host='0.0.0.0', port='55301', server=GeventWebSocketServer)
