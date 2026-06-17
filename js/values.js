/**
 * Module 1: Core Values Sorter
 */

export const VALUES_DATA = [
    { id: 'authenticity', name: 'Authenticity', desc: 'Living in alignment with your true self, values, and beliefs.', tag: 'Self-Direction' },
    { id: 'compassion', name: 'Compassion', desc: 'Showing kindness, empathy, and support to others and yourself.', tag: 'Benevolence' },
    { id: 'adventure', name: 'Adventure', desc: 'Seeking novel, exciting, and risk-taking experiences.', tag: 'Stimulation' },
    { id: 'security', name: 'Security', desc: 'Establishing safety, stability, and predictability in life.', tag: 'Safety' },
    { id: 'growth', name: 'Growth', desc: 'Striving for continuous learning, self-discovery, and development.', tag: 'Achievement' },
    { id: 'connection', name: 'Connection', desc: 'Building deep, intimate, and meaningful relationships.', tag: 'Benevolence' },
    { id: 'creativity', name: 'Creativity', desc: 'Expressing unique ideas, artistic pursuits, or innovation.', tag: 'Self-Direction' },
    { id: 'wisdom', name: 'Wisdom', desc: 'Seeking deep understanding, truth, and perspective in life.', tag: 'Universalism' },
    { id: 'freedom', name: 'Freedom', desc: 'Valuing independence, autonomy, and choosing your own path.', tag: 'Self-Direction' },
    { id: 'contribution', name: 'Contribution', desc: 'Making a positive difference and helping the world or community.', tag: 'Universalism' },
    { id: 'balance', name: 'Balance', desc: 'Striving for harmony and moderation across all life aspects.', tag: 'Conformity' },
    { id: 'joy', name: 'Joy & Play', desc: 'Prioritizing fun, laughter, lightness, and spontaneous happiness.', tag: 'Hedonism' },
    { id: 'integrity', name: 'Integrity', desc: 'Acting with honesty, moral principles, and ethical consistency.', tag: 'Conformity' },
    { id: 'health', name: 'Health & Wellness', desc: 'Nurturing physical vitality, mental clarity, and overall wellbeing.', tag: 'Safety' },
    { id: 'courage', name: 'Courage', desc: 'Facing fears, taking moral stands, and stepping out of comfort.', tag: 'Stimulation' },
    { id: 'simplicity', name: 'Simplicity', desc: 'Focusing on what is essential and letting go of excess clutter.', tag: 'Tradition' },
    { id: 'respect', name: 'Respect', desc: 'Treating yourself and others with high regard and dignity.', tag: 'Conformity' },
    { id: 'gratitude', name: 'Gratitude', desc: 'Appreciating the gifts, kindnesses, and experiences of life.', tag: 'Tradition' },
    { id: 'excellence', name: 'Excellence', desc: 'Striving to perform at a high level and deliver your best quality.', tag: 'Achievement' },
    { id: 'community', name: 'Community', desc: 'Feeling a sense of belonging and support within a collective.', tag: 'Benevolence' },
    { id: 'influence', name: 'Influence', desc: 'Leading, guiding, or inspiring others towards positive change.', tag: 'Power' },
    { id: 'peace', name: 'Inner Peace', desc: 'Cultivating serenity, emotional stability, and mental calm.', tag: 'Tradition' },
    { id: 'curiosity', name: 'Curiosity', desc: 'Asking questions, exploring mysteries, and remaining open-minded.', tag: 'Self-Direction' },
    { id: 'resilience', name: 'Resilience', desc: 'Overcoming setbacks, enduring hardships, and persisting.', tag: 'Achievement' }
];

export class ValuesSorter {
    constructor(app) {
        this.app = app;
        
        // Sorting State
        this.unsorted = [...VALUES_DATA];
        this.sorted = {
            high: [],
            medium: [],
            low: []
        };
        this.top5 = Array(5).fill(null);

        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.pile = document.getElementById('values-pile');
        this.unsortedCounter = document.getElementById('unsorted-count');
        this.proceedBtn = document.getElementById('values-proceed-to-phase2');
        
        this.previewHigh = document.getElementById('preview-high');
        this.previewMedium = document.getElementById('preview-medium');
        this.previewLow = document.getElementById('preview-low');

        this.phase1Container = document.getElementById('values-phase-1');
        this.phase2Container = document.getElementById('values-phase-2');
        this.stepIndicator1 = document.getElementById('val-step-1');
        this.stepIndicator2 = document.getElementById('val-step-2');

        this.candidatesList = document.getElementById('high-priority-candidates');
        this.slots = document.querySelectorAll('#ranked-slots .slot-content');
        this.saveBtn = document.getElementById('save-values-btn');
    }

