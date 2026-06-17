/**
 * InnerSpace App Coordinator & State Manager
 */

import { AuraCanvas } from './canvas.js';
import { ValuesSorter } from './values.js';
import { LifeWheel, WHEEL_CATEGORIES, WHEEL_ADVICE } from './wheel.js';
import { PersonalityPrism } from './personality.js';
import { PromptJournal } from './journal.js';

class InnerSpaceApp {
    constructor() {
        this.state = {
            username: '',
            values: null,
            wheel: null,
            personality: null,
            journal: null
        };
        
        this.currentScreen = 'welcome-screen';

        // Load data from LocalStorage
        this.loadState();

        // Initialize Background Canvas
        this.canvas = new AuraCanvas('aura-canvas');

        // Initialize Modules
        this.valuesModule = new ValuesSorter(this);
        this.wheelModule = new LifeWheel(this);
        this.personalityModule = new PersonalityPrism(this);
        this.journalModule = new PromptJournal(this);

        this.initDOMElements();
        this.bindGlobalEvents();
        this.launch();
    }

    initDOMElements() {
        this.usernameInput = document.getElementById('username-input');
        this.startBtn = document.getElementById('start-journey-btn');
        
        // Greeting & resets
        this.greetingName = document.getElementById('greeting-name');
        this.resetBtn = document.getElementById('reset-data-btn');

        // Dashboard indicators
        this.progressRing = document.querySelector('.progress-ring__circle');
        this.progressPercentageText = document.getElementById('progress-percentage');
        this.blueprintStatusText = document.getElementById('blueprint-status-text');
        this.viewBlueprintBtn = document.getElementById('view-blueprint-btn');

        // Synthesis Blueprint panel
        this.bpName = document.getElementById('bp-user-name');
        this.bpDate = document.getElementById('bp-date');
        this.bpPrintBtn = document.getElementById('print-blueprint-btn');
    }

