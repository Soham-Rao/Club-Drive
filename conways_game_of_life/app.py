from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', mode='single')

@app.route('/multiplayer')
def multiplayer():
    return render_template('index.html', mode='multiplayer')

@app.route('/assets/<path:filename>')
def custom_assets(filename):
    from flask import send_from_directory
    return send_from_directory('assets', filename)

if __name__ == '__main__':
    app.run(debug=True, port=3000)
