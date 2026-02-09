(() => {
    // RogueBox State
    const state = {
        isPlaying: false,
        score: 0,
        highscore: 0,
        tileSize: 10,
        cols: 0,
        rows: 0,
        player: { col: 0, row: 0, el: null, moveCooldown: 0, moveInterval: 274 },
        monsterMoveInterval: 288,
        tapMoveMinInterval: 45,
        lastTapMoveAt: 0,
        explosionDelay: 500,
        explosionRadiusTiles: 1,
        minSpawnDistanceTiles: 6,
        coin: null,
        monsters: [],
        lastTime: 0,
        gameTime: 0,
        monstersEnabledAt: 2000,
        lastMonsterSpawnAt: 0,
        monsterSpawnMinInterval: 250,
        keys: { up: false, down: false, left: false, right: false },
        animationId: null,
        els: {
            gameArea: null,
            currentScore: null,
            highscore: null,
            gameOverScreen: null,
            finalScoreVal: null
        }
    };

    function init(elements) {
        state.els.gameArea = elements.gameArea;
        state.els.currentScore = elements.currentScore;
        state.els.highscore = elements.highscore;
        state.els.gameOverScreen = elements.gameOverScreen;
        state.els.finalScoreVal = elements.finalScoreVal;
    }

    async function start() {
        await initGame();
        state.isPlaying = true;
        state.lastTime = performance.now();
        state.animationId = requestAnimationFrame(gameLoop);
    }

    function stop() {
        state.isPlaying = false;
        if (state.animationId) cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }

    async function restart() {
        await initGame();
        state.isPlaying = true;
        state.lastTime = performance.now();
        state.animationId = requestAnimationFrame(gameLoop);
    }

    function setKey(key, value) {
        if (state.keys.hasOwnProperty(key)) {
            state.keys[key] = value;
        }
    }

    function handlePress(key) {
        if (state.gameTime < state.monstersEnabledAt) return;
        const now = performance.now();
        if (now - state.lastTapMoveAt < state.tapMoveMinInterval) return;
        state.lastTapMoveAt = now;

        const dir = keyToDir(key);
        if (!dir) return;
        tryMovePlayer(dir, true);
    }

    async function initGame() {
        // storageManager is assumed to be global
        state.highscore = await storageManager.getSetting('rb_highscore', 0);

        state.score = 0;
        state.gameTime = 0;
        state.lastTapMoveAt = 0;
        state.lastMonsterSpawnAt = 0;

        state.keys.up = false;
        state.keys.down = false;
        state.keys.left = false;
        state.keys.right = false;

        state.player.moveCooldown = 0;
        state.monsterMoveInterval = Math.max(20, Math.round(state.player.moveInterval * 1.05));

        state.coin = null;
        state.monsters = [];

        if (state.els.currentScore) state.els.currentScore.textContent = '0';
        if (state.els.highscore) state.els.highscore.textContent = String(state.highscore);
        if (state.els.finalScoreVal) state.els.finalScoreVal.textContent = '0';
        if (state.els.gameOverScreen) state.els.gameOverScreen.classList.add('hidden');

        if (state.els.gameArea) {
            state.els.gameArea.replaceChildren();

            const rect = state.els.gameArea.getBoundingClientRect();
            state.cols = Math.max(1, Math.floor(rect.width / state.tileSize));
            state.rows = Math.max(1, Math.floor(rect.height / state.tileSize));

            state.player.col = Math.floor(state.cols / 2);
            state.player.row = Math.floor(state.rows / 2);

            const playerEl = document.createElement('div');
            playerEl.id = 'rb-player';
            playerEl.className = 'rb-entity rb-player';
            state.els.gameArea.appendChild(playerEl);
            state.player.el = playerEl;
            positionEntity(playerEl, state.player.col, state.player.row);
        }
    }

    function gameLoop(timestamp) {
        if (!state.isPlaying) return;

        const dt = timestamp - state.lastTime;
        state.lastTime = timestamp;
        update(dt);
        state.animationId = requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        state.gameTime += dt;

        if (state.gameTime >= state.monstersEnabledAt) {
            if (!state.coin) spawnCoin();
        }

        movePlayer(dt);
        updateMonsters(dt);
        ensureDesiredMonsters();
        checkCoinPickup();
    }

    function movePlayer(dt) {
        state.player.moveCooldown -= dt;
        if (state.player.moveCooldown > 0) return;

        const dir = getPlayerDirection();
        if (!dir) return;
        tryMovePlayer(dir, false);
    }

    function tryMovePlayer(dir, force) {
        if (!force && state.player.moveCooldown > 0) return false;

        const nextCol = clamp(state.player.col + dir.dc, 0, state.cols - 1);
        const nextRow = clamp(state.player.row + dir.dr, 0, state.rows - 1);
        if (nextCol === state.player.col && nextRow === state.player.row) return false;

        state.player.col = nextCol;
        state.player.row = nextRow;
        positionEntity(state.player.el, state.player.col, state.player.row);
        state.player.moveCooldown = state.player.moveInterval;
        return true;
    }

    function keyToDir(key) {
        if (key === 'up') return { dc: 0, dr: -1 };
        if (key === 'down') return { dc: 0, dr: 1 };
        if (key === 'left') return { dc: -1, dr: 0 };
        if (key === 'right') return { dc: 1, dr: 0 };
        return null;
    }

    function getPlayerDirection() {
        if (state.keys.up) return { dc: 0, dr: -1 };
        if (state.keys.down) return { dc: 0, dr: 1 };
        if (state.keys.left) return { dc: -1, dr: 0 };
        if (state.keys.right) return { dc: 1, dr: 0 };
        return null;
    }

    function getDesiredMonsterCount() {
        return 1 + Math.floor(state.score / 5);
    }

    function ensureDesiredMonsters() {
        if (state.gameTime < state.monstersEnabledAt) return;

        const desired = getDesiredMonsterCount();
        if (state.monsters.length >= desired) return;

        const now = performance.now();
        if (now - state.lastMonsterSpawnAt < state.monsterSpawnMinInterval) return;

        const didSpawn = spawnMonster();
        if (didSpawn) state.lastMonsterSpawnAt = now;
    }

    function spawnCoin() {
        const spot = findFreeSpot({ avoidCoin: true, avoidMonsters: true, avoidPlayer: true, minDistanceFromPlayer: 0 });
        if (!spot) return;

        const coinEl = document.createElement('div');
        coinEl.className = 'rb-entity rb-coin';
        state.els.gameArea.appendChild(coinEl);
        positionEntity(coinEl, spot.col, spot.row);
        state.coin = { col: spot.col, row: spot.row, el: coinEl };
    }

    function spawnMonster() {
        const desired = getDesiredMonsterCount();
        if (state.monsters.length >= desired) return false;

        const spot = findFreeSpot({
            avoidCoin: true,
            avoidMonsters: true,
            avoidPlayer: false,
            minDistanceFromPlayer: state.minSpawnDistanceTiles
        });
        if (!spot) return false;

        // Determine monster type: purple monsters spawn after 10 points with 50% chance
        const isPurple = state.score >= 10 && Math.random() < 0.5;

        const monsterEl = document.createElement('div');
        monsterEl.className = isPurple ? 'rb-entity rb-monster rb-monster-purple' : 'rb-entity rb-monster';
        state.els.gameArea.appendChild(monsterEl);
        positionEntity(monsterEl, spot.col, spot.row);

        state.monsters.push({
            id: Date.now() + Math.random(),
            col: spot.col,
            row: spot.row,
            state: 'chasing',
            timer: 0,
            moveCooldown: 0,
            el: monsterEl,
            dead: false,
            isPurple: isPurple,
            // Purple monsters are 40% slower
            moveInterval: isPurple ? Math.round(state.monsterMoveInterval * 1.4) : state.monsterMoveInterval,
            // Purple monsters have double explosion radius
            explosionRadius: isPurple ? state.explosionRadiusTiles * 2 : state.explosionRadiusTiles
        });
        return true;
    }

    function updateMonsters(dt) {
        const pCol = state.player.col;
        const pRow = state.player.row;

        for (const m of state.monsters) {
            if (m.dead) continue;

            if (m.state === 'chasing') {
                if (tileDistance(pCol, pRow, m.col, m.row) <= 1) {
                    m.state = 'arming';
                    m.timer = state.explosionDelay;
                    m.el.classList.add('preparing');
                    continue;
                }

                m.moveCooldown -= dt;
                if (m.moveCooldown > 0) continue;
                m.moveCooldown = m.moveInterval || state.monsterMoveInterval;

                const step = getMonsterStep(pCol, pRow, m.col, m.row);
                const nextCol = clamp(m.col + step.dc, 0, state.cols - 1);
                const nextRow = clamp(m.row + step.dr, 0, state.rows - 1);

                if (nextCol === pCol && nextRow === pRow) continue;

                m.col = nextCol;
                m.row = nextRow;
                positionEntity(m.el, m.col, m.row);
            } else if (m.state === 'arming') {
                m.timer -= dt;
                if (m.timer <= 0) explodeMonster(m);
            }
        }

        state.monsters = state.monsters.filter(m => !m.dead);
    }

    function getMonsterStep(pCol, pRow, mCol, mRow) {
        const dx = pCol - mCol;
        const dy = pRow - mRow;

        if (Math.abs(dx) > Math.abs(dy)) return { dc: Math.sign(dx), dr: 0 };
        if (Math.abs(dy) > 0) return { dc: 0, dr: Math.sign(dy) };
        return { dc: 0, dr: 0 };
    }

    function explodeMonster(m) {
        m.el.classList.remove('preparing');

        // Use monster's individual explosion radius (default to global if not set)
        const r = m.explosionRadius !== undefined ? m.explosionRadius : state.explosionRadiusTiles;
        const size = (r * 2 + 1) * state.tileSize;

        const expEl = document.createElement('div');
        expEl.className = 'rb-explosion';
        // Add different class for purple monster explosions
        if (m.isPurple) expEl.classList.add('rb-explosion-purple');
        expEl.style.left = `${(m.col - r) * state.tileSize}px`;
        expEl.style.top = `${(m.row - r) * state.tileSize}px`;
        expEl.style.width = `${size}px`;
        expEl.style.height = `${size}px`;
        state.els.gameArea.appendChild(expEl);

        if (tileDistance(state.player.col, state.player.row, m.col, m.row) <= r) gameOver();

        m.el.remove();
        m.dead = true;

        setTimeout(() => expEl.remove(), 400);
    }

    function checkCoinPickup() {
        if (!state.coin) return;
        if (state.player.col !== state.coin.col || state.player.row !== state.coin.row) return;

        state.score += 1;
        state.els.currentScore.textContent = String(state.score);
        ensureDesiredMonsters();

        state.coin.el.remove();
        state.coin = null;
        spawnCoin();
    }

    function gameOver() {
        stop();

        if (state.score > state.highscore) {
            state.highscore = state.score;
            state.els.highscore.textContent = String(state.highscore);
            storageManager.setSetting('rb_highscore', state.highscore);
        }

        state.els.finalScoreVal.textContent = String(state.score);
        state.els.gameOverScreen.classList.remove('hidden');
    }

    function findFreeSpot({ avoidCoin, avoidMonsters, avoidPlayer, minDistanceFromPlayer }) {
        for (let tries = 0; tries < 300; tries++) {
            const col = Math.floor(Math.random() * state.cols);
            const row = Math.floor(Math.random() * state.rows);

            if (avoidPlayer && col === state.player.col && row === state.player.row) continue;

            if (minDistanceFromPlayer > 0 && tileDistance(state.player.col, state.player.row, col, row) < minDistanceFromPlayer) continue;

            if (avoidCoin && state.coin && col === state.coin.col && row === state.coin.row) continue;

            if (avoidMonsters && state.monsters.some(m => !m.dead && m.col === col && m.row === row)) continue;

            return { col, row };
        }
        return null;
    }

    function positionEntity(el, col, row) {
        el.style.left = `${col * state.tileSize}px`;
        el.style.top = `${row * state.tileSize}px`;
    }

    function tileDistance(aCol, aRow, bCol, bRow) {
        return Math.max(Math.abs(aCol - bCol), Math.abs(aRow - bRow));
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function getState() {
        return state;
    }

    window.rogueBoxGame = {
        init,
        start,
        stop,
        restart,
        setKey,
        handlePress,
        getState // Optional, for debugging or UI if needed
    };
})();
