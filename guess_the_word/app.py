from flask import Flask, render_template, jsonify, request, send_from_directory
import os
from game_engine import GameEngine

app = Flask(__name__, static_folder='static', template_folder='templates')
game_engine = GameEngine()

@app.route('/')
def home():
    custom_available = os.path.exists('custom_words.txt')
    print(f"Home route hit. Custom available: {custom_available}")
    return render_template('index.html', custom_available=custom_available)

@app.route('/game')
def game():
    return render_template('game.html')

@app.route('/api/start', methods=['POST'])
def start_game():
    data = request.json
    settings = data.get('settings', {})
    game_state = game_engine.start_game(settings)
    return jsonify(game_state)

@app.route('/api/guess', methods=['POST'])
def guess_word():
    data = request.json
    guess = data.get('guess')
    result = game_engine.process_guess(guess)
    print(f"Guess: {guess}, Result: {result}")
    return jsonify(result)

@app.route('/api/clue', methods=['POST'])
def get_clue():
    data = request.json
    clue_type = data.get('type', 'letter')
    clue = game_engine.get_clue(clue_type)
    print(f"Clue requested: {clue_type}, Returned: {clue}")
    return jsonify(clue)

@app.route('/api/reveal', methods=['POST'])
def reveal_word():
    result = game_engine.give_up()
    print(f"Reveal requested. Returning: {result}")
    return jsonify(result)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

if __name__ == '__main__':
    # Ensure assets directory exists or is handled
    if not os.path.exists('static/assets'):
        # If assets are in root/assets, we might want to move them or serve them from there
        # For now, let's assume we serve from root/assets if static/assets doesn't exist
        pass
    app.run(debug=True, port=5000)
