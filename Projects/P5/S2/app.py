# app.py for 'auth' service
from flask import Flask
app = Flask(__name__)

@app.route('/order')
@app.route('/order/<path:subpath>')
def auth_service(subpath=''):
    return f"Hello from Order Service! Path: /order/{subpath}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)