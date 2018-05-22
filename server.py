import json
from collections import defaultdict

from bottle import Bottle, route, run, response
import boto3
from bottle.ext.websocket import GeventWebSocketServer
from bottle.ext.websocket import websocket


app = Bottle()
g = boto3.client('glue')


def as_(t):
    def _inner(func):
        def __inner(*args, **kwargs):
            response.headers['Content-Type'] = t
            return func(*args, **kwargs)
        return __inner
    return _inner


J = 'application/json'
T = 'text/html'


@app.hook('after_request')
def benrify():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'PUT, GET, POST, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token'


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


@app.route('/')
@as_(T)
def index():
    return open('./index.html').read()

@app.route('/main.js')
@as_(T)
def mainjs():
    return open('./main.js').read()


@app.route('/jobs')
@as_(J)
def jobs():
    return json.dumps(fetch_jobs())


@app.get('/ws', apply=[websocket])
@as_(J)
def fetch(ws):
    while True:
        msg = ws.receive()
        if msg is not None:
            ws.send(json.dumps(fetch_jobs()))


run(app, host='0.0.0.0', port='55301', server=GeventWebSocketServer)
