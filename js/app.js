document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const introScreen = document.getElementById('intro-screen');
    const mainMenu = document.getElementById('main-menu');
    const gamesScreen = document.getElementById('games-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const infoScreen = document.getElementById('info-screen');
    const rogueBoxScreen = document.getElementById('roguebox-screen');
    const screenContent = document.getElementById('screen-content');
    
    const startBtn = document.querySelector('.pill-btn.start');
    const dPadUp = document.querySelector('.d-btn.up');
    const dPadDown = document.querySelector('.d-btn.down');
    const dPadLeft = document.querySelector('.d-btn.left');
    const dPadRight = document.querySelector('.d-btn.right');
    const aBtn = document.querySelector('.retro-btn.btn-a');
    const bBtn = document.querySelector('.retro-btn.btn-b');
    
    const pressStartText = document.getElementById('press-start-text');
    const logoSpans = document.querySelectorAll('.logo-text span');
    const pressStartSpans = document.querySelectorAll('.press-start span');

    // RogueBox Elements
    const rbGameArea = document.getElementById('rb-game-area');
    const rbCurrentScoreEl = document.getElementById('rb-current-score');
    const rbHighscoreEl = document.getElementById('rb-highscore');
    const rbGameOverScreen = document.getElementById('rb-game-over');
    const rbFinalScoreVal = document.getElementById('rb-final-score-val');

    // State
    const SCREENS = {
        INTRO: 'intro',
        MAIN_MENU: 'main-menu',
        GAMES: 'games',
        SETTINGS: 'settings',
        INFO: 'info',
        ROGUEBOX: 'roguebox'
    };

    let currentScreen = SCREENS.INTRO;
    let isAnimating = false;
    
    const selectionState = {
        [SCREENS.MAIN_MENU]: 0,
        [SCREENS.GAMES]: 0,
        [SCREENS.SETTINGS]: 0
    };

    // RogueBox State
    const rbState = {
        isPlaying: false,
        score: 0,
        highscore: 0,
        tileSize: 10,
        cols: 0,
        rows: 0,
        player: { col: 0, row: 0, moveCooldown: 0, moveInterval: 274 },
        monsterMoveInterval: 288,
        explosionDelay: 500,
        explosionRadiusTiles: 1,
        minSpawnDistanceTiles: 6,
        coin: null,
        monsters: [],
        lastTime: 0,
        gameTime: 0,
        nextMonsterSpawnAt: 0,
        monsterSpawnInterval: 8000,
        difficultyTimer: 0,
        keys: { up: false, down: false, left: false, right: false },
        animationId: null
    };

    // User Settings
    const settings = {
        sound: true,
        display: 'retro',
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };

    // Initialize
    async function init() {
        await storageManager.init();
        
        // Load settings from DB
        settings.sound = await storageManager.getSetting('sound', settings.sound);
        settings.display = await storageManager.getSetting('display', settings.display);
        settings.theme = await storageManager.getSetting('theme', settings.theme);

        applySettings();
        
        pressStartText.classList.add('blink');
        setupEventListeners();
    }

    function applySettings() {
        // Audio
        audioEngine.setEnabled(settings.sound);
        
        // Display Mode
        document.body.setAttribute('data-display', settings.display);
        
        // Theme (Dark/Light)
        document.body.setAttribute('data-theme', settings.theme);

        // Update UI text in settings menu
        updateSettingsUI();
    }

    function updateSettingsUI() {
        const soundItem = document.querySelector('[data-setting="sound"]');
        const displayItem = document.querySelector('[data-setting="display"]');
        const themeItem = document.querySelector('[data-setting="theme"]');

        if (soundItem) soundItem.textContent = `Ton: ${settings.sound ? 'AN' : 'AUS'}`;
        if (displayItem) displayItem.textContent = `Display: ${settings.display === 'retro' ? 'Retro' : 'Modern'}`;
        if (themeItem) themeItem.textContent = `Mode: ${settings.theme === 'light' ? 'Light' : 'Dark'}`;
    }

    function setupEventListeners() {
        // Init Audio on first user interaction
        const initAudio = () => {
            audioEngine.init();
            audioEngine.startMusic();
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);

        startBtn.addEventListener('click', () => {
            if (currentScreen === SCREENS.INTRO && !isAnimating) {
                audioEngine.playClickMenu();
                startIntroAnimation();
            } else if (currentScreen === SCREENS.ROGUEBOX) {
                stopRogueBox();
                setRogueBoxMode(false);
                navigateBack(SCREENS.GAMES);
            }
        });

        // D-Pad Navigation (Click for menus)
        const handleDPadClick = (direction) => {
            if (currentScreen !== SCREENS.ROGUEBOX) {
                audioEngine.playClickNav();
                handleNavigation(direction);
            }
        };

        dPadUp.addEventListener('click', () => handleDPadClick('up'));
        dPadDown.addEventListener('click', () => handleDPadClick('down'));
        
        // D-Pad Continuous Input (For Game)
        const setKey = (key, value) => {
            if (currentScreen === SCREENS.ROGUEBOX) {
                rbState.keys[key] = value;
            }
        };

        const bindGameControls = (btn, key) => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                setKey(key, true);
            });
            btn.addEventListener('pointerup', (e) => {
                e.preventDefault();
                setKey(key, false);
            });
            btn.addEventListener('pointerleave', (e) => {
                setKey(key, false);
            });
            window.addEventListener('keydown', (e) => {
                if (currentScreen === SCREENS.ROGUEBOX) {
                    if (e.key === 'ArrowUp' && key === 'up') setKey('up', true);
                    if (e.key === 'ArrowDown' && key === 'down') setKey('down', true);
                    if (e.key === 'ArrowLeft' && key === 'left') setKey('left', true);
                    if (e.key === 'ArrowRight' && key === 'right') setKey('right', true);
                }
            });
            window.addEventListener('keyup', (e) => {
                if (currentScreen === SCREENS.ROGUEBOX) {
                    if (e.key === 'ArrowUp' && key === 'up') setKey('up', false);
                    if (e.key === 'ArrowDown' && key === 'down') setKey('down', false);
                    if (e.key === 'ArrowLeft' && key === 'left') setKey('left', false);
                    if (e.key === 'ArrowRight' && key === 'right') setKey('right', false);
                }
            });
        };

        bindGameControls(dPadUp, 'up');
        bindGameControls(dPadDown, 'down');
        bindGameControls(dPadLeft, 'left');
        bindGameControls(dPadRight, 'right');

        aBtn.addEventListener('click', async () => {
            if (currentScreen === SCREENS.ROGUEBOX) {
                if (!rbState.isPlaying && !rbGameOverScreen.classList.contains('hidden')) {
                    await restartRogueBox();
                }
            } else {
                audioEngine.playClickA();
                handleSelect();
            }
        });

        bBtn.addEventListener('click', () => {
            audioEngine.playClickB();
            handleBack();
        });
    }

    function handleNavigation(direction) {
        if (isAnimating || currentScreen === SCREENS.INTRO || currentScreen === SCREENS.INFO) return;

        const currentList = getCurrentListItems();
        if (!currentList || currentList.length === 0) return;

        let index = selectionState[currentScreen];
        currentList[index].classList.remove('active');

        if (direction === 'up') {
            index = (index > 0) ? index - 1 : currentList.length - 1;
        } else {
            index = (index < currentList.length - 1) ? index + 1 : 0;
        }

        selectionState[currentScreen] = index;
        const selectedElement = currentList[index];
        selectedElement.classList.add('active');
        selectedElement.scrollIntoView({ block: 'center', behavior: 'auto' });
    }

    async function handleSelect() {
        if (isAnimating) return;

        if (currentScreen === SCREENS.MAIN_MENU) {
            const currentList = getCurrentListItems();
            const selectedItem = currentList[selectionState[currentScreen]];
            navigateTo(selectedItem.dataset.target);
        
        } else if (currentScreen === SCREENS.SETTINGS) {
            const currentList = getCurrentListItems();
            const selectedItem = currentList[selectionState[currentScreen]];
            const settingType = selectedItem.dataset.setting;

            if (settingType === 'sound') {
                settings.sound = !settings.sound;
                await storageManager.setSetting('sound', settings.sound);
            } else if (settingType === 'display') {
                settings.display = settings.display === 'retro' ? 'modern' : 'retro';
                await storageManager.setSetting('display', settings.display);
            } else if (settingType === 'theme') {
                settings.theme = settings.theme === 'light' ? 'dark' : 'light';
                await storageManager.setSetting('theme', settings.theme);
            }
            applySettings();

        } else if (currentScreen === SCREENS.GAMES) {
            const currentList = getCurrentListItems();
            const selectedGame = currentList[selectionState[currentScreen]];
            const gameId = selectedGame.dataset.id;

            if (gameId === "1") {
                startRogueBox();
            } else {
                alert(`Starting ${selectedGame.textContent}...`);
            }
        }
    }

    function setRogueBoxMode(enabled) {
        if (enabled) screenContent.classList.add('no-padding');
        else screenContent.classList.remove('no-padding');
    }

    async function startRogueBox() {
        setRogueBoxMode(true);
        navigateTo(SCREENS.ROGUEBOX);
        await initRogueBox();
        rbState.isPlaying = true;
        rbState.lastTime = performance.now();
        rbState.animationId = requestAnimationFrame(rbGameLoop);
    }

    async function restartRogueBox() {
        await initRogueBox();
        rbState.isPlaying = true;
        rbState.lastTime = performance.now();
        rbState.animationId = requestAnimationFrame(rbGameLoop);
    }

    function stopRogueBox() {
        rbState.isPlaying = false;
        if (rbState.animationId) cancelAnimationFrame(rbState.animationId);
        rbState.animationId = null;
    }

    async function initRogueBox() {
        rbState.highscore = await storageManager.getSetting('rb_highscore', 0);

        rbState.score = 0;
        rbState.gameTime = 0;
        rbState.difficultyTimer = 0;
        rbState.nextMonsterSpawnAt = 0;
        rbState.monsterSpawnInterval = 8000;

        rbState.keys.up = false;
        rbState.keys.down = false;
        rbState.keys.left = false;
        rbState.keys.right = false;

        rbState.player.moveCooldown = 0;
        rbState.monsterMoveInterval = Math.max(20, Math.round(rbState.player.moveInterval * 1.05));

        rbState.coin = null;
        rbState.monsters = [];

        rbCurrentScoreEl.textContent = '0';
        rbHighscoreEl.textContent = String(rbState.highscore);
        rbFinalScoreVal.textContent = '0';
        rbGameOverScreen.classList.add('hidden');

        rbGameArea.replaceChildren();

        const rect = rbGameArea.getBoundingClientRect();
        rbState.cols = Math.max(1, Math.floor(rect.width / rbState.tileSize));
        rbState.rows = Math.max(1, Math.floor(rect.height / rbState.tileSize));

        rbState.player.col = Math.floor(rbState.cols / 2);
        rbState.player.row = Math.floor(rbState.rows / 2);

        const playerEl = document.createElement('div');
        playerEl.id = 'rb-player';
        playerEl.className = 'rb-entity rb-player';
        rbGameArea.appendChild(playerEl);
        rbState.player.el = playerEl;
        positionEntity(playerEl, rbState.player.col, rbState.player.row);
    }

    function rbGameLoop(timestamp) {
        if (!rbState.isPlaying) return;

        const dt = timestamp - rbState.lastTime;
        rbState.lastTime = timestamp;
        updateRogueBox(dt);
        rbState.animationId = requestAnimationFrame(rbGameLoop);
    }

    function updateRogueBox(dt) {
        rbState.gameTime += dt;
        rbState.difficultyTimer += dt;

        if (rbState.difficultyTimer >= 20000) {
            rbState.difficultyTimer = 0;
            if (rbState.monsterSpawnInterval > 2000) rbState.monsterSpawnInterval -= 1000;
        }

        if (rbState.gameTime >= 2000) {
            if (!rbState.coin) spawnCoin();

            if (rbState.nextMonsterSpawnAt === 0) {
                spawnMonster();
                rbState.nextMonsterSpawnAt = rbState.gameTime + rbState.monsterSpawnInterval;
            } else if (rbState.gameTime >= rbState.nextMonsterSpawnAt) {
                spawnMonster();
                rbState.nextMonsterSpawnAt = rbState.gameTime + rbState.monsterSpawnInterval;
            }
        }

        movePlayer(dt);
        updateMonsters(dt);
        checkCoinPickup();
    }

    function movePlayer(dt) {
        rbState.player.moveCooldown -= dt;
        if (rbState.player.moveCooldown > 0) return;

        const dir = getPlayerDirection();
        if (!dir) return;

        const nextCol = clamp(rbState.player.col + dir.dc, 0, rbState.cols - 1);
        const nextRow = clamp(rbState.player.row + dir.dr, 0, rbState.rows - 1);
        if (nextCol === rbState.player.col && nextRow === rbState.player.row) return;

        rbState.player.col = nextCol;
        rbState.player.row = nextRow;
        positionEntity(rbState.player.el, rbState.player.col, rbState.player.row);
        rbState.player.moveCooldown = rbState.player.moveInterval;
    }

    function getPlayerDirection() {
        if (rbState.keys.up) return { dc: 0, dr: -1 };
        if (rbState.keys.down) return { dc: 0, dr: 1 };
        if (rbState.keys.left) return { dc: -1, dr: 0 };
        if (rbState.keys.right) return { dc: 1, dr: 0 };
        return null;
    }

    function spawnCoin() {
        const spot = findFreeSpot({ avoidCoin: true, avoidMonsters: true, avoidPlayer: true, minDistanceFromPlayer: 0 });
        if (!spot) return;

        const coinEl = document.createElement('div');
        coinEl.className = 'rb-entity rb-coin';
        rbGameArea.appendChild(coinEl);
        positionEntity(coinEl, spot.col, spot.row);
        rbState.coin = { col: spot.col, row: spot.row, el: coinEl };
    }

    function spawnMonster() {
        const spot = findFreeSpot({
            avoidCoin: true,
            avoidMonsters: true,
            avoidPlayer: false,
            minDistanceFromPlayer: rbState.minSpawnDistanceTiles
        });
        if (!spot) return;

        const monsterEl = document.createElement('div');
        monsterEl.className = 'rb-entity rb-monster';
        rbGameArea.appendChild(monsterEl);
        positionEntity(monsterEl, spot.col, spot.row);

        rbState.monsters.push({
            id: Date.now() + Math.random(),
            col: spot.col,
            row: spot.row,
            state: 'chasing',
            timer: 0,
            moveCooldown: 0,
            el: monsterEl,
            dead: false
        });
    }

    function updateMonsters(dt) {
        const pCol = rbState.player.col;
        const pRow = rbState.player.row;

        for (const m of rbState.monsters) {
            if (m.dead) continue;

            if (m.state === 'chasing') {
                if (tileDistance(pCol, pRow, m.col, m.row) <= 1) {
                    m.state = 'arming';
                    m.timer = rbState.explosionDelay;
                    m.el.classList.add('preparing');
                    continue;
                }

                m.moveCooldown -= dt;
                if (m.moveCooldown > 0) continue;
                m.moveCooldown = rbState.monsterMoveInterval;

                const step = getMonsterStep(pCol, pRow, m.col, m.row);
                const nextCol = clamp(m.col + step.dc, 0, rbState.cols - 1);
                const nextRow = clamp(m.row + step.dr, 0, rbState.rows - 1);

                if (nextCol === pCol && nextRow === pRow) continue;

                m.col = nextCol;
                m.row = nextRow;
                positionEntity(m.el, m.col, m.row);
            } else if (m.state === 'arming') {
                m.timer -= dt;
                if (m.timer <= 0) explodeMonster(m);
            }
        }

        rbState.monsters = rbState.monsters.filter(m => !m.dead);
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

        const r = rbState.explosionRadiusTiles;
        const size = (r * 2 + 1) * rbState.tileSize;

        const expEl = document.createElement('div');
        expEl.className = 'rb-explosion';
        expEl.style.left = `${(m.col - r) * rbState.tileSize}px`;
        expEl.style.top = `${(m.row - r) * rbState.tileSize}px`;
        expEl.style.width = `${size}px`;
        expEl.style.height = `${size}px`;
        rbGameArea.appendChild(expEl);

        if (tileDistance(rbState.player.col, rbState.player.row, m.col, m.row) <= r) gameOver();

        m.el.remove();
        m.dead = true;

        setTimeout(() => expEl.remove(), 400);
    }

    function checkCoinPickup() {
        if (!rbState.coin) return;
        if (rbState.player.col !== rbState.coin.col || rbState.player.row !== rbState.coin.row) return;

        rbState.score += 1;
        rbCurrentScoreEl.textContent = String(rbState.score);

        if (rbState.score % 5 === 0) spawnMonster();

        rbState.coin.el.remove();
        rbState.coin = null;
        spawnCoin();
    }

    function gameOver() {
        stopRogueBox();

        if (rbState.score > rbState.highscore) {
            rbState.highscore = rbState.score;
            rbHighscoreEl.textContent = String(rbState.highscore);
            storageManager.setSetting('rb_highscore', rbState.highscore);
        }

        rbFinalScoreVal.textContent = String(rbState.score);
        rbGameOverScreen.classList.remove('hidden');
    }

    function findFreeSpot({ avoidCoin, avoidMonsters, avoidPlayer, minDistanceFromPlayer }) {
        for (let tries = 0; tries < 300; tries++) {
            const col = Math.floor(Math.random() * rbState.cols);
            const row = Math.floor(Math.random() * rbState.rows);

            if (avoidPlayer && col === rbState.player.col && row === rbState.player.row) continue;

            if (minDistanceFromPlayer > 0 && tileDistance(rbState.player.col, rbState.player.row, col, row) < minDistanceFromPlayer) continue;

            if (avoidCoin && rbState.coin && col === rbState.coin.col && row === rbState.coin.row) continue;

            if (avoidMonsters && rbState.monsters.some(m => !m.dead && m.col === col && m.row === row)) continue;

            return { col, row };
        }
        return null;
    }

    function positionEntity(el, col, row) {
        el.style.left = `${col * rbState.tileSize}px`;
        el.style.top = `${row * rbState.tileSize}px`;
    }

    function tileDistance(aCol, aRow, bCol, bRow) {
        return Math.max(Math.abs(aCol - bCol), Math.abs(aRow - bRow));
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function handleBack() {
        if (isAnimating) return;
        if (currentScreen === SCREENS.ROGUEBOX) return;
        if (currentScreen !== SCREENS.INTRO && currentScreen !== SCREENS.MAIN_MENU) {
            navigateBack(SCREENS.MAIN_MENU);
        }
    }

    function navigateTo(targetScreen) {
        const resolvedTarget = SCREENS[targetScreen.toUpperCase()] || targetScreen;
        const currentEl = getScreenElement(currentScreen);
        const nextEl = getScreenElement(resolvedTarget);
        if (currentScreen === SCREENS.ROGUEBOX && resolvedTarget !== SCREENS.ROGUEBOX) setRogueBoxMode(false);
        if (resolvedTarget === SCREENS.ROGUEBOX) setRogueBoxMode(true);

        currentEl.classList.add('hidden');
        nextEl.classList.remove('hidden');
        nextEl.classList.remove('slide-down', 'slide-in-right');
        void nextEl.offsetWidth; 
        nextEl.classList.add('slide-in-right');
        currentScreen = resolvedTarget;
    }

    function navigateBack(targetScreen) {
        const currentEl = getScreenElement(currentScreen);
        const nextEl = getScreenElement(targetScreen);
        if (currentScreen === SCREENS.ROGUEBOX && targetScreen !== SCREENS.ROGUEBOX) setRogueBoxMode(false);

        currentEl.classList.add('hidden');
        nextEl.classList.remove('hidden');
        nextEl.classList.remove('slide-down', 'slide-in-right');
        void nextEl.offsetWidth; 
        nextEl.classList.add('slide-down');
        currentScreen = targetScreen;
    }

    function getScreenElement(screenName) {
        switch (screenName) {
            case SCREENS.INTRO: return introScreen;
            case SCREENS.MAIN_MENU: return mainMenu;
            case SCREENS.GAMES: return gamesScreen;
            case SCREENS.SETTINGS: return settingsScreen;
            case SCREENS.INFO: return infoScreen;
            case SCREENS.ROGUEBOX: return rogueBoxScreen;
            default: return null;
        }
    }

    function getCurrentListItems() {
        if (currentScreen === SCREENS.MAIN_MENU) return document.querySelectorAll('#main-menu-list .game-item');
        if (currentScreen === SCREENS.GAMES) return document.querySelectorAll('#game-list .game-item');
        if (currentScreen === SCREENS.SETTINGS) return document.querySelectorAll('#settings-list .game-item');
        return null;
    }

    function startIntroAnimation() {
        isAnimating = true;
        pressStartText.classList.remove('blink');

        const allSpans = [...logoSpans, ...pressStartSpans];
        shuffleArray(allSpans);

        allSpans.forEach((span) => {
            const delay = Math.random() * 0.8; // Halved delay spread
            span.style.animationDelay = `${delay}s`;
            span.classList.add('falling');
        });

        // Animation duration 3.5s -> now total wait ~2.0s for snappier feel
        setTimeout(() => {
            isAnimating = false;
            introScreen.classList.add('hidden');
            mainMenu.classList.remove('hidden');
            mainMenu.classList.add('slide-down');
            currentScreen = SCREENS.MAIN_MENU;
        }, 2000); 
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    init();
});
