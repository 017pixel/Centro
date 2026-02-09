document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const introScreen = document.getElementById('intro-screen');
    const mainMenu = document.getElementById('main-menu');
    const gamesScreen = document.getElementById('games-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const infoScreen = document.getElementById('info-screen');
    
    const startBtn = document.querySelector('.pill-btn.start');
    const dPadUp = document.querySelector('.d-btn.up');
    const dPadDown = document.querySelector('.d-btn.down');
    const aBtn = document.querySelector('.retro-btn.btn-a');
    const bBtn = document.querySelector('.retro-btn.btn-b');
    
    const pressStartText = document.getElementById('press-start-text');
    const logoSpans = document.querySelectorAll('.logo-text span');
    const pressStartSpans = document.querySelectorAll('.press-start span');

    // State
    const SCREENS = {
        INTRO: 'intro',
        MAIN_MENU: 'main-menu',
        GAMES: 'games',
        SETTINGS: 'settings',
        INFO: 'info'
    };

    let currentScreen = SCREENS.INTRO;
    let isAnimating = false;
    
    const selectionState = {
        [SCREENS.MAIN_MENU]: 0,
        [SCREENS.GAMES]: 0,
        [SCREENS.SETTINGS]: 0
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
            }
        });

        dPadUp.addEventListener('click', () => {
            audioEngine.playClickNav();
            handleNavigation('up');
        });
        dPadDown.addEventListener('click', () => {
            audioEngine.playClickNav();
            handleNavigation('down');
        });

        aBtn.addEventListener('click', () => {
            audioEngine.playClickA();
            handleSelect();
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
            alert(`Starting ${selectedGame.textContent}...`);
        }
    }

    function handleBack() {
        if (isAnimating) return;
        if (currentScreen !== SCREENS.INTRO && currentScreen !== SCREENS.MAIN_MENU) {
            navigateBack(SCREENS.MAIN_MENU);
        }
    }

    function navigateTo(targetScreen) {
        const currentEl = getScreenElement(currentScreen);
        const nextEl = getScreenElement(SCREENS[targetScreen.toUpperCase()] || targetScreen);

        currentEl.classList.add('hidden');
        nextEl.classList.remove('hidden');
        nextEl.classList.remove('slide-down', 'slide-in-right');
        void nextEl.offsetWidth; 
        nextEl.classList.add('slide-in-right');
        currentScreen = targetScreen;
    }

    function navigateBack(targetScreen) {
        const currentEl = getScreenElement(currentScreen);
        const nextEl = getScreenElement(targetScreen);

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
