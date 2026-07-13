import json

def encode(data):
    return json.dumps(data).encode("utf-8")

def decode(data):
    return json.loads(data.decode("utf-8"))