from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', mode='single')

@app.route('/multiplayer')
def multiplayer():
    return render_template('index.html', mode='multiplayer')

if __name__ == '__main__':
    app.run(debug=True, port=3000)