    bindEvents() {
        // Quick Sort Buttons
        document.querySelectorAll('.quick-sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const priority = e.currentTarget.getAttribute('data-priority');
                this.sortTopCard(priority);
            });
        });

        // Keyboard navigation support for accessibility
        window.addEventListener('keydown', (e) => {
            if (this.app.currentScreen !== 'values-screen') return;
            if (this.phase1Container.classList.contains('active') && this.unsorted.length > 0) {
                if (e.key === '1') this.sortTopCard('high');
                if (e.key === '2') this.sortTopCard('medium');
                if (e.key === '3') this.sortTopCard('low');
            }
        });

        this.proceedBtn.addEventListener('click', () => this.switchToPhase2());
        
        // Value Slot Removal
        this.slots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                const rank = parseInt(e.currentTarget.parentElement.getAttribute('data-rank'));
                this.removeValueFromRank(rank);
            });
        });

        this.saveBtn.addEventListener('click', () => {
            if (this.top5.every(val => val !== null)) {
                this.app.saveModuleData('values', this.top5);
                this.app.showToast('Core Values Saved!', 'check');
                this.app.showScreen('dashboard-screen');
            }
        });
    }

    /**
     * Start/Reset the Values pathway interface
     */
    start() {
        const savedData = this.app.state.values;
        
        // Reset state
        this.unsorted = [...VALUES_DATA];
        this.sorted = { high: [], medium: [], low: [] };
        this.top5 = Array(5).fill(null);

        // UI Reset
        this.phase1Container.classList.add('active');
        this.phase2Container.classList.remove('active');
        this.stepIndicator1.classList.add('active');
        this.stepIndicator2.classList.remove('active');
        this.saveBtn.disabled = true;

        // Render card pile
        this.renderPile();
        this.updateCounters();

        if (savedData && savedData.length === 5) {
            // Pre-populate values if already completed
            // Put saved ones into 'high', rest spread
            this.sorted.high = VALUES_DATA.filter(v => savedData.some(sd => sd.id === v.id));
            const savedIds = savedData.map(v => v.id);
            this.sorted.medium = VALUES_DATA.filter(v => !savedIds.includes(v.id)).slice(0, 10);
            this.sorted.low = VALUES_DATA.filter(v => !savedIds.includes(v.id) && !this.sorted.medium.some(m => m.id === v.id));
            this.unsorted = [];
            this.top5 = [...savedData];
            
            this.renderPile(); // triggers completion screen in pile
            this.updateCounters();
        }
    }

    renderPile() {
        // Clear all except completion placeholder
        const placeholder = this.pile.querySelector('.values-completion-placeholder');
        this.pile.innerHTML = '';
        this.pile.appendChild(placeholder);

        if (this.unsorted.length === 0) {
            placeholder.style.display = 'flex';
            return;
        }

        placeholder.style.display = 'none';

        // Render top 3 cards for depth effect
        const visibleCards = this.unsorted.slice(0, 3);
        visibleCards.forEach((val, idx) => {
            const card = document.createElement('div');
            card.className = 'value-card';
            card.innerHTML = `
                <div>
                    <h3>${val.name}</h3>
                    <p>${val.desc}</p>
                </div>
                <div class="value-tag">${val.tag}</div>
            `;
            
            // Visual stacking depth styling
            card.style.zIndex = 10 - idx;
            card.style.transform = `scale(${1 - idx * 0.05}) translateY(${idx * 10}px) rotate(${(idx % 2 === 0 ? 1.5 : -1.5) * idx}deg)`;
            card.style.opacity = 1 - idx * 0.25;

            // Make top card draggable
            if (idx === 0) {
                this.setupDragEvents(card);
            }

            this.pile.appendChild(card);
        });
    }

    setupDragEvents(card) {
        let startX, startY, moveX, moveY;
        
        card.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            card.style.transition = 'none';
        });

        card.addEventListener('mousemove', (e) => {
            if (startX === undefined) return;
            moveX = e.clientX - startX;
            moveY = e.clientY - startY;
            card.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${moveX * 0.05}deg)`;
        });

        const handleRelease = () => {
            if (startX === undefined) return;
            card.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
            
            // Check threshold for drag sorting
            if (moveX > 120) {
                // Dragged right - Medium
                this.sortTopCard('medium');
            } else if (moveY < -100 && Math.abs(moveX) < 100) {
                // Dragged up - High
                this.sortTopCard('high');
            } else if (moveX < -120) {
                // Dragged left - Low
                this.sortTopCard('low');
            } else {
                // Reset card position
                card.style.transform = 'none';
            }
            
            startX = undefined;
            startY = undefined;
            moveX = undefined;
            moveY = undefined;
        };

        card.addEventListener('mouseup', handleRelease);
        card.addEventListener('mouseleave', handleRelease);

        // Touch support
        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            card.style.transition = 'none';
        });

        card.addEventListener('touchmove', (e) => {
            if (startX === undefined) return;
            moveX = e.touches[0].clientX - startX;
            moveY = e.touches[0].clientY - startY;
            card.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${moveX * 0.05}deg)`;
        });

        card.addEventListener('touchend', () => {
            if (startX === undefined) return;
            card.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
            if (moveX > 100) {
                this.sortTopCard('medium');
            } else if (moveY < -80 && Math.abs(moveX) < 80) {
                this.sortTopCard('high');
            } else if (moveX < -100) {
                this.sortTopCard('low');
            } else {
                card.style.transform = 'none';
            }
            startX = undefined;
            startY = undefined;
        });
    }

    sortTopCard(priority) {
        if (this.unsorted.length === 0) return;
        
        const cardVal = this.unsorted.shift();
        this.sorted[priority].push(cardVal);
        
        // Play quick feedback animation on drop-zones
        const zone = document.getElementById(`zone-${priority}`);
        if (zone) {
            zone.style.transform = 'scale(1.03)';
            setTimeout(() => zone.style.transform = 'none', 150);
        }

        this.renderPile();
        this.updateCounters();
        this.app.showToast(`Sorted: ${cardVal.name} to ${priority.toUpperCase()}`, 'info');
    }

    updateCounters() {
        this.unsortedCounter.innerText = this.unsorted.length;
        this.previewHigh.innerText = `${this.sorted.high.length} items`;
        this.previewMedium.innerText = `${this.sorted.medium.length} items`;
        this.previewLow.innerText = `${this.sorted.low.length} items`;
    }

    switchToPhase2() {
        this.phase1Container.classList.remove('active');
        this.phase2Container.classList.add('active');
        this.stepIndicator1.classList.remove('active');
        this.stepIndicator2.classList.add('active');

        this.renderCandidates();
        this.renderSlots();
    }

    renderCandidates() {
        this.candidatesList.innerHTML = '';
        
        // Candidates are High priority items. If there are fewer than 5, pull Medium priority too
        let pool = [...this.sorted.high];
        if (pool.length < 5) {
            pool = [...pool, ...this.sorted.medium];
        }
        
        if (pool.length === 0) {
            // Edge case: User put everything in low priority
            pool = [...VALUES_DATA];
        }

        pool.forEach(val => {
            const chip = document.createElement('div');
            chip.className = 'ranked-chip';
            
            // Check if already placed in top 5
            const isSelected = this.top5.some(v => v && v.id === val.id);
            if (isSelected) chip.classList.add('selected');

            chip.innerHTML = `
                <span>${val.name}</span>
                <i data-lucide="plus" style="width:14px;height:14px"></i>
            `;
            
            chip.addEventListener('click', () => {
                if (!isSelected) this.addValueToNextSlot(val);
            });

            this.candidatesList.appendChild(chip);
        });
        
        lucide.createIcons();
    }

    addValueToNextSlot(val) {
        const nextIdx = this.top5.findIndex(item => item === null);
        if (nextIdx !== -1) {
            this.top5[nextIdx] = val;
            this.renderCandidates();
            this.renderSlots();
        } else {
            this.app.showToast('You have already chosen 5 values. Remove one to replace.', 'warning');
        }
    }

    removeValueFromRank(rank) {
        const idx = rank - 1;
        if (this.top5[idx] !== null) {
            this.top5[idx] = null;
            this.renderCandidates();
            this.renderSlots();
        }
    }

    renderSlots() {
        this.top5.forEach((val, idx) => {
            const slot = this.slots[idx];
            if (val) {
                slot.className = 'slot-content filled';
                slot.innerHTML = `
                    <span><strong>${val.name}</strong> — ${val.desc}</span>
                    <i data-lucide="x" style="width:14px;height:14px;color:var(--accent-rose)"></i>
                `;
            } else {
                slot.className = 'slot-content';
                slot.innerHTML = `<span>Select priority ${idx + 1} value...</span>`;
            }
        });
        
        lucide.createIcons();

        // Enable save button only if all 5 values are ranked
        this.saveBtn.disabled = !this.top5.every(val => val !== null);
    }
}
