document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const colorOptions = document.querySelectorAll('.color-option');
    const guessHoles = document.querySelectorAll('.current-guess-row .guess-hole');
    const submitBtn = document.getElementById('submit-guess');
    const messageArea = document.getElementById('message-area');
    const restartBtn = document.getElementById('restart-btn');

    let selectedColor = null;
    let currentGuess = [null, null, null, null];
    let turnCount = 0;
    let maxTurns = 10;

    // Initialize Game
    startGame();

    function startGame() {
        renderBoard(10);
        enableControls(true);
    }

    function renderBoard(turns) {
        gameBoard.innerHTML = '';
        for (let i = 0; i < turns; i++) {
            createBoardRow(i + 1);
        }
        resetCurrentGuessUI();
    }

    function createBoardRow(turnNum) {
        const row = document.createElement('div');
        row.className = 'board-row';
        row.id = `row-${turnNum}`;
        row.innerHTML = `
            <div class="turn-number">${turnNum}</div>
            <div class="guess-slots">
                <div class="hole"></div>
                <div class="hole"></div>
                <div class="hole"></div>
                <div class="hole"></div>
            </div>
            <div class="feedback-slots">
                <div class="feedback-peg"></div>
                <div class="feedback-peg"></div>
                <div class="feedback-peg"></div>
                <div class="feedback-peg"></div>
            </div>
        `;
        gameBoard.appendChild(row);
    }

    // Color Selection & Drag Logic
    colorOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedColor = opt.dataset.color;
        });

        opt.setAttribute('draggable', 'true');
        opt.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', opt.dataset.color);
            opt.classList.add('dragging');
        });

        opt.addEventListener('dragend', () => {
            opt.classList.remove('dragging');
        });
    });

    // Hole Interaction
    guessHoles.forEach((hole, index) => {
        hole.addEventListener('click', () => {
            if (selectedColor) {
                placePeg(index, selectedColor);
            }
        });

        hole.addEventListener('dragover', (e) => {
            e.preventDefault();
            hole.classList.add('drag-over');
        });

        hole.addEventListener('dragleave', () => {
            hole.classList.remove('drag-over');
        });

        hole.addEventListener('drop', (e) => {
            e.preventDefault();
            hole.classList.remove('drag-over');
            const color = e.dataTransfer.getData('text/plain');
            if (color) {
                placePeg(index, color);
            }
        });
    });

    function placePeg(index, color) {
        currentGuess[index] = color;
        guessHoles[index].style.backgroundColor = getColorHex(color);
        guessHoles[index].classList.remove('empty');
        checkSubmitButton();
    }

    function getColorHex(colorName) {
        const map = {
            'red': '#ff4d4d', 'blue': '#4d4dff', 'green': '#4dff4d',
            'yellow': '#ffff4d', 'orange': '#ffad33', 'purple': '#bf40bf'
        };
        return map[colorName] || '#2c3e50';
    }

    function checkSubmitButton() {
        if (currentGuess.every(c => c !== null)) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    function resetCurrentGuessUI() {
        currentGuess = [null, null, null, null];
        guessHoles.forEach(hole => {
            hole.style.backgroundColor = '';
            hole.classList.add('empty');
            hole.style.removeProperty('background-color');
        });
        submitBtn.disabled = true;
        colorOptions.forEach(o => o.classList.remove('selected'));
        selectedColor = null;
    }

    submitBtn.addEventListener('click', () => {
        turnCount++;
        const guessToSend = [...currentGuess];
        updateBoardRow(turnCount, guessToSend);

        fetch('/api/guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guess: guessToSend })
        })
            .then(res => res.json())
            .then(data => {
                updateFeedback(turnCount, data.feedback);
                if (data.status === 'win') {
                    endGame(true, data.secret_code);
                } else if (data.status === 'lose') {
                    endGame(false, data.secret_code);
                } else {
                    resetCurrentGuessUI();
                }
            });
    });

    function updateBoardRow(turnNum, guess) {
        const row = document.getElementById(`row-${turnNum}`);
        const holes = row.querySelectorAll('.guess-slots .hole');
        holes.forEach((hole, i) => {
            hole.style.backgroundColor = getColorHex(guess[i]);
        });
    }

    function updateFeedback(turnNum, feedback) {
        const row = document.getElementById(`row-${turnNum}`);
        const pegs = row.querySelectorAll('.feedback-peg');
        let pegIndex = 0;
        for (let i = 0; i < feedback.black; i++) {
            pegs[pegIndex].classList.add('black');
            pegIndex++;
        }
        for (let i = 0; i < feedback.white; i++) {
            pegs[pegIndex].classList.add('white');
            pegIndex++;
        }
    }

    function endGame(win, secretCode) {
        enableControls(false);

        if (typeof GAME_MODE !== 'undefined' && GAME_MODE === 'multiplayer') {
            restartBtn.style.display = 'none';
        } else {
            restartBtn.style.display = 'block';
        }

        if (win) {
            messageArea.innerHTML = "YOU BROKE THE CODE! 🎉";
            messageArea.style.color = "#2ecc71";
        } else {
            messageArea.innerHTML = `GAME OVER. Code was: ${secretCode.join(', ')}`;
            messageArea.style.color = "#e74c3c";
        }
    }

    function enableControls(enable) {
        const controls = document.querySelector('.controls');
        if (enable) {
            controls.style.pointerEvents = 'auto';
            controls.style.opacity = '1';
        } else {
            controls.style.pointerEvents = 'none';
            controls.style.opacity = '0.5';
        }
    }

    restartBtn.addEventListener('click', () => {
        fetch('/api/restart', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                turnCount = 0;
                renderBoard(data.max_turns);
                messageArea.textContent = "";
                restartBtn.style.display = 'none';
                enableControls(true);
            });
    });
});
