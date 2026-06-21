/**
 * InnerSpace App Coordinator & State Manager
 */

import { AuraCanvas } from './canvas.js';
import { ValuesSorter } from './values.js';
import { LifeWheel, WHEEL_CATEGORIES, WHEEL_ADVICE } from './wheel.js';
import { PersonalityPrism } from './personality.js';
import { PromptJournal } from './journal.js';
import { BreathSync } from './breath.js';
import { AlignmentHistory } from './history.js';

/**
 * Escape user-derived strings before they are injected via innerHTML.
 * Shared across modules to prevent stored-XSS from names / journal text / themes.
 */
export function safeCreateIcons() {
    // Guard against the Lucide CDN script not being loaded yet (e.g. offline
    // first-paint before the SW has cached it, or a slow CDN).
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

export function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

const ZEN_QUOTES = [
    { text: "Who looks outside, dreams; who looks inside, awakes.", author: "Carl Jung" },
    { text: "Mindfulness isn't difficult, we just need to remember to do it.", author: "Sharon Salzberg" },
    { text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" },
    { text: "Quiet the mind and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
    { text: "Breathe in deeply to bring your mind home to your body.", author: "Thich Nhat Hanh" },
    { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
    { text: "You are a volume in the divine book. A mirror to the power that created you.", author: "Rumi" },
    { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
    { text: "Muddy water is best cleared by leaving it alone.", author: "Alan Watts" },
    { text: "To understand everything is to forgive everything.", author: "Gautama Buddha" }
];

class InnerSpaceApp {
    constructor() {
        this.state = {
            username: '',
            values: null,
            wheel: null,
            personality: null,
            journal: null,
            aura: 'violet',
            snapshots: [],
            breathHistory: [],
            flowRate: 40
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
        this.breathModule = new BreathSync(this);
        this.historyModule = new AlignmentHistory(this);

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

        // PWA Install Banner & Aura Selectors
        this.installBanner = document.getElementById('pwa-install-banner');
        this.installBtn = document.getElementById('pwa-install-btn');
        this.dismissBtn = document.getElementById('pwa-dismiss-btn');
        this.auraSelectorButtons = document.querySelectorAll('.aura-dot-btn');

        // Navigation elements
        this.navBar = document.getElementById('main-nav-bar');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.blueprintNavLink = document.getElementById('nav-link-blueprint');

        // Dashboard Aura Flow check-in
        this.flowSlider = document.getElementById('aura-flow-slider');
        this.flowIntensityLbl = document.getElementById('flow-intensity-lbl');

        // Zen Quotes elements
        this.quoteText = document.getElementById('zen-quote-text');
        this.quoteAuthor = document.getElementById('zen-quote-author');
    }

    bindGlobalEvents() {
        // Aura Theme Selector buttons
        this.auraSelectorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aura = e.currentTarget.getAttribute('data-aura');
                this.setAuraTheme(aura);
            });
        });

        // PWA Install Prompt handling
        this.deferredPrompt = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            if (this.installBanner) {
                this.installBanner.style.display = 'flex';
            }
        });

        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => {
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    this.deferredPrompt.userChoice.then(choiceResult => {
                        if (choiceResult.outcome === 'accepted') {
                            this.showToast('InnerSpace added to device!', 'check');
                        }
                        this.deferredPrompt = null;
                        if (this.installBanner) this.installBanner.style.display = 'none';
                    });
                }
            });
        }

        if (this.dismissBtn) {
            this.dismissBtn.addEventListener('click', () => {
                if (this.installBanner) {
                    this.installBanner.style.display = 'none';
                }
            });
        }

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
                    journal: null,
                    aura: 'violet',
                    snapshots: [],
                    breathHistory: [],
                    flowRate: 40
                };
                this.setAuraTheme('violet');
                this.setAuraFlow(40);
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

    setAuraTheme(aura) {
        document.body.className = '';
        if (aura && aura !== 'violet') {
            document.body.classList.add(`aura-${aura}`);
        }
        
        this.state.aura = aura;
        this.saveState();
        
        this.auraSelectorButtons.forEach(btn => {
            const isActive = btn.getAttribute('data-aura') === aura;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        
        if (this.canvas) {
            this.canvas.updateColors(aura);
        }
    }

    setAuraFlow(val) {
        this.state.flowRate = val;
        this.saveState();
        
        if (this.canvas) {
            this.canvas.flowRate = val / 40;
        }

        if (this.flowSlider) {
            this.flowSlider.value = val;
        }

        let lbl = "Balanced";
        if (val < 18) lbl = "Quiet & Introspective";
        else if (val < 32) lbl = "Calm Flow";
        else if (val < 65) lbl = "Balanced";
        else if (val < 100) lbl = "High Energy";
        else lbl = "Radiant & Rapid";
        
        if (this.flowIntensityLbl) {
            this.flowIntensityLbl.innerText = lbl;
        }
    }

    launch() {
        this.setAuraTheme(this.state.aura || 'violet');
        this.setAuraFlow(this.state.flowRate || 40);

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
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            activeScreen.classList.remove('active');
        }

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            this.currentScreen = screenId;
            targetScreen.classList.add('active');
            
            // 1. Navigation bar visibility
            const navTabs = ['dashboard-screen', 'breath-screen', 'history-screen', 'blueprint-screen'];
            if (navTabs.includes(screenId)) {
                this.navBar.style.display = 'flex';
                
                // Highlight active nav tab
                this.navLinks.forEach(link => {
                    const isActive = link.getAttribute('data-tab') === screenId;
                    link.classList.toggle('active', isActive);
                    if (isActive) {
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            } else {
                this.navBar.style.display = 'none';
            }

            // 2. Trigger specific module start hooks
            if (screenId === 'dashboard-screen') {
                this.updateDashboardProgress();
                this.displayRandomZenQuote();
            } else if (screenId === 'values-screen') {
                this.valuesModule.start();
            } else if (screenId === 'wheel-screen') {
                this.wheelModule.start();
            } else if (screenId === 'personality-screen') {
                this.personalityModule.start();
            } else if (screenId === 'journal-screen') {
                this.journalModule.start();
            } else if (screenId === 'breath-screen') {
                this.breathModule.start();
            } else if (screenId === 'history-screen') {
                this.historyModule.start();
            } else if (screenId === 'blueprint-screen') {
                this.renderBlueprintPage();
            }
        }

        safeCreateIcons();
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

        // Update Blueprint widget status & nav tab
        if (completedCount === 4) {
            this.blueprintStatusText.innerText = "Congratulations! Your blueprint is complete.";
            this.viewBlueprintBtn.disabled = false;
            this.blueprintNavLink.disabled = false;
        } else {
            this.blueprintStatusText.innerText = `${4 - completedCount} more pathways needed to unlock blueprint.`;
            this.viewBlueprintBtn.disabled = true;
            this.blueprintNavLink.disabled = true;
        }
    }

    displayRandomZenQuote() {
        if (!this.quoteText || !this.quoteAuthor) return;
        const randomQuote = ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)];
        this.quoteText.innerText = `"${randomQuote.text}"`;
        this.quoteAuthor.innerText = `— ${randomQuote.author}`;
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
                        <h4>${escapeHtml(val.name)}</h4>
                        <p>${escapeHtml(val.desc)}</p>
                    </div>
                `;
                valList.appendChild(row);
            });
        }

        // 3. Render Life Wheel static radar & gaps
        const bpSvg = document.getElementById('bp-wheel-static-svg');
        if (this.state.wheel) {
            this.wheelModule.scores = { ...this.state.wheel };
            this.wheelModule.drawRadar(bpSvg, false);

            let gaps = [];
            WHEEL_CATEGORIES.forEach(cat => {
                const s = this.state.wheel[cat.id];
                const diff = s.growth - s.satis;
                gaps.push({ id: cat.id, name: cat.name, diff: diff });
            });

            gaps.sort((a, b) => b.diff - a.diff);

            const gapsList = document.getElementById('bp-gaps-list');
            gapsList.innerHTML = '';
            
            const targetGaps = gaps.slice(0, 2);
            targetGaps.forEach(gap => {
                const gapCard = document.createElement('div');
                gapCard.className = 'bp-gap-card';
                
                let valLabel = gap.diff > 0 ? `+${gap.diff} Growth Target` : 'Aligned';
                const adviceText = WHEEL_ADVICE[gap.id] || 'Continue supporting this category.';

                gapCard.innerHTML = `
                    <h4>${escapeHtml(gap.name)} <span style="font-size:0.75rem;font-weight:400;color:var(--text-muted)">(${valLabel})</span></h4>
                    <p>${escapeHtml(adviceText)}</p>
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

        // 5. Render Spirit Element Card
        const elem = this.computeSpiritElement();
        if (elem) {
            document.getElementById('bp-element-name').innerText = elem.name;
            document.getElementById('bp-element-name').style.color = `var(--accent-${elem.id === 'fire' ? 'rose' : (elem.id === 'air' ? 'teal' : (elem.id === 'water' ? 'blue' : 'amber'))})`;
            document.getElementById('bp-element-desc').innerText = elem.desc;
            
            const svgIcon = document.getElementById('bp-element-icon-svg');
            svgIcon.innerHTML = elem.svg;
            
            const mainIcon = document.getElementById('bp-element-main-icon');
            if (mainIcon) {
                const iconsMap = { fire: 'flame', air: 'wind', water: 'droplets', earth: 'mountain' };
                mainIcon.setAttribute('data-lucide', iconsMap[elem.id] || 'droplet');
            }
        }
    }

    computeSpiritElement() {
        const pers = this.state.personality;
        if (!pers) return null;

        const { curiosity, resilience, empathy, focus } = pers.scores;
        
        const elements = [
            {
                id: 'fire',
                name: 'Flame (Fire)',
                tag: 'Focus & Drive',
                desc: 'Your spirit aligns with Fire. Driven by Focus and Resilience, you forge path milestones with heat and intense dedication. Obstacles feed your strength rather than extinguishing it. Beware of burnout and remember to nourish your boundaries.',
                svg: `<path d="M50 85 C30 75 15 45 35 20 C30 30 32 40 38 45 C40 25 50 5 70 25 C58 30 55 40 60 50 C70 40 75 30 73 17 C82 40 80 65 50 85 Z" fill="none" stroke="var(--accent-rose)" stroke-width="3" stroke-linejoin="round" class="element-glow-glow"/>`
            },
            {
                id: 'air',
                name: 'Breeze (Air)',
                tag: 'Curiosity & Exploration',
                desc: 'Your spirit aligns with Air. Driven by Curiosity and Openness, you drift freely between thoughts, ideas, and interests. You are a natural innovator, lifting heavy ideas with ease. Watch out for restlessness, and anchor your projects down.',
                svg: `<path d="M15 45 C35 45 35 35 55 35 C70 35 75 45 65 50 C60 52 50 45 55 38 M25 60 C40 60 45 52 60 52 C75 52 80 62 70 65 C62 67 55 58 60 53 M20 25 C30 25 35 18 45 18 C55 18 60 25 52 28" fill="none" stroke="var(--accent-teal)" stroke-width="3" stroke-linecap="round" class="element-glow-glow"/>`
            },
            {
                id: 'water',
                name: 'Ocean (Water)',
                tag: 'Empathy & Depth',
                desc: 'Your spirit aligns with Water. Guided by Empathy and deep connection, you flow gracefully around structural obstacles. You hold massive emotional intelligence, healing and connecting those around you. Watch out for taking on others\' weights.',
                svg: `<path d="M10 50 C20 40 30 40 40 50 C50 60 60 60 70 50 C80 40 90 40 100 50 M10 70 C20 60 30 60 40 70 C50 80 60 80 70 70 C80 60 90 60 100 70 M10 30 C20 20 30 20 40 30 C50 40 60 40 70 30 C80 20 90 20 100 30" fill="none" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" class="element-glow-glow"/>`
            },
            {
                id: 'earth',
                name: 'Earth (Stone)',
                tag: 'Resilience & Safety',
                desc: 'Your spirit aligns with Earth. Anchored by Resilience, safety, and stability, you are unshakeable. You build foundations that endure through time. Others look to you for protection and ground. Remember to remain flexible to unexpected changes.',
                svg: `<polygon points="50,15 15,85 85,85" fill="none" stroke="var(--accent-amber)" stroke-width="3" stroke-linejoin="round" class="element-glow-glow"/><polygon points="65,45 45,85 85,85" fill="none" stroke="var(--accent-amber)" stroke-width="1.5" stroke-linejoin="round"/>`
            }
        ];

        const dims = [
            { id: 'fire', val: (focus + resilience) / 2 },
            { id: 'air', val: curiosity },
            { id: 'water', val: empathy },
            { id: 'earth', val: resilience }
        ];

        dims.sort((a, b) => b.val - a.val);
        return elements.find(el => el.id === dims[0].id);
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
                const parsed = JSON.parse(cached) || {};
                // Merge loaded data OVER the defaults so newer default keys
                // (e.g. flowRate / snapshots / breathHistory) are never dropped
                // when reading an older saved blob.
                this.state = {
                    ...this.state,
                    ...parsed,
                    // preserve array defaults if the saved value is missing/not an array
                    snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : this.state.snapshots,
                    breathHistory: Array.isArray(parsed.breathHistory) ? parsed.breathHistory : this.state.breathHistory
                };
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

        safeCreateIcons();

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
