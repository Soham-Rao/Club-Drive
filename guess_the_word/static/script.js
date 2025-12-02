document.addEventListener('DOMContentLoaded', () => {
    // Home Page Logic
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }

    // Game Page Logic
    const guessInput = document.getElementById('guess-input');
    const submitBtn = document.getElementById('submit-guess');
    const exitBtn = document.getElementById('exit-btn');
    const retryBtn = document.getElementById('retry-btn');
    const homeBtn = document.getElementById('home-btn');

    if (guessInput) {
        guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitGuess();
        });
        submitBtn.addEventListener('click', submitGuess);
        exitBtn.addEventListener('click', () => window.location.href = '/');
        retryBtn.addEventListener('click', () => {
            const settings = JSON.parse(localStorage.getItem('gameSettings'));
            startNewGame(settings);
        });
        homeBtn.addEventListener('click', () => window.location.href = '/');

        const settings = JSON.parse(localStorage.getItem('gameSettings'));
        if (settings) {
            initGame(settings);
        } else {
            window.location.href = '/';
        }
    }
});

function startGame() {
    const timer = document.getElementById('timer').value;
    const difficulty = document.getElementById('difficulty').value;

    const settings = { timer, difficulty };
    localStorage.setItem('gameSettings', JSON.stringify(settings));

    window.location.href = '/game';
}

let gameTimerInterval;
let gameTimerValue;
let wordLength;
let secretWordRevealed = "";

function startNewGame(settings) {
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById('guesses-list').innerHTML = '';
    document.getElementById('feedback-area').textContent = '';
    document.getElementById('clue-area').textContent = '';
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-input').disabled = false;

    initGame(settings);
}

async function initGame(settings) {
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });
        const data = await response.json();

        wordLength = data.word_length;
        gameTimerValue = data.timer;

        updateTimerDisplay(gameTimerValue);
        renderUnderscores(wordLength);

        startTimer(data.timer);
    } catch (error) {
        console.error('Error starting game:', error);
    }
}

function renderUnderscores(length) {
    const display = document.getElementById('word-display');
    // We use spans to easily target specific letters later
    display.innerHTML = '';
    for (let i = 0; i < length; i++) {
        const span = document.createElement('span');
        span.textContent = '_';
        span.id = `char-${i}`;
        span.style.margin = '0 5px';
        display.appendChild(span);
    }
}

function updateTimerDisplay(val) {
    document.getElementById('timer-display').textContent = val;
}

function startTimer(totalTime) {
    clearInterval(gameTimerInterval);
    gameTimerValue = totalTime;

    const intervalStep = Math.floor(totalTime / 5);

    gameTimerInterval = setInterval(() => {
        gameTimerValue--;
        updateTimerDisplay(gameTimerValue);

        const elapsed = totalTime - gameTimerValue;

        // Clue logic
        if (gameTimerValue > 0) {
            // Half time clue (Sentence)
            if (elapsed === Math.floor(totalTime / 2)) {
                fetchClue('sentence');
            }
            // 1/5th intervals (Letters)
            else if (elapsed % intervalStep === 0 && elapsed !== 0) {
                fetchClue('letter');
            }
        }

        if (gameTimerValue <= 0) {
            endGame(false);
        }
    }, 1000);
}

async function submitGuess() {
    const input = document.getElementById('guess-input');
    const guess = input.value.trim();

    if (!guess) return;

    input.value = '';

    try {
        const response = await fetch('/api/guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guess })
        });
        const result = await response.json();

        if (result.status === 'win') {
            secretWordRevealed = result.secret_word;
            endGame(true);
        } else if (result.status === 'unknown') {
            showFeedback(result.message, 'neutral');
        } else {
            showFeedback(`${result.temperature} (${(result.similarity * 100).toFixed(1)}%)`, result.temperature);
            addHistory(guess, result.temperature, result.similarity);
        }
    } catch (error) {
        console.error('Error submitting guess:', error);
    }
}

async function fetchClue(type) {
    try {
        const response = await fetch('/api/clue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
        });
        const data = await response.json();
        console.log('Clue received:', data);

        if (data.type === 'letter') {
            const charSpan = document.getElementById(`char-${data.index}`);
            if (charSpan) {
                charSpan.textContent = data.letter.toUpperCase();
                charSpan.style.color = '#00b894'; // Highlight revealed letter
            }
        } else if (data.type === 'sentence') {
            document.getElementById('clue-area').textContent = data.text;
        }
    } catch (error) {
        console.error('Error fetching clue:', error);
    }
}

function showFeedback(message, type) {
    const area = document.getElementById('feedback-area');
    area.textContent = message;

    let color = '#dfe6e9';
    if (type.includes('Melting')) color = '#d63031';
    else if (type.includes('Burning')) color = '#e17055';
    else if (type.includes('Hot')) color = '#fdcb6e';
    else if (type.includes('Warm')) color = '#ffeaa7';
    else if (type.includes('Cool')) color = '#a29bfe';
    else if (type.includes('Cold')) color = '#0984e3';
    else if (type.includes('Frozen')) color = '#74b9ff';

    area.style.color = color;
}

function addHistory(word, temp, sim) {
    const list = document.getElementById('guesses-list');
    const item = document.createElement('div');
    item.className = 'guess-item';

    let colorClass = '';
    if (temp.includes('Melting')) colorClass = 'temp-melting';
    else if (temp.includes('Burning')) colorClass = 'temp-burning';
    else if (temp.includes('Hot')) colorClass = 'temp-hot';
    else if (temp.includes('Warm')) colorClass = 'temp-warm';
    else if (temp.includes('Cool')) colorClass = 'temp-cool';
    else if (temp.includes('Cold')) colorClass = 'temp-cold';
    else if (temp.includes('Frozen')) colorClass = 'temp-frozen';

    item.innerHTML = `
        <span class="guess-word">${word}</span>
        <span class="guess-temp ${colorClass}">${temp}</span>
    `;
    list.appendChild(item);
}

async function endGame(win) {
    clearInterval(gameTimerInterval);
    document.getElementById('guess-input').disabled = true;

    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');
    const reveal = document.getElementById('secret-word-reveal');

    if (!win) {
        // Fetch secret word if lost
        try {
            const response = await fetch('/api/reveal', { method: 'POST' });
            const data = await response.json();
            console.log('Reveal data:', data);
            secretWordRevealed = data.secret_word;
        } catch (e) {
            console.error(e);
        }

        title.textContent = 'Game Over';
        title.style.color = '#d63031';
        message.textContent = `Time's up!`;
    } else {
        title.textContent = 'You Won!';
        title.style.color = '#00b894';
        message.textContent = `Great job! You guessed the word.`;
    }

    reveal.textContent = secretWordRevealed.toUpperCase();
    modal.classList.remove('hidden');
}
