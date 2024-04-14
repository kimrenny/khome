from flask import Flask, jsonify, request
from flask_cors import CORS
from g4f.client import Client
import cloudscraper

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

scraper = cloudscraper.create_scraper()
client = Client(scraper=scraper)

@app.route('/process_request', methods=['POST'])
def process_request():
    print('Request taken')
    data = request.json

    response = client.chat.completions.create(
        model=data['model'],
        messages=data['messages'],
    )

    response_content = response.choices[0].message.content
    response_data = {'message': response_content}
    return jsonify(response_data), 200, {'Access-Control-Allow-Origin': '*'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
