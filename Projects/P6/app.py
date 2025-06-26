# app.py
from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def home():
    version = os.environ.get('APP_VERSION', '1.0')
    return f"Hello from My Microservice - Version {version}!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80) # Listen on port 80