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
    }

    bindEvents() {
        this.techSelect.addEventListener('change', (e) => {
            this.activeTechnique = e.target.value;
            this.updateTechniqueDesc();
        });

        this.startBtn.addEventListener('click', () => this.startSession());
        this.stopBtn.addEventListener('click', () => this.stopSession());
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
    }

    resetSessionStats() {
        this.isRunning = false;
        this.currentStepIdx = 0;
        this.sessionDuration = 0;
        this.cyclesCompleted = 0;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.stepTimeout) clearTimeout(this.stepTimeout);
        
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
