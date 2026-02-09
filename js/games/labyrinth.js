(() => {
    const state = {
        isRunning: false,
        tileSize: 10,
        cols: 0,
        rows: 0,
        grid: [],
        player: { col: 0, row: 0, el: null, moveCooldown: 0, moveInterval: 120 },
        goal: { col: 1, row: 1 },
        keys: { up: false, down: false, left: false, right: false },
        lastTime: 0,
        startTime: 0,
        animationId: null,
        els: {
            screen: null,
            gameArea: null,
            time: null,
            victoryOverlay: null,
            finalTime: null
        }
    };

    function init({ screenEl, gameAreaEl, timeEl, victoryOverlayEl, finalTimeEl }) {
        state.els.screen = screenEl;
        state.els.gameArea = gameAreaEl;
        state.els.time = timeEl;
        state.els.victoryOverlay = victoryOverlayEl;
        state.els.finalTime = finalTimeEl;
    }

    function start() {
        stop();
        if (!state.els.gameArea) return;

        state.keys.up = false;
        state.keys.down = false;
        state.keys.left = false;
        state.keys.right = false;

        state.player.moveCooldown = 0;
        state.els.victoryOverlay?.classList.add('hidden');

        buildMaze();
        renderMaze();
        resetTimer();

        state.isRunning = true;
        state.lastTime = performance.now();
        state.animationId = requestAnimationFrame(loop);
    }

    function stop() {
        state.isRunning = false;
        if (state.animationId) cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }

    function setKey(key, value) {
        if (!state.keys.hasOwnProperty(key)) return;
        state.keys[key] = value;
    }

    function handleA() {
        if (!state.els.victoryOverlay) return;
        if (!state.els.victoryOverlay.classList.contains('hidden')) start();
    }

    function loop(ts) {
        if (!state.isRunning) return;

        const dt = ts - state.lastTime;
        state.lastTime = ts;

        updateTimer(ts);
        updatePlayer(dt);
        checkWin();

        state.animationId = requestAnimationFrame(loop);
    }

    function buildMaze() {
        // Use parent rect to determine available space correctly
        const parentRect = state.els.gameArea.parentElement.getBoundingClientRect();
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height - 28; // Subtract header height approx (20 + 4+4 padding)

        // Calculate number of columns (must be odd)
        let cols = Math.floor(availableWidth / 10);
        if (cols % 2 === 0) cols--;
        state.cols = Math.max(15, cols);

        // Calculate actual tileSize to fill the width perfectly
        state.tileSize = availableWidth / state.cols;

        // Calculate number of rows (must be odd)
        let rows = Math.floor(availableHeight / state.tileSize);
        if (rows % 2 === 0) rows--;
        state.rows = Math.max(15, rows);

        // Set gameArea size to exactly fit the maze
        state.els.gameArea.style.width = '100%';
        state.els.gameArea.style.height = (state.rows * state.tileSize) + 'px';

        state.grid = Array.from({ length: state.rows }, () => Array.from({ length: state.cols }, () => 1));

        const visited = Array.from({ length: state.rows }, () => Array.from({ length: state.cols }, () => false));
        const stack = [];

        const start = { col: 1, row: 1 };
        openCell(start.col, start.row);
        visited[start.row][start.col] = true;
        stack.push(start);

        while (stack.length) {
            const cur = stack[stack.length - 1];
            const neighbors = unvisitedNeighbors2(cur.col, cur.row, visited);

            if (neighbors.length === 0) {
                stack.pop();
                continue;
            }

            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            const wallCol = cur.col + Math.sign(next.col - cur.col);
            const wallRow = cur.row + Math.sign(next.row - cur.row);

            openCell(wallCol, wallRow);
            openCell(next.col, next.row);
            visited[next.row][next.col] = true;
            stack.push(next);
        }

        state.goal.col = 1;
        state.goal.row = 1;
        state.player.col = state.cols - 2;
        state.player.row = state.rows - 2;
        openCell(state.player.col, state.player.row);
    }

    function openCell(col, row) {
        if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return;
        state.grid[row][col] = 0;
    }

    function unvisitedNeighbors2(col, row, visited) {
        const candidates = [
            { col: col, row: row - 2 },
            { col: col, row: row + 2 },
            { col: col - 2, row: row },
            { col: col + 2, row: row }
        ];

        const out = [];
        for (const c of candidates) {
            if (c.row <= 0 || c.row >= state.rows - 1 || c.col <= 0 || c.col >= state.cols - 1) continue;
            if (visited[c.row][c.col]) continue;
            out.push(c);
        }
        return out;
    }

    function renderMaze() {
        state.els.gameArea.replaceChildren();

        const frag = document.createDocumentFragment();
        for (let row = 0; row < state.rows; row++) {
            for (let col = 0; col < state.cols; col++) {
                if (state.grid[row][col] !== 1) continue;
                const wall = document.createElement('div');
                wall.className = 'lb-tile lb-wall';
                wall.style.width = `${state.tileSize}px`;
                wall.style.height = `${state.tileSize}px`;
                wall.style.left = `${col * state.tileSize}px`;
                wall.style.top = `${row * state.tileSize}px`;
                frag.appendChild(wall);
            }
        }

        const goalEl = document.createElement('div');
        goalEl.className = 'lb-tile lb-goal';
        goalEl.style.width = `${state.tileSize}px`;
        goalEl.style.height = `${state.tileSize}px`;
        goalEl.style.left = `${state.goal.col * state.tileSize}px`;
        goalEl.style.top = `${state.goal.row * state.tileSize}px`;
        frag.appendChild(goalEl);

        const playerEl = document.createElement('div');
        playerEl.className = 'lb-tile lb-player';
        playerEl.style.width = `${state.tileSize}px`;
        playerEl.style.height = `${state.tileSize}px`;
        playerEl.style.left = `${state.player.col * state.tileSize}px`;
        playerEl.style.top = `${state.player.row * state.tileSize}px`;
        playerEl.style.zIndex = '5';
        frag.appendChild(playerEl);
        state.player.el = playerEl;

        state.els.gameArea.appendChild(frag);
        updateTimeUI(0);
    }

    function updatePlayer(dt) {
        state.player.moveCooldown -= dt;
        if (state.player.moveCooldown > 0) return;

        const dir = getDirection();
        if (!dir) return;

        const nextCol = clamp(state.player.col + dir.dc, 0, state.cols - 1);
        const nextRow = clamp(state.player.row + dir.dr, 0, state.rows - 1);
        if (nextCol === state.player.col && nextRow === state.player.row) return;
        if (state.grid[nextRow][nextCol] === 1) return;

        state.player.col = nextCol;
        state.player.row = nextRow;
        if (state.player.el) {
            state.player.el.style.left = `${state.player.col * state.tileSize}px`;
            state.player.el.style.top = `${state.player.row * state.tileSize}px`;
        }
        state.player.moveCooldown = state.player.moveInterval;
    }

    function getDirection() {
        if (state.keys.up) return { dc: 0, dr: -1 };
        if (state.keys.down) return { dc: 0, dr: 1 };
        if (state.keys.left) return { dc: -1, dr: 0 };
        if (state.keys.right) return { dc: 1, dr: 0 };
        return null;
    }

    function checkWin() {
        if (state.player.col !== state.goal.col || state.player.row !== state.goal.row) return;

        stop();

        const elapsedMs = performance.now() - state.startTime;
        const timeText = formatTime(elapsedMs);
        if (state.els.finalTime) state.els.finalTime.textContent = timeText;
        state.els.victoryOverlay?.classList.remove('hidden');
    }

    function resetTimer() {
        state.startTime = performance.now();
        updateTimeUI(0);
    }

    function updateTimer(nowTs) {
        if (!state.els.time) return;
        const elapsed = nowTs - state.startTime;
        updateTimeUI(elapsed);
    }

    function updateTimeUI(elapsedMs) {
        if (!state.els.time) return;
        state.els.time.textContent = formatTime(elapsedMs);
    }

    function formatTime(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    window.labyrinthGame = {
        init,
        start,
        stop,
        setKey,
        handleA
    };
})();
