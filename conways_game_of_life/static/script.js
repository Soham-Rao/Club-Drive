document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const clearBtn = document.getElementById('clear-btn');
    const randomBtn = document.getElementById('random-btn');
    const speedRange = document.getElementById('speed-range');
    const genCountSpan = document.getElementById('gen-count');
    const popCountSpan = document.getElementById('pop-count');

    const ROWS = 30;
    const COLS = 50;
    let grid = [];
    let isRunning = false;
    let intervalId = null;
    let generation = 0;
    let speed = 100;
    let isDrawing = false;

    // Multiplayer State
    let currentPlayer = 1; // 1 or 2
    const MAX_GENS = 1000;

    // UI Elements for Multiplayer
    const p1Btn = document.getElementById('p1-btn');
    const p2Btn = document.getElementById('p2-btn');
    const p1CountSpan = document.getElementById('p1-count');
    const p2CountSpan = document.getElementById('p2-count');

    if (typeof GAME_MODE !== 'undefined' && GAME_MODE === 'multiplayer') {
        if (p1Btn) p1Btn.addEventListener('click', () => setPlayer(1));
        if (p2Btn) p2Btn.addEventListener('click', () => setPlayer(2));
    }

    function setPlayer(p) {
        currentPlayer = p;
        if (p === 1) {
            p1Btn.classList.add('active');
            p2Btn.classList.remove('active');
        } else {
            p1Btn.classList.remove('active');
            p2Btn.classList.add('active');
        }
    }

    // Initialize Grid
    function initGrid() {
        gridContainer.innerHTML = '';
        grid = [];

        document.addEventListener('mouseup', () => { isDrawing = false; });

        for (let r = 0; r < ROWS; r++) {
            const row = [];
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    isDrawing = true;
                    if (typeof GAME_MODE !== 'undefined' && GAME_MODE === 'multiplayer') {
                        paintCell(r, c, currentPlayer);
                    } else {
                        toggleCell(r, c);
                    }
                });

                cell.addEventListener('mouseenter', () => {
                    if (isDrawing) {
                        if (typeof GAME_MODE !== 'undefined' && GAME_MODE === 'multiplayer') {
                            paintCell(r, c, currentPlayer);
                        } else {
                            if (!grid[r][c].alive) toggleCell(r, c);
                        }
                    }
                });

                gridContainer.appendChild(cell);
                row.push({ element: cell, alive: false, player: 0 });
            }
            grid.push(row);
        }
        updateStats();
    }

    function toggleCell(r, c) {
        const cell = grid[r][c];
        cell.alive = !cell.alive;
        cell.player = cell.alive ? 1 : 0;
        updateCellVisual(cell);
        updateStats();
    }

    function paintCell(r, c, player) {
        const cell = grid[r][c];
        cell.alive = true;
        cell.player = player;
        updateCellVisual(cell);
        updateStats();
    }

    function updateCellVisual(cell) {
        cell.element.classList.remove('alive', 'p1', 'p2');
        if (cell.alive) {
            cell.element.classList.add('alive');
            if (typeof GAME_MODE !== 'undefined' && GAME_MODE === 'multiplayer') {
                cell.element.classList.add(cell.player === 1 ? 'p1' : 'p2');
            }
        }
    }

    function randomize() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const alive = Math.random() > 0.7;
                grid[r][c].alive = alive;
                if (alive && typeof GAME_MODE !== 'undefined' && GAME_MODE === 'multiplayer') {
                    grid[r][c].player = Math.random() > 0.5 ? 1 : 2;
                } else {
                    grid[r][c].player = alive ? 1 : 0;
                }
                updateCellVisual(grid[r][c]);
            }
        }
        generation = 0;
        updateStats();
    }

    function clear() {
        stopGame();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                grid[r][c].alive = false;
                grid[r][c].player = 0;
                updateCellVisual(grid[r][c]);
            }
        }
        generation = 0;
        updateStats();
    }

    function getNeighbors(r, c) {
        let neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const nr = r + i;
                const nc = c + j;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    if (grid[nr][nc].alive) {
                        neighbors.push(grid[nr][nc].player);
                    }
                }
            }
        }
        return neighbors;
    }

    function nextGeneration() {
        if (typeof GAME_MODE !== 'undefined' && GAME_MODE === 'multiplayer' && generation >= MAX_GENS) {
            stopGame();
            declareWinner();
            return;
        }

        const nextState = grid.map(row => row.map(cell => ({ alive: cell.alive, player: cell.player })));
        let hasChanges = false;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const neighbors = getNeighbors(r, c);
                const count = neighbors.length;
                const isAlive = grid[r][c].alive;

                if (isAlive && (count < 2 || count > 3)) {
                    nextState[r][c].alive = false;
                    nextState[r][c].player = 0;
                    hasChanges = true;
                } else if (!isAlive && count === 3) {
                    nextState[r][c].alive = true;

                    const p1Parents = neighbors.filter(p => p === 1).length;
                    const p2Parents = neighbors.filter(p => p === 2).length;
                    nextState[r][c].player = p1Parents > p2Parents ? 1 : 2;

                    hasChanges = true;
                }
            }
        }

        if (!hasChanges) {
            stopGame();
            if (typeof GAME_MODE !== 'undefined' && GAME_MODE === 'multiplayer') declareWinner();
            return;
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c].alive !== nextState[r][c].alive || grid[r][c].player !== nextState[r][c].player) {
                    grid[r][c].alive = nextState[r][c].alive;
                    grid[r][c].player = nextState[r][c].player;
                    updateCellVisual(grid[r][c]);
                }
            }
        }

        generation++;
        updateStats();
    }

    function declareWinner() {
        let p1 = 0, p2 = 0;
        grid.forEach(row => row.forEach(cell => {
            if (cell.alive) {
                if (cell.player === 1) p1++;
                else if (cell.player === 2) p2++;
            }
        }));

        let msg = `Game Over! Generation ${generation}.\n`;
        if (p1 > p2) msg += "Player 1 (Green) Wins!";
        else if (p2 > p1) msg += "Player 2 (Orange) Wins!";
        else msg += "It's a Tie!";

        alert(msg);
    }

    function startGame() {
        if (isRunning) return;
        isRunning = true;
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        intervalId = setInterval(nextGeneration, speed);
    }

    function stopGame() {
        isRunning = false;
        clearInterval(intervalId);
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }

    function updateStats() {
        genCountSpan.textContent = generation;
        let pop = 0, p1 = 0, p2 = 0;
        grid.forEach(row => row.forEach(cell => {
            if (cell.alive) {
                pop++;
                if (cell.player === 1) p1++;
                if (cell.player === 2) p2++;
            }
        }));
        popCountSpan.textContent = pop;
        if (p1CountSpan) p1CountSpan.textContent = p1;
        if (p2CountSpan) p2CountSpan.textContent = p2;
    }

    startBtn.addEventListener('click', startGame);
    stopBtn.addEventListener('click', stopGame);
    clearBtn.addEventListener('click', clear);
    randomBtn.addEventListener('click', randomize);

    speedRange.addEventListener('input', (e) => {
        speed = 510 - e.target.value;
        if (isRunning) {
            clearInterval(intervalId);
            intervalId = setInterval(nextGeneration, speed);
        }
    });

    initGrid();
    randomize();
});
