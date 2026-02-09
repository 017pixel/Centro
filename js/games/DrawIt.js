(() => {
    // DrawIt Game State
    const state = {
        isPlaying: false,
        timeLimit: 170000, // 2:50 in milliseconds
        timeRemaining: 170000,
        lastTime: 0,
        animationId: null,

        // Game Grid
        tileSize: 10,
        cols: 0,
        rows: 0,

        // Cursor
        cursor: { col: 0, row: 0 },

        // Drawing Mode: 'draw' or 'erase'
        mode: 'draw',

        // Canvas Grid (2D array: true = filled, false = empty)
        grid: [],

        // Current object to draw
        currentObject: null,

        // Movement
        keys: { up: false, down: false, left: false, right: false },
        moveCooldown: 0,
        moveInterval: 80,

        // Elements
        els: {
            gameArea: null,
            timeEl: null,
            modeEl: null,
            objectEl: null,
            cursorEl: null,
            resultOverlay: null,
            resultMsg: null,
            resultDetails: null
        }
    };

    // 30 Simple Objects to Draw
    const OBJECTS = [
        { id: 'apple', name: 'Apfel', patterns: ['circle_filled', 'round_shape'] },
        { id: 'sun', name: 'Sonne', patterns: ['circle_with_rays', 'sun_shape'] },
        { id: 'circle', name: 'Kreis', patterns: ['circle', 'round'] },
        { id: 'square', name: 'Quadrat', patterns: ['square', 'rectangle'] },
        { id: 'triangle', name: 'Dreieck', patterns: ['triangle', 'pointed'] },
        { id: 'star', name: 'Stern', patterns: ['star', 'pointed_multiple'] },
        { id: 'heart', name: 'Herz', patterns: ['heart', 'curved_pointed'] },
        { id: 'house', name: 'Haus', patterns: ['house', 'square_with_triangle'] },
        { id: 'tree', name: 'Baum', patterns: ['tree', 'trunk_with_crown'] },
        { id: 'flower', name: 'Blume', patterns: ['flower', 'center_with_petals'] },
        { id: 'moon', name: 'Mond', patterns: ['crescent', 'curved'] },
        { id: 'cloud', name: 'Wolke', patterns: ['cloud', 'bumpy_round'] },
        { id: 'lightning', name: 'Blitz', patterns: ['zigzag', 'angular'] },
        { id: 'arrow', name: 'Pfeil', patterns: ['arrow', 'line_with_point'] },
        { id: 'cross', name: 'Kreuz', patterns: ['cross', 'plus'] },
        { id: 'diamond', name: 'Raute', patterns: ['diamond', 'rotated_square'] },
        { id: 'fish', name: 'Fisch', patterns: ['oval_with_tail', 'fish_shape'] },
        { id: 'boat', name: 'Boot', patterns: ['curved_bottom', 'boat_shape'] },
        { id: 'mountain', name: 'Berg', patterns: ['triangle_peak', 'mountain'] },
        { id: 'eye', name: 'Auge', patterns: ['oval_with_circle', 'eye_shape'] },
        { id: 'smile', name: 'Smiley', patterns: ['circle_with_face', 'happy_face'] },
        { id: 'cup', name: 'Tasse', patterns: ['rectangle_with_handle', 'cup_shape'] },
        { id: 'umbrella', name: 'Regenschirm', patterns: ['curved_with_handle', 'umbrella'] },
        { id: 'key', name: 'Schlüssel', patterns: ['circle_with_line', 'key_shape'] },
        { id: 'balloon', name: 'Ballon', patterns: ['oval_with_string', 'balloon'] },
        { id: 'leaf', name: 'Blatt', patterns: ['leaf_shape', 'pointed_oval'] },
        { id: 'bell', name: 'Glocke', patterns: ['bell_shape', 'curved_bottom'] },
        { id: 'flag', name: 'Flagge', patterns: ['rectangle_on_pole', 'flag'] },
        { id: 'scissors', name: 'Schere', patterns: ['x_with_ovals', 'cross_shape'] },
        { id: 'pencil', name: 'Stift', patterns: ['long_with_point', 'pencil'] }
    ];

    function init(elements) {
        state.els.gameArea = elements.gameAreaEl;
        state.els.timeEl = elements.timeEl;
        state.els.modeEl = elements.modeEl;
        state.els.objectEl = elements.objectEl;
        state.els.resultOverlay = elements.resultOverlayEl;
        state.els.resultMsg = elements.resultMsgEl;
        state.els.resultDetails = elements.resultDetailsEl;
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

    async function initGame() {
        state.timeRemaining = state.timeLimit;
        state.mode = 'draw';
        state.moveCooldown = 0;

        state.keys.up = false;
        state.keys.down = false;
        state.keys.left = false;
        state.keys.right = false;

        // Select random object
        state.currentObject = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];

        if (state.els.gameArea) {
            state.els.gameArea.replaceChildren();

            const rect = state.els.gameArea.getBoundingClientRect();
            state.cols = Math.max(1, Math.floor(rect.width / state.tileSize));
            state.rows = Math.max(1, Math.floor(rect.height / state.tileSize));

            // Initialize empty grid
            state.grid = [];
            for (let r = 0; r < state.rows; r++) {
                state.grid[r] = [];
                for (let c = 0; c < state.cols; c++) {
                    state.grid[r][c] = false;
                }
            }

            // Create cursor
            state.cursor.col = Math.floor(state.cols / 2);
            state.cursor.row = Math.floor(state.rows / 2);

            const cursorEl = document.createElement('div');
            cursorEl.id = 'di-cursor';
            cursorEl.className = 'di-cursor';
            state.els.gameArea.appendChild(cursorEl);
            state.els.cursorEl = cursorEl;
            positionEntity(cursorEl, state.cursor.col, state.cursor.row);
        }

        // Update UI
        updateTimeDisplay();
        updateModeDisplay();
        if (state.els.objectEl) {
            state.els.objectEl.textContent = state.currentObject.name;
        }
        if (state.els.resultOverlay) {
            state.els.resultOverlay.classList.add('hidden');
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
        // Update timer
        state.timeRemaining -= dt;
        if (state.timeRemaining <= 0) {
            state.timeRemaining = 0;
            updateTimeDisplay();
            evaluateDrawing();
            return;
        }
        updateTimeDisplay();

        // Handle movement
        moveCursor(dt);
    }

    function moveCursor(dt) {
        state.moveCooldown -= dt;
        if (state.moveCooldown > 0) return;

        const dir = getCursorDirection();
        if (!dir) return;

        const nextCol = clamp(state.cursor.col + dir.dc, 0, state.cols - 1);
        const nextRow = clamp(state.cursor.row + dir.dr, 0, state.rows - 1);

        if (nextCol === state.cursor.col && nextRow === state.cursor.row) return;

        state.cursor.col = nextCol;
        state.cursor.row = nextRow;
        positionEntity(state.els.cursorEl, state.cursor.col, state.cursor.row);
        state.moveCooldown = state.moveInterval;

        // Apply draw/erase based on mode
        applyCurrentMode();
    }

    function applyCurrentMode() {
        const col = state.cursor.col;
        const row = state.cursor.row;

        if (state.mode === 'draw') {
            if (!state.grid[row][col]) {
                state.grid[row][col] = true;
                createPixel(col, row);
            }
        } else if (state.mode === 'erase') {
            if (state.grid[row][col]) {
                state.grid[row][col] = false;
                removePixel(col, row);
            }
        }
    }

    function createPixel(col, row) {
        const pixelEl = document.createElement('div');
        pixelEl.className = 'di-pixel';
        pixelEl.setAttribute('data-col', col);
        pixelEl.setAttribute('data-row', row);
        pixelEl.style.left = `${col * state.tileSize}px`;
        pixelEl.style.top = `${row * state.tileSize}px`;
        state.els.gameArea.appendChild(pixelEl);
    }

    function removePixel(col, row) {
        const pixel = state.els.gameArea.querySelector(`.di-pixel[data-col="${col}"][data-row="${row}"]`);
        if (pixel) pixel.remove();
    }

    function getCursorDirection() {
        if (state.keys.up) return { dc: 0, dr: -1 };
        if (state.keys.down) return { dc: 0, dr: 1 };
        if (state.keys.left) return { dc: -1, dr: 0 };
        if (state.keys.right) return { dc: 1, dr: 0 };
        return null;
    }

    function setKey(key, value) {
        if (state.keys.hasOwnProperty(key)) {
            state.keys[key] = value;
        }
    }

    function handleA() {
        // A button: Switch to Draw mode
        state.mode = 'draw';
        updateModeDisplay();
    }

    function handleB() {
        // B button: Switch to Erase mode
        state.mode = 'erase';
        updateModeDisplay();
    }

    function handleSubmit() {
        // Called when time runs out or user manually submits
        if (state.isPlaying) {
            evaluateDrawing();
        }
    }

    function evaluateDrawing() {
        stop();

        // Calculate drawing metrics
        const filledPixels = countFilledPixels();
        const totalPixels = state.cols * state.rows;
        const fillPercentage = (filledPixels / totalPixels) * 100;

        // Analyze drawing characteristics
        const analysis = analyzeDrawing();

        // Determine if drawing matches the object
        const result = checkDrawingMatch(analysis);

        // Show result
        showResult(result, analysis);
    }

    function countFilledPixels() {
        let count = 0;
        for (let r = 0; r < state.rows; r++) {
            for (let c = 0; c < state.cols; c++) {
                if (state.grid[r][c]) count++;
            }
        }
        return count;
    }

    function analyzeDrawing() {
        const filledPixels = countFilledPixels();
        const totalPixels = state.cols * state.rows;

        // Get bounding box
        let minCol = state.cols, maxCol = 0;
        let minRow = state.rows, maxRow = 0;

        for (let r = 0; r < state.rows; r++) {
            for (let c = 0; c < state.cols; c++) {
                if (state.grid[r][c]) {
                    minCol = Math.min(minCol, c);
                    maxCol = Math.max(maxCol, c);
                    minRow = Math.min(minRow, r);
                    maxRow = Math.max(maxRow, r);
                }
            }
        }

        const width = maxCol - minCol + 1;
        const height = maxRow - minRow + 1;
        const aspectRatio = width / Math.max(height, 1);

        // Calculate center of mass
        let centerX = 0, centerY = 0;
        for (let r = 0; r < state.rows; r++) {
            for (let c = 0; c < state.cols; c++) {
                if (state.grid[r][c]) {
                    centerX += c;
                    centerY += r;
                }
            }
        }
        if (filledPixels > 0) {
            centerX /= filledPixels;
            centerY /= filledPixels;
        }

        // Calculate compactness (how circular/compact the shape is)
        const boundingArea = width * height;
        const compactness = filledPixels / Math.max(boundingArea, 1);

        // Check for symmetry (horizontal)
        let symmetryScore = 0;
        if (filledPixels > 0) {
            const midCol = (minCol + maxCol) / 2;
            let symmetricPixels = 0;
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    if (state.grid[r][c]) {
                        const mirrorCol = Math.round(2 * midCol - c);
                        if (mirrorCol >= 0 && mirrorCol < state.cols && state.grid[r][mirrorCol]) {
                            symmetricPixels++;
                        }
                    }
                }
            }
            symmetryScore = symmetricPixels / Math.max(filledPixels, 1);
        }

        // Check for vertical lines
        let hasVerticalLine = false;
        for (let c = 0; c < state.cols; c++) {
            let consecutiveCount = 0;
            for (let r = 0; r < state.rows; r++) {
                if (state.grid[r][c]) {
                    consecutiveCount++;
                    if (consecutiveCount >= 5) hasVerticalLine = true;
                } else {
                    consecutiveCount = 0;
                }
            }
        }

        // Check for horizontal lines
        let hasHorizontalLine = false;
        for (let r = 0; r < state.rows; r++) {
            let consecutiveCount = 0;
            for (let c = 0; c < state.cols; c++) {
                if (state.grid[r][c]) {
                    consecutiveCount++;
                    if (consecutiveCount >= 5) hasHorizontalLine = true;
                } else {
                    consecutiveCount = 0;
                }
            }
        }

        return {
            filledPixels,
            totalPixels,
            fillPercentage: (filledPixels / totalPixels) * 100,
            width,
            height,
            aspectRatio,
            compactness,
            symmetryScore,
            hasVerticalLine,
            hasHorizontalLine,
            isRound: compactness > 0.5 && aspectRatio > 0.7 && aspectRatio < 1.4,
            isSquare: aspectRatio > 0.8 && aspectRatio < 1.2 && compactness > 0.7,
            isTriangular: compactness < 0.5 && compactness > 0.2,
            isEmpty: filledPixels < 5
        };
    }

    function checkDrawingMatch(analysis) {
        if (analysis.isEmpty) {
            return { success: false, message: 'Zeichnung ist zu leer!', confidence: 0 };
        }

        const obj = state.currentObject;
        let confidence = 0;
        let matchReasons = [];

        // Base confidence for having drawn something substantial
        if (analysis.fillPercentage > 2) confidence += 20;
        if (analysis.fillPercentage > 5) confidence += 10;
        if (analysis.fillPercentage > 10) confidence += 10;

        // Pattern matching based on object type
        switch (obj.id) {
            case 'circle':
            case 'apple':
            case 'balloon':
            case 'eye':
            case 'smile':
                if (analysis.isRound) {
                    confidence += 40;
                    matchReasons.push('Runde Form erkannt');
                }
                if (analysis.symmetryScore > 0.5) {
                    confidence += 15;
                    matchReasons.push('Symmetrisch');
                }
                break;

            case 'square':
            case 'house':
            case 'flag':
                if (analysis.isSquare || analysis.aspectRatio > 0.6 && analysis.aspectRatio < 1.5) {
                    confidence += 35;
                    matchReasons.push('Rechteckige Form erkannt');
                }
                if (analysis.compactness > 0.5) {
                    confidence += 15;
                    matchReasons.push('Kompakte Form');
                }
                break;

            case 'triangle':
            case 'mountain':
                if (analysis.isTriangular) {
                    confidence += 40;
                    matchReasons.push('Dreieckige Form erkannt');
                }
                break;

            case 'star':
            case 'cross':
            case 'scissors':
                if (analysis.hasVerticalLine && analysis.hasHorizontalLine) {
                    confidence += 35;
                    matchReasons.push('Kreuzende Linien erkannt');
                }
                if (analysis.symmetryScore > 0.3) {
                    confidence += 15;
                    matchReasons.push('Symmetrisch');
                }
                break;

            case 'tree':
            case 'umbrella':
            case 'pencil':
            case 'key':
                if (analysis.hasVerticalLine) {
                    confidence += 30;
                    matchReasons.push('Vertikale Linie erkannt');
                }
                if (analysis.height > analysis.width) {
                    confidence += 15;
                    matchReasons.push('Hochformat');
                }
                break;

            case 'arrow':
            case 'lightning':
                if (analysis.hasVerticalLine || analysis.hasHorizontalLine) {
                    confidence += 25;
                    matchReasons.push('Linienform erkannt');
                }
                if (analysis.compactness < 0.4) {
                    confidence += 20;
                    matchReasons.push('Langgestreckte Form');
                }
                break;

            case 'heart':
            case 'flower':
            case 'cloud':
            case 'leaf':
                if (analysis.symmetryScore > 0.4) {
                    confidence += 30;
                    matchReasons.push('Symmetrische Form');
                }
                if (analysis.compactness > 0.3 && analysis.compactness < 0.7) {
                    confidence += 20;
                    matchReasons.push('Organische Form');
                }
                break;

            case 'sun':
                if (analysis.isRound || analysis.symmetryScore > 0.4) {
                    confidence += 35;
                    matchReasons.push('Runde/strahlende Form');
                }
                break;

            case 'moon':
                if (analysis.compactness < 0.5 && analysis.symmetryScore < 0.4) {
                    confidence += 30;
                    matchReasons.push('Halbmondform erkannt');
                }
                break;

            default:
                // Generic matching for other objects
                if (analysis.fillPercentage > 3 && analysis.fillPercentage < 50) {
                    confidence += 30;
                    matchReasons.push('Angemessene Zeichnungsgröße');
                }
                if (analysis.symmetryScore > 0.3) {
                    confidence += 15;
                }
                break;
        }

        // Bonus for effort (more pixels = more effort)
        if (analysis.filledPixels > 50) confidence += 5;
        if (analysis.filledPixels > 100) confidence += 5;

        // Cap confidence at 100
        confidence = Math.min(100, confidence);

        const success = confidence >= 50;
        const message = success
            ? `${obj.name} erkannt!`
            : `Das sieht nicht wie "${obj.name}" aus...`;

        return {
            success,
            message,
            confidence,
            reasons: matchReasons
        };
    }

    function showResult(result, analysis) {
        if (state.els.resultOverlay) {
            state.els.resultOverlay.classList.remove('hidden');
        }
        if (state.els.resultMsg) {
            state.els.resultMsg.textContent = result.success ? 'GEWONNEN!' : 'VERLOREN!';
            state.els.resultMsg.className = result.success ? 'di-msg di-win' : 'di-msg di-lose';
        }
        if (state.els.resultDetails) {
            const confidenceText = `Genauigkeit: ${Math.round(result.confidence)}%`;
            const reasonsText = result.reasons.length > 0 ? result.reasons.join(', ') : 'Keine passenden Merkmale erkannt';
            state.els.resultDetails.innerHTML = `
                <div>${result.message}</div>
                <div class="di-confidence">${confidenceText}</div>
                <div class="di-reasons">${reasonsText}</div>
            `;
        }
    }

    function updateTimeDisplay() {
        if (!state.els.timeEl) return;
        const totalSeconds = Math.ceil(state.timeRemaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        state.els.timeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function updateModeDisplay() {
        if (!state.els.modeEl) return;
        if (state.mode === 'draw') {
            state.els.modeEl.textContent = 'ZEICHNEN';
            state.els.modeEl.className = 'di-mode di-mode-draw';
        } else {
            state.els.modeEl.textContent = 'RADIEREN';
            state.els.modeEl.className = 'di-mode di-mode-erase';
        }
    }

    function positionEntity(el, col, row) {
        el.style.left = `${col * state.tileSize}px`;
        el.style.top = `${row * state.tileSize}px`;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function getState() {
        return state;
    }

    window.drawItGame = {
        init,
        start,
        stop,
        restart,
        setKey,
        handleA,
        handleB,
        handleSubmit,
        getState
    };
})();
