# app.py

from flask import Flask, render_template, request, jsonify
import requests
from config import OPENWEATHERMAP_API_KEY
app = Flask(__name__)
app.config['OPENWEATHERMAP_API_KEY'] = OPENWEATHERMAP_API_KEY

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/countries')
def countries():
    # Fetch the GeoJSON data
    geojson_url = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'
    response = requests.get(geojson_url)
    data = response.json()
    return jsonify(data)

@app.route('/country_names')
def country_names():
    response = requests.get('https://restcountries.com/v3.1/all')
    data = response.json()
    country_names = [country['name']['common'] for country in data]
    return jsonify(country_names)

@app.route('/search_country')
def search_country():
    country_name = request.args.get('country')
    response = requests.get(f'https://restcountries.com/v3.1/name/{country_name}')
    data = response.json()
    if response.status_code != 200 or not data:
        return jsonify({'error': 'Country not found'}), 404
    country = data[0]
    latlng = country.get('latlng', None)
    name = country.get('name', {}).get('common', None)
    return jsonify({'latlng': latlng, 'name': name})

@app.route('/weather')
def weather():
    country_name = request.args.get('country')
    if not country_name:
        return jsonify({'error': 'No country provided'}), 400

    # Fetch country data
    country_response = requests.get(f'https://restcountries.com/v3.1/name/{country_name}')
    if country_response.status_code != 200:
        return jsonify({'error': 'Country not found'}), 404

    country_data = country_response.json()
    if not country_data:
        return jsonify({'error': 'No data for the country'}), 404

    country = country_data[0]
    capital = country.get('capital', [None])[0]
    if not capital:
        return jsonify({'error': 'Capital not found'}), 404

    latlng = country.get('capitalInfo', {}).get('latlng', None)
    if not latlng:
        return jsonify({'error': 'Capital coordinates not found'}), 404

    # Fetch weather data
    api_key = app.config['OPENWEATHERMAP_API_KEY']
    weather_url = f'https://api.openweathermap.org/data/2.5/weather?lat={latlng[0]}&lon={latlng[1]}&appid={api_key}&units=metric'
    weather_response = requests.get(weather_url)
    if weather_response.status_code != 200:
        return jsonify({'error': 'Weather data not found'}), 404

    weather_data = weather_response.json()
    return jsonify(weather_data)

if __name__ == '__main__':
    app.run(debug=True)
