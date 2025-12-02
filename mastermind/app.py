from flask import Flask, render_template, jsonify, request
from game_engine import GameEngine

app = Flask(__name__)
game_engine = GameEngine()

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/game')
def game():
    return render_template('index.html', mode=getattr(game_engine, 'mode', 'computer'))

@app.route('/api/start', methods=['POST'])
def start_game():
    data = request.json or {}
    mode = data.get('mode', 'computer')
    secret_code = data.get('secret_code', None)
    
    game_state = game_engine.start_game(mode, secret_code)
    return jsonify(game_state)

@app.route('/api/guess', methods=['POST'])
def guess_code():
    data = request.json
    guess = data.get('guess')
    result = game_engine.check_guess(guess)
    return jsonify(result)

@app.route('/api/restart', methods=['POST'])
def restart_game():
    # Restart with same settings as previous game
    game_state = game_engine.restart_game()
    return jsonify(game_state)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
