/**
 * Module: Aura Breath Sync (Mindfulness Breathing Coach)
 */

export const BREATH_TECHNIQUES = {
    box: {
        name: "Box Breathing",
        desc: "Popularized by Navy SEALs, this pattern concentration-locks focus and calms the nervous system.",
        pattern: [
            { state: 'inhale', duration: 4, label: 'Breathe In' },
            { state: 'hold', duration: 4, label: 'Hold' },
            { state: 'exhale', duration: 4, label: 'Breathe Out' },
            { state: 'hold', duration: 4, label: 'Hold' }
        ]
    },
    relax: {
        name: "4-7-8 Breathing",
        desc: "Developed by Dr. Andrew Weil, this serves as a natural tranquilizer for the nervous system, reducing stress.",
        pattern: [
            { state: 'inhale', duration: 4, label: 'Breathe In' },
            { state: 'hold', duration: 7, label: 'Hold' },
            { state: 'exhale', duration: 8, label: 'Exhale (Whoosh)' }
        ]
    },
    coherent: {
        name: "Coherent Breathing",
        desc: "Striving for 5 breath cycles per minute. Helps align heart rate variability and balances emotions.",
        pattern: [
            { state: 'inhale', duration: 5, label: 'Breathe In' },
            { state: 'exhale', duration: 5, label: 'Breathe Out' }
        ]
    }
};

class BreathAudio {
    constructor() {
        this.ctx = null;
        this.osc = null;
        this.filter = null;
        this.gain = null;
        this.harmonicOscs = [];
        this.noiseSource = null;
        this.noiseGain = null;
        this.isMuted = true;
    }

    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        
        try {
            this.ctx = new AudioContextClass();

            // Grounding base tone oscillator (110Hz triangle wave)
            this.osc = this.ctx.createOscillator();
            this.osc.type = 'triangle';
            this.osc.frequency.setValueAtTime(110, this.ctx.currentTime);

            // Create low-pass filter to make the wave tone softer
            const lowpass = this.ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(300, this.ctx.currentTime);

            // Master Gain node
            this.gain = this.ctx.createGain();
            this.gain.gain.setValueAtTime(0, this.ctx.currentTime);

            // Connections for base oscillator
            this.osc.connect(lowpass);
            lowpass.connect(this.gain);
            this.gain.connect(this.ctx.destination);
            this.osc.start();

            // Create pink-ish/white noise for air breathing sound
            this.createNoiseGenerator();
        } catch (e) {
            console.error("Web Audio API failed to initialize:", e);
        }
    }

    createNoiseGenerator() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // White noise array fill
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.noiseSource = this.ctx.createBufferSource();
        this.noiseSource.buffer = buffer;
        this.noiseSource.loop = true;

        // Bandpass filter for breathing sweep sounds
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'bandpass';
        this.filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
        this.filter.frequency.setValueAtTime(350, this.ctx.currentTime);

        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

        // Connections
        this.noiseSource.connect(this.filter);
        this.filter.connect(this.noiseGain);
        this.noiseGain.connect(this.ctx.destination);
        
        this.noiseSource.start();
    }

    playState(state, duration) {
        this.init();
        if (!this.ctx) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        
        if (this.isMuted) {
            if (this.gain) this.gain.gain.linearRampToValueAtTime(0, now + 0.1);
            if (this.noiseGain) this.noiseGain.gain.linearRampToValueAtTime(0, now + 0.1);
            this.stopHarmonics(now);
            return;
        }

        if (state === 'inhale') {
            // Rise pitch 110Hz -> 150Hz
            if (this.osc) {
                this.osc.frequency.setValueAtTime(110, now);
                this.osc.frequency.exponentialRampToValueAtTime(150, now + duration);
            }
            // Sweep bandpass 350Hz -> 850Hz
            if (this.filter) {
                this.filter.frequency.setValueAtTime(350, now);
                this.filter.frequency.exponentialRampToValueAtTime(850, now + duration);
            }
            // Volume fade in
            if (this.gain) {
                this.gain.gain.setValueAtTime(0.01, now);
                this.gain.gain.linearRampToValueAtTime(0.18, now + duration);
            }
            if (this.noiseGain) {
                this.noiseGain.gain.setValueAtTime(0.01, now);
                this.noiseGain.gain.linearRampToValueAtTime(0.14, now + duration);
            }
            this.stopHarmonics(now);
        } 
        else if (state === 'exhale') {
            // Drop pitch 150Hz -> 110Hz
            if (this.osc) {
                this.osc.frequency.setValueAtTime(150, now);
                this.osc.frequency.exponentialRampToValueAtTime(110, now + duration);
            }
            // Sweep bandpass 850Hz -> 300Hz
            if (this.filter) {
                this.filter.frequency.setValueAtTime(850, now);
                this.filter.frequency.exponentialRampToValueAtTime(300, now + duration);
            }
            // Volume fade out
            if (this.gain) {
                this.gain.gain.setValueAtTime(0.18, now);
                this.gain.gain.linearRampToValueAtTime(0.02, now + duration);
            }
            if (this.noiseGain) {
                this.noiseGain.gain.setValueAtTime(0.14, now);
                this.noiseGain.gain.linearRampToValueAtTime(0.01, now + duration);
            }
            this.stopHarmonics(now);
        } 
        else if (state === 'hold') {
            // Constant low grounding hum
            if (this.osc) this.osc.frequency.setValueAtTime(110, now);
            if (this.gain) {
                this.gain.gain.setValueAtTime(0.08, now);
                this.gain.gain.linearRampToValueAtTime(0.08, now + duration);
            }
            if (this.noiseGain) {
                this.noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.5);
            }
            // Beautiful ambient hold chord (C major / harmonics)
            this.playHarmonics(now, duration);
        }
    }

    playHarmonics(startTime, duration) {
        if (!this.ctx) return;
        const freqs = [220, 330, 440];
        this.stopHarmonics(startTime);

        freqs.forEach(f => {
            try {
                const hOsc = this.ctx.createOscillator();
                hOsc.type = 'sine';
                hOsc.frequency.setValueAtTime(f, startTime);

                const hGain = this.ctx.createGain();
                hGain.gain.setValueAtTime(0, startTime);
                hGain.gain.linearRampToValueAtTime(0.04, startTime + 1.0); // slow blend in
                hGain.gain.setValueAtTime(0.04, startTime + duration - 0.5);
                hGain.gain.linearRampToValueAtTime(0, startTime + duration); // blend out

                hOsc.connect(hGain);
                hGain.connect(this.ctx.destination);
                hOsc.start(startTime);
                
                this.harmonicOscs.push({ osc: hOsc, gainNode: hGain });
            } catch (e) {}
        });
    }

    stopHarmonics(time) {
        this.harmonicOscs.forEach(item => {
            try {
                item.gainNode.gain.cancelScheduledValues(time);
                item.gainNode.gain.setValueAtTime(item.gainNode.gain.value, time);
                item.gainNode.gain.linearRampToValueAtTime(0, time + 0.1);
                item.osc.stop(time + 0.2);
            } catch(e) {}
        });
        this.harmonicOscs = [];
    }

    stop() {
        const now = this.ctx ? this.ctx.currentTime : 0;
        if (this.gain) this.gain.gain.linearRampToValueAtTime(0, now + 0.1);
        if (this.noiseGain) this.noiseGain.gain.linearRampToValueAtTime(0, now + 0.1);
        this.stopHarmonics(now);
    }
}