    bindGlobalEvents() {
        // Welcome Start Click
        this.startBtn.addEventListener('click', () => {
            const name = this.usernameInput.value.trim();
            if (name) {
                this.state.username = name;
                this.saveState();
                this.showToast(`Welcome to your inner space, ${name}.`, 'check');
                this.showScreen('dashboard-screen');
            } else {
                this.showToast('Please enter a name to begin.', 'info');
                this.usernameInput.focus();
            }
        });

        // Enter key in name field
        this.usernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.startBtn.click();
        });

        // Reset All Data
        this.resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset your journey? All saved values, life satisfaction ratings, personality scores, and journal entries will be deleted permanently.")) {
                localStorage.removeItem('innerspace_journey_state');
                this.state = {
                    username: '',
                    values: null,
                    wheel: null,
                    personality: null,
                    journal: null
                };
                this.showToast('Journey reset successfully.', 'info');
                this.usernameInput.value = '';
                this.showScreen('welcome-screen');
            }
        });

        // Pathway Card Click Actions
        document.querySelectorAll('.start-module-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-target');
                this.showScreen(`${target}-screen`);
            });
        });

        // Back-to-Dashboard Header Buttons
        document.querySelectorAll('.back-to-dashboard-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showScreen('dashboard-screen');
            });
        });

        // Reveal Blueprint Button
        this.viewBlueprintBtn.addEventListener('click', () => {
            this.showScreen('blueprint-screen');
        });

        // Print PDF Button
        this.bpPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

    launch() {
        // Redirect directly to dashboard if username is already cached
        if (this.state.username) {
            this.showScreen('dashboard-screen');
        } else {
            this.showScreen('welcome-screen');
        }
    }

    /**
     * SPA Screen Router
     */
    showScreen(screenId) {
        // Fade out active screen
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            activeScreen.classList.remove('active');
        }

        // Activate new screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            this.currentScreen = screenId;
            targetScreen.classList.add('active');
            
            // Trigger specific module start hooks
            if (screenId === 'dashboard-screen') {
                this.updateDashboardProgress();
            } else if (screenId === 'values-screen') {
                this.valuesModule.start();
            } else if (screenId === 'wheel-screen') {
                this.wheelModule.start();
            } else if (screenId === 'personality-screen') {
                this.personalityModule.start();
            } else if (screenId === 'journal-screen') {
                this.journalModule.start();
            } else if (screenId === 'blueprint-screen') {
                this.renderBlueprintPage();
            }
        }
        
        // Ensure Lucide icon CDN loads correctly
        lucide.createIcons();
    }

    /**
     * Compute and render current modules completion progress
     */
    updateDashboardProgress() {
        this.greetingName.innerText = this.state.username;
        
        let completedCount = 0;
        const modules = ['values', 'wheel', 'personality', 'journal'];
        
        modules.forEach(mod => {
            const card = document.querySelector(`.pathway-card[data-module="${mod}"]`);
            const btnSpan = card.querySelector('.start-module-btn span');
            const statusLabel = card.querySelector('.status-label');
            
            if (this.state[mod]) {
                completedCount++;
                card.classList.add('complete');
                btnSpan.innerText = 'Review Pathway';
                statusLabel.innerText = 'Complete';
            } else {
                card.classList.remove('complete');
                btnSpan.innerText = 'Start Pathway';
                statusLabel.innerText = 'Incomplete';
            }
        });

        const percentage = (completedCount / 4) * 100;
        
        // Update circular SVG progress
        const radius = 50;
        const circumference = 2 * Math.PI * radius; // ~314.16
        const offset = circumference - (percentage / 100) * circumference;
        
        this.progressRing.style.strokeDashoffset = offset;
        this.progressPercentageText.innerText = `${percentage}%`;

        // Update Blueprint widget status
        if (completedCount === 4) {
            this.blueprintStatusText.innerText = "Congratulations! Your blueprint is complete.";
            this.viewBlueprintBtn.disabled = false;
        } else {
            this.blueprintStatusText.innerText = `${4 - completedCount} more pathways needed to unlock blueprint.`;
            this.viewBlueprintBtn.disabled = true;
        }
    }

    /**
     * Synthesize values, wheel, personality and journal data into blueprint
     */
    renderBlueprintPage() {
        this.bpName.innerText = this.state.username;
        
        const dateObj = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        this.bpDate.innerText = dateObj.toLocaleDateString('en-US', options);

        // 1. Render Personality Archetype
        const pers = this.state.personality;
        if (pers) {
            document.getElementById('bp-archetype-name').innerText = pers.archetype.name;
            document.getElementById('bp-archetype-desc').innerText = pers.archetype.desc;
            
            document.getElementById('bp-val-curiosity').innerText = `${pers.scores.curiosity}%`;
            document.getElementById('bp-val-resilience').innerText = `${pers.scores.resilience}%`;
            document.getElementById('bp-val-empathy').innerText = `${pers.scores.empathy}%`;
            document.getElementById('bp-val-focus').innerText = `${pers.scores.focus}%`;
        }

        // 2. Render Core Values
        const valList = document.getElementById('bp-values-list');
        valList.innerHTML = '';
        if (this.state.values) {
            this.state.values.forEach((val, idx) => {
                const row = document.createElement('div');
                row.className = 'bp-value-row';
                row.innerHTML = `
                    <div class="bp-val-rank">${idx + 1}</div>
                    <div class="bp-val-info">
                        <h4>${val.name}</h4>
                        <p>${val.desc}</p>
                    </div>
                `;
                valList.appendChild(row);
            });
        }

        // 3. Render Life Wheel static radar & gaps
        const bpSvg = document.getElementById('bp-wheel-static-svg');
        if (this.state.wheel) {
            // Put scores in module instance, then draw
            this.wheelModule.scores = { ...this.state.wheel };
            this.wheelModule.drawRadar(bpSvg, false);

            // Compute alignment gaps
            // Gap = Desired Growth - Current Satisfaction
            let gaps = [];
            WHEEL_CATEGORIES.forEach(cat => {
                const s = this.state.wheel[cat.id];
                const diff = s.growth - s.satis;
                gaps.push({ id: cat.id, name: cat.name, diff: diff });
            });

            // Sort gaps descending (largest gap first)
            gaps.sort((a, b) => b.diff - a.diff);

            // List top 2 areas that need attention
            const gapsList = document.getElementById('bp-gaps-list');
            gapsList.innerHTML = '';
            
            // Take the top 2 positive gaps, or top 2 categories
            const targetGaps = gaps.slice(0, 2);
            targetGaps.forEach(gap => {
                const gapCard = document.createElement('div');
                gapCard.className = 'bp-gap-card';
                
                let valLabel = gap.diff > 0 ? `+${gap.diff} Growth Target` : 'Alighted';
                const adviceText = WHEEL_ADVICE[gap.id] || 'Continue supporting this category.';
                
                gapCard.innerHTML = `
                    <h4>${gap.name} <span style="font-size:0.75rem;font-weight:400;color:var(--text-muted)">(${valLabel})</span></h4>
                    <p>${adviceText}</p>
                `;
                gapsList.appendChild(gapCard);
            });
        }

        // 4. Render Journal reflection stats
        const j = this.state.journal;
        if (j) {
            document.getElementById('bp-sentiment-text').innerText = `${j.sentiment.label}`;
            
            const cloud = document.getElementById('bp-theme-cloud');
            cloud.innerHTML = '';
            j.themes.forEach(t => {
                const tag = document.createElement('span');
                tag.className = 'theme-tag';
                tag.innerText = t;
                cloud.appendChild(tag);
            });
        }
    }

    /**
     * Save data from a single module and update progress
     */
    saveModuleData(moduleKey, data) {
        this.state[moduleKey] = data;
        this.saveState();
    }

    loadState() {
        const cached = localStorage.getItem('innerspace_journey_state');
        if (cached) {
            try {
                this.state = JSON.parse(cached);
            } catch (e) {
                console.error("Error reading saved state from localStorage", e);
            }
        }
    }

    saveState() {
        localStorage.setItem('innerspace_journey_state', JSON.stringify(this.state));
    }

    /**
     * Custom Toast Notification System
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const tMsg = document.getElementById('toast-message');
        const tIcon = document.getElementById('toast-icon');

        tMsg.innerText = message;

        // Change icons and colors
        if (type === 'check') {
            tIcon.setAttribute('data-lucide', 'check-circle');
            tIcon.style.color = 'var(--accent-teal)';
        } else if (type === 'warning') {
            tIcon.setAttribute('data-lucide', 'alert-triangle');
            tIcon.style.color = 'var(--accent-amber)';
        } else {
            tIcon.setAttribute('data-lucide', 'info');
            tIcon.style.color = 'var(--accent-blue)';
        }

        lucide.createIcons();

        // Animation show trigger
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new InnerSpaceApp();
    
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
});
