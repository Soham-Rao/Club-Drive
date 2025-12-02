# Club Drive Games

This repository contains two interactive web-based games: **Guess the Word** and **Mastermind**.

## Games

### 1. Guess the Word
A word guessing game where you try to find the secret word based on semantic similarity.
- **Features:**
    - AI-powered similarity scoring (using GloVe vectors).
    - "Temperature" feedback (Hot, Cold, Warm).
    - Multiple difficulty levels (Easy, Medium, Hard, Programming).
    - Custom word sets.

### 2. Mastermind
A digital version of the classic code-breaking board game.
- **Features:**
    - **Single Player:** Play against the computer.
    - **Multiplayer (Hot-seat):** Player 1 sets the code, Player 2 guesses.
    - **Drag & Drop Interface:** Intuitive controls for placing pegs.
    - **3D Visuals:** Diep.io-inspired aesthetic.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Soham-Rao/Club-Drive.git
    cd Club-Drive
    ```

2.  **Install Dependencies:**
    Each game has its own `requirements.txt`.
    
    *For Guess the Word:*
    ```bash
    cd guess_the_word
    pip install -r requirements.txt
    ```

    *For Mastermind:*
    ```bash
    cd ../mastermind
    pip install -r requirements.txt
    ```

## How to Run

### Mastermind
1.  Navigate to the `mastermind` directory.
2.  Run the Flask app:
    ```bash
    python app.py
    ```
3.  Open your browser and go to `http://127.0.0.1:8000`.

### Guess the Word
1.  Navigate to the `guess_the_word` directory.
2.  Run the Flask app:
    ```bash
    python app.py
    ```
3.  Open your browser and go to `http://127.0.0.1:5000` (default Flask port, may vary).

## Technologies Used
- **Backend:** Python, Flask
- **Frontend:** HTML, CSS, JavaScript
- **AI/ML:** Gensim (for Guess the Word)
