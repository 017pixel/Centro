document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const introScreen = document.getElementById('intro-screen');
    const mainMenu = document.getElementById('main-menu');
    const gamesScreen = document.getElementById('games-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const infoScreen = document.getElementById('info-screen');
    const rogueBoxScreen = document.getElementById('roguebox-screen');
    const labyrinthScreen = document.getElementById('labyrinth-screen');
    const drawItScreen = document.getElementById('drawit-screen');
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

    // Labyrinth Elements
    const lbGameArea = document.getElementById('lb-game-area');
    const lbTimeEl = document.getElementById('lb-time');
    const lbVictoryOverlay = document.getElementById('lb-victory');
    const lbFinalTimeVal = document.getElementById('lb-final-time-val');

    // DrawIt Elements
    const diGameArea = document.getElementById('di-game-area');
    const diTimeEl = document.getElementById('di-time');
    const diModeEl = document.getElementById('di-mode');
    const diObjectEl = document.getElementById('di-object-name');
    const diResultOverlay = document.getElementById('di-result');
    const diResultMsg = document.getElementById('di-result-msg');
    const diResultDetails = document.getElementById('di-result-details');

    // Settings: Color Picker Elements
    const colorPicker = document.getElementById('color-picker');
    const colorPickerList = document.getElementById('color-picker-list');

    // State
    const SCREENS = {
        INTRO: 'intro',
        MAIN_MENU: 'main-menu',
        GAMES: 'games',
        SETTINGS: 'settings',
        INFO: 'info',
        ROGUEBOX: 'roguebox',
        LABYRINTH: 'labyrinth',
        DRAWIT: 'drawit'
    };

    let currentScreen = SCREENS.INTRO;
    let isAnimating = false;
    let isColorPickerOpen = false;

    const selectionState = {
        [SCREENS.MAIN_MENU]: 0,
        [SCREENS.GAMES]: 0,
        [SCREENS.SETTINGS]: 0,
        colorPicker: 0
    };



    // User Settings
    const settings = {
        sound: true,
        display: 'retro',
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        consoleColor: null
    };

    const CONSOLE_COLORS = [
        { id: 'standard', label: 'Standard', value: null },
        { id: 'blush', label: 'Blush', value: 'rgba(247, 183, 215, 0.9)' },
        { id: 'mint', label: 'Mint', value: 'rgba(168, 230, 207, 0.9)' },
        { id: 'lavender', label: 'Lavendel', value: 'rgba(201, 160, 220, 0.9)' },
        { id: 'babyblue', label: 'Babyblau', value: 'rgba(178, 223, 252, 0.9)' },
        { id: 'butteryellow', label: 'Buttergelb', value: 'rgba(255, 255, 204, 0.9)' },
        { id: 'peach', label: 'Pfirsich', value: 'rgba(255, 211, 182, 0.9)' },
        { id: 'mauve', label: 'Mauve', value: 'rgba(192, 164, 180, 0.9)' },
        { id: 'vanilla', label: 'Vanille', value: 'rgba(255, 246, 200, 0.9)' },
        { id: 'denim', label: 'Denim', value: 'rgba(164, 192, 230, 0.9)' },
        { id: 'mistlavender', label: 'Nebel', value: 'rgba(230, 224, 255, 0.9)' }
    ];

    // Initialize
    async function init() {
        await storageManager.init();

        // Load settings from DB
        settings.sound = await storageManager.getSetting('sound', settings.sound);
        settings.display = await storageManager.getSetting('display', settings.display);
        settings.theme = await storageManager.getSetting('theme', settings.theme);
        settings.consoleColor = await storageManager.getSetting('consoleColor', settings.consoleColor);

        applySettings();

        if (window.labyrinthGame?.init) {
            window.labyrinthGame.init({
                screenEl: labyrinthScreen,
                gameAreaEl: lbGameArea,
                timeEl: lbTimeEl,
                victoryOverlayEl: lbVictoryOverlay,
                finalTimeEl: lbFinalTimeVal
            });
        }

        if (window.rogueBoxGame?.init) {
            window.rogueBoxGame.init({
                gameArea: rbGameArea,
                currentScore: rbCurrentScoreEl,
                highscore: rbHighscoreEl,
                gameOverScreen: rbGameOverScreen,
                finalScoreVal: rbFinalScoreVal
            });
        }

        if (window.drawItGame?.init) {
            window.drawItGame.init({
                gameAreaEl: diGameArea,
                timeEl: diTimeEl,
                modeEl: diModeEl,
                objectEl: diObjectEl,
                resultOverlayEl: diResultOverlay,
                resultMsgEl: diResultMsg,
                resultDetailsEl: diResultDetails
            });
        }

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

        applyConsoleColor();

        // Update UI text in settings menu
        updateSettingsUI();
    }

    function applyConsoleColor() {
        const selected = CONSOLE_COLORS.find(c => c.id === (settings.consoleColor || 'standard'));
        if (!selected || !selected.value) {
            document.documentElement.style.removeProperty('--console-bg');
            document.body.classList.remove('custom-color');
            return;
        }
        document.documentElement.style.setProperty('--console-bg', selected.value);
        document.body.classList.add('custom-color');
    }

    function updateSettingsUI() {
        const soundItem = document.querySelector('[data-setting="sound"]');
        const displayItem = document.querySelector('[data-setting="display"]');
        const themeItem = document.querySelector('[data-setting="theme"]');
        const colorItem = document.querySelector('[data-setting="color"]');

        if (soundItem) soundItem.textContent = `Ton: ${settings.sound ? 'AN' : 'AUS'}`;
        if (displayItem) displayItem.textContent = `Display: ${settings.display === 'retro' ? 'Retro' : 'Modern'}`;
        if (themeItem) themeItem.textContent = `Mode: ${settings.theme === 'light' ? 'Light' : 'Dark'}`;
        if (colorItem) {
            const label = CONSOLE_COLORS.find(c => c.id === (settings.consoleColor || 'standard'))?.label || 'Standard';
            colorItem.textContent = `Farbe: ${label}`;
        }

        if (colorPickerList) {
            const items = colorPickerList.querySelectorAll('.color-item');
            for (const el of items) {
                const id = el.dataset.color;
                const col = CONSOLE_COLORS.find(c => c.id === id);
                const swatch = el.querySelector('.color-swatch');
                if (swatch && col) {
                    if (col.id === 'standard') {
                        // Use current theme's default for standard swatch
                        swatch.style.setProperty('--swatch', settings.theme === 'dark' ? 'rgba(44, 44, 44, 0.85)' : 'rgba(224, 221, 209, 0.9)');
                    } else {
                        swatch.style.setProperty('--swatch', col.value);
                    }
                }
            }
        }
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

        const isGameScreen = () => currentScreen === SCREENS.ROGUEBOX || currentScreen === SCREENS.LABYRINTH || currentScreen === SCREENS.DRAWIT;

        startBtn.addEventListener('click', () => {
            if (currentScreen === SCREENS.INTRO && !isAnimating) {
                audioEngine.playClickMenu();
                startIntroAnimation();
            } else if (currentScreen === SCREENS.ROGUEBOX) {
                stopRogueBox();
                setGameMode(false);
                navigateBack(SCREENS.GAMES);
            } else if (currentScreen === SCREENS.LABYRINTH) {
                stopLabyrinth();
                setGameMode(false);
                navigateBack(SCREENS.GAMES);
            } else if (currentScreen === SCREENS.DRAWIT) {
                stopDrawIt();
                setGameMode(false);
                navigateBack(SCREENS.GAMES);
            }
        });

        // D-Pad Navigation (Click for menus)
        const handleDPadClick = (direction) => {
            if (currentScreen !== SCREENS.ROGUEBOX && currentScreen !== SCREENS.LABYRINTH) {
                audioEngine.playClickNav();
                handleNavigation(direction);
            }
        };

        dPadUp.addEventListener('click', () => handleDPadClick('up'));
        dPadDown.addEventListener('click', () => handleDPadClick('down'));

        // D-Pad Continuous Input (For Game)
        const setKey = (key, value) => {
            if (currentScreen === SCREENS.ROGUEBOX && window.rogueBoxGame?.setKey) window.rogueBoxGame.setKey(key, value);
            if (currentScreen === SCREENS.LABYRINTH && window.labyrinthGame?.setKey) window.labyrinthGame.setKey(key, value);
            if (currentScreen === SCREENS.DRAWIT && window.drawItGame?.setKey) window.drawItGame.setKey(key, value);
        };

        const bindGameControls = (btn, key) => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (currentScreen === SCREENS.ROGUEBOX) {
                    const wasDown = (window.rogueBoxGame) ? window.rogueBoxGame.getState().keys[key] : false;
                    setKey(key, true);
                    if (!wasDown && window.rogueBoxGame?.handlePress) window.rogueBoxGame.handlePress(key);
                    return;
                }
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
                if (currentScreen === SCREENS.ROGUEBOX || currentScreen === SCREENS.LABYRINTH || currentScreen === SCREENS.DRAWIT) {
                    if (e.key === 'ArrowUp' && key === 'up') {
                        const wasDown = (currentScreen === SCREENS.ROGUEBOX && window.rogueBoxGame) ? window.rogueBoxGame.getState().keys.up : false;
                        setKey('up', true);
                        if (currentScreen === SCREENS.ROGUEBOX && !wasDown && !e.repeat && window.rogueBoxGame?.handlePress) window.rogueBoxGame.handlePress('up');
                    }
                    if (e.key === 'ArrowDown' && key === 'down') {
                        const wasDown = (currentScreen === SCREENS.ROGUEBOX && window.rogueBoxGame) ? window.rogueBoxGame.getState().keys.down : false;
                        setKey('down', true);
                        if (currentScreen === SCREENS.ROGUEBOX && !wasDown && !e.repeat && window.rogueBoxGame?.handlePress) window.rogueBoxGame.handlePress('down');
                    }
                    if (e.key === 'ArrowLeft' && key === 'left') {
                        const wasDown = (currentScreen === SCREENS.ROGUEBOX && window.rogueBoxGame) ? window.rogueBoxGame.getState().keys.left : false;
                        setKey('left', true);
                        if (currentScreen === SCREENS.ROGUEBOX && !wasDown && !e.repeat && window.rogueBoxGame?.handlePress) window.rogueBoxGame.handlePress('left');
                    }
                    if (e.key === 'ArrowRight' && key === 'right') {
                        const wasDown = (currentScreen === SCREENS.ROGUEBOX && window.rogueBoxGame) ? window.rogueBoxGame.getState().keys.right : false;
                        setKey('right', true);
                        if (currentScreen === SCREENS.ROGUEBOX && !wasDown && !e.repeat && window.rogueBoxGame?.handlePress) window.rogueBoxGame.handlePress('right');
                    }
                }
            });
            window.addEventListener('keyup', (e) => {
                if (currentScreen === SCREENS.ROGUEBOX || currentScreen === SCREENS.LABYRINTH || currentScreen === SCREENS.DRAWIT) {
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

        window.addEventListener('keydown', async (e) => {
            if (isAnimating) return;
            if (isGameScreen()) return;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                audioEngine.playClickNav();
                handleNavigation('up');
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                audioEngine.playClickNav();
                handleNavigation('down');
                return;
            }
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                audioEngine.playClickA();
                await handleSelect();
                return;
            }
            if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                audioEngine.playClickB();
                handleBack();
                return;
            }
        }, { passive: false });

        const mapMovementKey = (key) => {
            const k = String(key).toLowerCase();
            if (k === 'w') return 'up';
            if (k === 's') return 'down';
            if (k === 'a') return 'left';
            if (k === 'd') return 'right';
            return null;
        };

        window.addEventListener('keydown', (e) => {
            if (currentScreen !== SCREENS.ROGUEBOX && currentScreen !== SCREENS.LABYRINTH && currentScreen !== SCREENS.DRAWIT) return;
            const mapped = mapMovementKey(e.key);
            if (!mapped) return;
            e.preventDefault();

            const wasDown = (currentScreen === SCREENS.ROGUEBOX && window.rogueBoxGame) ? window.rogueBoxGame.getState().keys[mapped] : false;
            setKey(mapped, true);
            if (currentScreen === SCREENS.ROGUEBOX && !wasDown && !e.repeat && window.rogueBoxGame?.handlePress) window.rogueBoxGame.handlePress(mapped);
        }, { passive: false });

        window.addEventListener('keyup', (e) => {
            if (currentScreen !== SCREENS.ROGUEBOX && currentScreen !== SCREENS.LABYRINTH && currentScreen !== SCREENS.DRAWIT) return;
            const mapped = mapMovementKey(e.key);
            if (!mapped) return;
            setKey(mapped, false);
        });

        aBtn.addEventListener('click', async () => {
            if (currentScreen === SCREENS.ROGUEBOX) {
                if (window.rogueBoxGame && !window.rogueBoxGame.getState().isPlaying && !rbGameOverScreen.classList.contains('hidden')) {
                    await restartRogueBox();
                }
            } else if (currentScreen === SCREENS.LABYRINTH) {
                window.labyrinthGame?.handleA?.();
            } else if (currentScreen === SCREENS.DRAWIT) {
                // A button switches to draw mode or restarts if game over
                if (window.drawItGame && !window.drawItGame.getState().isPlaying && !diResultOverlay.classList.contains('hidden')) {
                    await restartDrawIt();
                } else {
                    window.drawItGame?.handleA?.();
                }
            } else {
                audioEngine.playClickA();
                handleSelect();
            }
        });

        bBtn.addEventListener('click', () => {
            if (currentScreen === SCREENS.DRAWIT && window.drawItGame?.getState().isPlaying) {
                // B button switches to erase mode during DrawIt
                window.drawItGame?.handleB?.();
            } else {
                audioEngine.playClickB();
                handleBack();
            }
        });
    }

    function handleNavigation(direction) {
        if (isAnimating || currentScreen === SCREENS.INTRO || currentScreen === SCREENS.INFO) return;

        if (currentScreen === SCREENS.SETTINGS && isColorPickerOpen) {
            const items = colorPickerList ? [...colorPickerList.querySelectorAll('.game-item')] : [];
            if (items.length === 0) return;

            let index = selectionState.colorPicker;
            items[index]?.classList.remove('active');

            if (direction === 'up') {
                index = (index > 0) ? index - 1 : items.length - 1;
            } else {
                index = (index < items.length - 1) ? index + 1 : 0;
            }

            selectionState.colorPicker = index;
            const selected = items[index];
            selected.classList.add('active');
            selected.scrollIntoView({ block: 'center', behavior: 'auto' });
            return;
        }

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
            if (isColorPickerOpen) {
                const items = colorPickerList ? [...colorPickerList.querySelectorAll('.game-item')] : [];
                const selected = items[selectionState.colorPicker];
                if (!selected) return;

                settings.consoleColor = selected.dataset.color || null;
                await storageManager.setSetting('consoleColor', settings.consoleColor);
                applySettings();
                return;
            }

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
            } else if (settingType === 'color') {
                openColorPicker();
                return;
            }
            applySettings();

        } else if (currentScreen === SCREENS.GAMES) {
            const currentList = getCurrentListItems();
            const selectedGame = currentList[selectionState[currentScreen]];
            const gameId = selectedGame.dataset.id;

            if (gameId === "1") {
                startRogueBox();
            } else if (gameId === "2") {
                startLabyrinth();
            } else if (gameId === "3") {
                startDrawIt();
            } else {
                alert(`Starting ${selectedGame.textContent}...`);
            }
        }
    }

    function setGameMode(enabled) {
        if (enabled) screenContent.classList.add('no-padding');
        else screenContent.classList.remove('no-padding');
    }

    async function startRogueBox() {
        setGameMode(true);
        navigateTo(SCREENS.ROGUEBOX);
        if (window.rogueBoxGame?.start) await window.rogueBoxGame.start();
    }

    async function restartRogueBox() {
        if (window.rogueBoxGame?.restart) await window.rogueBoxGame.restart();
    }

    function stopRogueBox() {
        if (window.rogueBoxGame?.stop) window.rogueBoxGame.stop();
    }

    async function startDrawIt() {
        setGameMode(true);
        navigateTo(SCREENS.DRAWIT);
        if (window.drawItGame?.start) await window.drawItGame.start();
    }

    async function restartDrawIt() {
        if (window.drawItGame?.restart) await window.drawItGame.restart();
    }

    function stopDrawIt() {
        if (window.drawItGame?.stop) window.drawItGame.stop();
    }



    function handleBack() {
        if (isAnimating) return;
        if (currentScreen === SCREENS.SETTINGS && isColorPickerOpen) {
            closeColorPicker();
            return;
        }
        if (currentScreen === SCREENS.ROGUEBOX) {
            stopRogueBox();
            setGameMode(false);
            navigateBack(SCREENS.GAMES);
            return;
        }
        if (currentScreen === SCREENS.LABYRINTH) {
            stopLabyrinth();
            setGameMode(false);
            navigateBack(SCREENS.GAMES);
            return;
        }
        if (currentScreen === SCREENS.DRAWIT) {
            stopDrawIt();
            setGameMode(false);
            navigateBack(SCREENS.GAMES);
            return;
        }
        if (currentScreen !== SCREENS.INTRO && currentScreen !== SCREENS.MAIN_MENU) {
            navigateBack(SCREENS.MAIN_MENU);
        }
    }

    function navigateTo(targetScreen) {
        const resolvedTarget = SCREENS[targetScreen.toUpperCase()] || targetScreen;
        const currentEl = getScreenElement(currentScreen);
        const nextEl = getScreenElement(resolvedTarget);
        if (currentScreen === SCREENS.SETTINGS && isColorPickerOpen) closeColorPicker();
        const leavingGame = currentScreen === SCREENS.ROGUEBOX || currentScreen === SCREENS.LABYRINTH || currentScreen === SCREENS.DRAWIT;
        const enteringGame = resolvedTarget === SCREENS.ROGUEBOX || resolvedTarget === SCREENS.LABYRINTH || resolvedTarget === SCREENS.DRAWIT;
        if (leavingGame && !enteringGame) setGameMode(false);
        if (enteringGame) setGameMode(true);

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
        if (currentScreen === SCREENS.SETTINGS && isColorPickerOpen) closeColorPicker();
        const leavingGame = currentScreen === SCREENS.ROGUEBOX || currentScreen === SCREENS.LABYRINTH || currentScreen === SCREENS.DRAWIT;
        const enteringGame = targetScreen === SCREENS.ROGUEBOX || targetScreen === SCREENS.LABYRINTH || targetScreen === SCREENS.DRAWIT;
        if (leavingGame && !enteringGame) setGameMode(false);

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
            case SCREENS.LABYRINTH: return labyrinthScreen;
            case SCREENS.DRAWIT: return drawItScreen;
            default: return null;
        }
    }

    function startLabyrinth() {
        setGameMode(true);
        navigateTo(SCREENS.LABYRINTH);
        window.labyrinthGame?.start?.();
    }

    function stopLabyrinth() {
        window.labyrinthGame?.stop?.();
    }

    function getCurrentListItems() {
        if (currentScreen === SCREENS.MAIN_MENU) return document.querySelectorAll('#main-menu-list .game-item');
        if (currentScreen === SCREENS.GAMES) return document.querySelectorAll('#game-list .game-item');
        if (currentScreen === SCREENS.SETTINGS) return document.querySelectorAll('#settings-list .game-item');
        return null;
    }

    function openColorPicker() {
        if (!colorPicker || !colorPickerList) return;
        isColorPickerOpen = true;
        colorPicker.classList.remove('hidden');

        const items = [...colorPickerList.querySelectorAll('.game-item')];
        for (const el of items) el.classList.remove('active');

        const idx = items.findIndex(el => el.dataset.color === settings.consoleColor);
        selectionState.colorPicker = idx >= 0 ? idx : 0;
        const selected = items[selectionState.colorPicker];
        selected?.classList.add('active');
        selected?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }

    function closeColorPicker() {
        if (!colorPicker || !colorPickerList) return;
        isColorPickerOpen = false;
        colorPicker.classList.add('hidden');
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