export class BreathSync {
    constructor(app) {
        this.app = app;
        
        this.activeTechnique = 'box';
        this.isRunning = false;
        this.currentStepIdx = 0;
        this.timerInterval = null;
        this.stepTimeout = null;

        // Stats
        this.sessionDuration = 0; // seconds
        this.cyclesCompleted = 0;
        
        this.audioCoach = new BreathAudio();

        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.techSelect = document.getElementById('breath-technique-select');
        this.techDesc = document.getElementById('breath-tech-desc');
        this.ring = document.getElementById('breath-pulse-ring');
        this.textState = document.getElementById('breath-state-text');
        this.timerText = document.getElementById('breath-timer-text');
        this.cycleCountText = document.getElementById('breath-cycles-count');
        this.startBtn = document.getElementById('breath-start-btn');
        this.stopBtn = document.getElementById('breath-stop-btn');
        this.audioToggleBtn = document.getElementById('breath-audio-toggle');
    }

    bindEvents() {
        this.techSelect.addEventListener('change', (e) => {
            this.activeTechnique = e.target.value;
            this.updateTechniqueDesc();
        });

        this.startBtn.addEventListener('click', () => this.startSession());
        this.stopBtn.addEventListener('click', () => this.stopSession());
        
        this.audioToggleBtn.addEventListener('click', () => {
            this.audioCoach.isMuted = !this.audioCoach.isMuted;
            this.updateAudioToggleUI();
        });
    }

