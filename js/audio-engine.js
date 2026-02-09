class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = true;
        this.bgMusic = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
    }

    setEnabled(val) {
        this.enabled = val;
        if (this.masterGain) {
            this.masterGain.gain.value = val ? 1 : 0;
        }
    }

    // Beep types for retro feel
    playBeep(freq, duration, type = 'square') {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playClickA() { this.playBeep(600, 0.1, 'square'); }
    playClickB() { this.playBeep(400, 0.1, 'square'); }
    playClickNav() { this.playBeep(800, 0.05, 'sine'); }
    playClickMenu() { this.playBeep(1000, 0.1, 'triangle'); }

    startMusic() {
        if (!this.enabled || !this.ctx || this.bgMusic) return;

        // Happy, upbeat Tetris-inspired loop (Type-A style, major key)
        const melody = [
            // Measure 1
            { f: 659.25, d: 0.4 }, { f: 493.88, d: 0.2 }, { f: 523.25, d: 0.2 }, { f: 587.33, d: 0.4 },
            { f: 523.25, d: 0.2 }, { f: 493.88, d: 0.2 }, 
            
            // Measure 2
            { f: 440.00, d: 0.4 }, { f: 440.00, d: 0.2 }, { f: 523.25, d: 0.2 }, { f: 659.25, d: 0.4 },
            { f: 587.33, d: 0.2 }, { f: 523.25, d: 0.2 },
            
            // Measure 3
            { f: 493.88, d: 0.4 }, { f: 493.88, d: 0.2 }, { f: 523.25, d: 0.2 }, { f: 587.33, d: 0.4 },
            { f: 659.25, d: 0.4 }, 
            
            // Measure 4
            { f: 523.25, d: 0.4 }, { f: 440.00, d: 0.4 }, { f: 440.00, d: 0.4 }, { f: 0, d: 0.4 }, // Rest

            // Measure 5 (High part)
            { f: 587.33, d: 0.4 }, { f: 698.46, d: 0.2 }, { f: 880.00, d: 0.4 }, { f: 783.99, d: 0.2 },
            { f: 698.46, d: 0.2 }, 
            
            // Measure 6
            { f: 659.25, d: 0.6 }, { f: 523.25, d: 0.2 }, { f: 659.25, d: 0.4 },
            
            // Measure 7
            { f: 587.33, d: 0.2 }, { f: 523.25, d: 0.2 }, { f: 493.88, d: 0.4 }, { f: 493.88, d: 0.2 },
            { f: 523.25, d: 0.2 }, 
            
            // Measure 8
            { f: 587.33, d: 0.4 }, { f: 659.25, d: 0.4 }, { f: 523.25, d: 0.4 }, { f: 440.00, d: 0.4 },
            { f: 440.00, d: 0.4 }, { f: 0, d: 0.4 } // Rest
        ];

        let time = this.ctx.currentTime + 0.1;
        
        // Slightly faster tempo (250ms per beat unit)
        this.bgMusic = setInterval(() => {
            if (!this.enabled) return;
            const note = melody.shift();
            melody.push(note);
            
            if (note.f > 0) { // Play only if not a rest
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                // Mix of triangle and square for "8-bit happy" sound
                osc.type = 'triangle'; 
                
                osc.frequency.setValueAtTime(note.f, this.ctx.currentTime);
                
                // Short envelope for staccato feel
                gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + note.d - 0.05);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start();
                osc.stop(this.ctx.currentTime + note.d);
            }
        }, 250);
    }
}

window.audioEngine = new AudioEngine();