    updateAudioToggleUI() {
        if (this.audioCoach.isMuted) {
            this.audioToggleBtn.classList.remove('active');
            this.audioToggleBtn.querySelector('i').setAttribute('data-lucide', 'volume-x');
            this.audioToggleBtn.querySelector('span').innerText = 'Sound: Off';
        } else {
            this.audioCoach.init();
            this.audioToggleBtn.classList.add('active');
            this.audioToggleBtn.querySelector('i').setAttribute('data-lucide', 'volume-2');
            this.audioToggleBtn.querySelector('span').innerText = 'Sound: On';
        }
        if (window.lucide) lucide.createIcons();
    }

    updateTechniqueDesc() {
        const tech = BREATH_TECHNIQUES[this.activeTechnique];
        this.techDesc.innerText = tech.desc;
    }

    start() {
        this.resetSessionStats();
        this.updateTechniqueDesc();
        this.updateUI();
        
        this.startBtn.style.display = 'inline-flex';
        this.stopBtn.style.display = 'none';
        this.techSelect.disabled = false;
        
        this.audioCoach.isMuted = true;
        this.updateAudioToggleUI();
    }

    resetSessionStats() {
        this.isRunning = false;
        this.currentStepIdx = 0;
        this.sessionDuration = 0;
        this.cyclesCompleted = 0;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.stepTimeout) clearTimeout(this.stepTimeout);
        
        this.audioCoach.stop();
        
        this.ring.style.transform = 'scale(1)';
        this.ring.className = 'breath-ring-element';
        this.textState.innerText = 'Ready';
        this.timerText.innerText = '00:00';
        this.cycleCountText.innerText = '0';
    }

    startSession() {
        this.isRunning = true;
        this.techSelect.disabled = true;
        this.startBtn.style.display = 'none';
        this.stopBtn.style.display = 'inline-flex';

        this.app.showToast('Breathing session started.', 'info');
        
        // Start Session Clock
        this.timerInterval = setInterval(() => {
            this.sessionDuration++;
            this.updateClock();
        }, 1000);

        this.currentStepIdx = 0;
        this.executePatternStep();
    }

    executePatternStep() {
        if (!this.isRunning) return;

        const tech = BREATH_TECHNIQUES[this.activeTechnique];
        const step = tech.pattern[this.currentStepIdx];
        
        // Update Step Label
        this.textState.innerText = step.label;
        
        // Visual animations based on state
        this.ring.className = `breath-ring-element step-${step.state}`;
        this.ring.style.transition = `transform ${step.duration}s linear, border-color 0.5s ease, box-shadow 0.5s ease`;

        if (step.state === 'inhale') {
            this.ring.style.transform = 'scale(1.6)';
        } else if (step.state === 'exhale') {
            this.ring.style.transform = 'scale(1.0)';
        } else if (step.state === 'hold') {
            // Keep current size
        }

        // Trigger Audio coach sweep
        this.audioCoach.playState(step.state, step.duration);

        // Schedule next step
        this.stepTimeout = setTimeout(() => {
            this.currentStepIdx++;
            
            // If pattern reaches end, cycle completed
            if (this.currentStepIdx >= tech.pattern.length) {
                this.currentStepIdx = 0;
                this.cyclesCompleted++;
                this.cycleCountText.innerText = this.cyclesCompleted;
            }

            this.executePatternStep();
        }, step.duration * 1000);
    }

    updateClock() {
        const mins = Math.floor(this.sessionDuration / 60);
        const secs = this.sessionDuration % 60;
        this.timerText.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    stopSession() {
        if (!this.isRunning) return;
        this.isRunning = false;

        this.audioCoach.stop();

        // Save session entry to App State history list
        if (this.sessionDuration > 5) {
            const logEntry = {
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                duration: this.sessionDuration,
                cycles: this.cyclesCompleted,
                technique: BREATH_TECHNIQUES[this.activeTechnique].name
            };

            // Retrieve current breath log history
            const history = this.app.state.breathHistory || [];
            history.push(logEntry);
            this.app.saveModuleData('breathHistory', history);
            this.app.showToast('Breathing session saved!', 'check');
        } else {
            this.app.showToast('Session too short to save.', 'info');
        }

        this.start();
    }

    updateUI() {
        // Build select options if not already filled
        if (this.techSelect.options.length === 0) {
            this.techSelect.innerHTML = '';
            Object.keys(BREATH_TECHNIQUES).forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.innerText = BREATH_TECHNIQUES[key].name;
                this.techSelect.appendChild(opt);
            });
        }
    }
}
