/**
 * Module 2: Life Balance Wheel
 */

export const WHEEL_CATEGORIES = [
    { id: 'health', name: 'Health & Wellness', icon: 'heart', desc: 'Vitality, fitness, nutrition, and mental health.' },
    { id: 'career', name: 'Career & Purpose', icon: 'briefcase', desc: 'Job satisfaction, sense of purpose, and talents.' },
    { id: 'finance', name: 'Wealth & Finance', icon: 'dollar-sign', desc: 'Budget control, savings, and financial peace.' },
    { id: 'relations', name: 'Relationships', icon: 'users', desc: 'Family, friendships, romance, and belonging.' },
    { id: 'growth', name: 'Personal Growth', icon: 'sparkles', desc: 'Learning, self-awareness, therapy, and books.' },
    { id: 'fun', name: 'Fun & Recreation', icon: 'smile', desc: 'Hobbies, travel, play, relaxation, and hobbies.' },
    { id: 'environment', name: 'Physical Space', icon: 'home', desc: 'Home comfort, safety, order, and nature access.' },
    { id: 'spirit', name: 'Mindfulness & Spirit', icon: 'compass', desc: 'Inner calm, mediation, and cosmic alignment.' }
];

export const WHEEL_ADVICE = {
    health: 'Prioritize basic foundations: target 7.5 hours of sleep, plan three 20-minute active walks a week, or schedule that physical exam you have been delaying.',
    career: 'Write down what components of your daily work bring you energy vs. what drains you. Consider seeking a mentor or drafting a list of skills you want to learn next.',
    finance: 'Create a simple, stress-free tracking system (like a 50/30/20 budget). Automate a small weekly savings amount, even if it is just $10.',
    relations: 'Schedule one direct, focused conversation with a close friend or family member. Practice deep, non-judgmental listening without checking your phone.',
    growth: 'Set aside 15 minutes of quiet time a day. Start a tiny daily reading habit (5 pages) or select one therapeutic or self-discovery exercise to work through weekly.',
    fun: 'Identify one hobby or creative act you used to love as a child. Dedicate 2 hours this weekend to doing it solely for play, with no pressure for productivity.',
    environment: 'Spend 20 minutes decluttering a single space (like your desk or bedroom drawer). Introduce one plant or adjust the lighting to create a calm pocket.',
    spirit: 'Begin a 5-minute morning gratitude or breathing practice. Simply sit quietly, observe your breath, and let thoughts drift by like clouds.'
};

export class LifeWheel {
    constructor(app) {
        this.app = app;
        
        // State (Default values for satisfaction and desired growth)
        this.scores = {};
        WHEEL_CATEGORIES.forEach(cat => {
            this.scores[cat.id] = { satis: 5, growth: 7 };
        });

        this.svgCenter = 200;
        this.svgRadius = 140;

        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.svg = document.getElementById('interactive-wheel-svg');
        this.slidersContainer = document.getElementById('wheel-sliders-container');
        this.saveBtn = document.getElementById('save-wheel-btn');
    }

    bindEvents() {
        this.saveBtn.addEventListener('click', () => {
            this.app.saveModuleData('wheel', this.scores);
            this.app.showToast('Life Balance Profile Saved!', 'check');
            this.app.showScreen('dashboard-screen');
        });
    }

    /**
     * Start/Reset the Life Wheel module
     */
    start() {
        // Load existing data if available
        if (this.app.state.wheel) {
            this.scores = { ...this.app.state.wheel };
        } else {
            // Reset to defaults
            WHEEL_CATEGORIES.forEach(cat => {
                this.scores[cat.id] = { satis: 5, growth: 7 };
            });
        }

        this.renderSliders();
        this.drawRadar(this.svg, true);
    }

    renderSliders() {
        this.slidersContainer.innerHTML = '';
        
        WHEEL_CATEGORIES.forEach(cat => {
            const data = this.scores[cat.id];
            const card = document.createElement('div');
            card.className = 'slider-group-card';
            card.innerHTML = `
                <div class="slider-header">
                    <div class="slider-title-area">
                        <i data-lucide="${cat.icon}"></i>
                        <h4>${cat.name}</h4>
                    </div>
                    <div class="slider-values-display">
                        S: <span class="slider-num-box s-val" id="num-s-${cat.id}">${data.satis}</span> | 
                        G: <span class="slider-num-box g-val" id="num-g-${cat.id}">${data.growth}</span>
                    </div>
                </div>
                <div class="slider-inputs-row">
                    <div class="single-slider-row satis-slider">
                        <label>Satisfaction</label>
                        <input type="range" min="1" max="10" value="${data.satis}" id="slider-s-${cat.id}">
                    </div>
                    <div class="single-slider-row growth-slider">
                        <label>Desired Growth</label>
                        <input type="range" min="1" max="10" value="${data.growth}" id="slider-g-${cat.id}">
                    </div>
                </div>
            `;

            // Bind slider change events
            const sSlider = card.querySelector(`#slider-s-${cat.id}`);
            const gSlider = card.querySelector(`#slider-g-${cat.id}`);
            const sNum = card.querySelector(`#num-s-${cat.id}`);
            const gNum = card.querySelector(`#num-g-${cat.id}`);

            sSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.scores[cat.id].satis = val;
                sNum.innerText = val;
                this.drawRadar(this.svg, true);
            });

            gSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.scores[cat.id].growth = val;
                gNum.innerText = val;
                this.drawRadar(this.svg, true);
            });

            this.slidersContainer.appendChild(card);
        });

        lucide.createIcons();
    }

    /**
     * Compute coordinate point from score, index, and center
     */
    getPointCoords(catIndex, score) {
        const angle = -Math.PI / 2 + (catIndex * Math.PI / 4);
        const radius = (score / 10) * this.svgRadius;
        const x = this.svgCenter + radius * Math.cos(angle);
        const y = this.svgCenter + radius * Math.sin(angle);
        return { x, y };
    }

    /**
     * Renders the SVG dual radar chart (Satisfaction vs Growth)
     */
    drawRadar(targetSvg, interactive = false) {
        if (!targetSvg) return;
        targetSvg.innerHTML = '';

        const cx = this.svgCenter;
        const cy = this.svgCenter;

        // 1. Draw concentric grid circles (1 to 10)
        for (let i = 1; i <= 10; i++) {
            const r = (i / 10) * this.svgRadius;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', r);
            circle.setAttribute('class', 'radar-grid-circle');
            // Subtle dashed style for inner grids
            if (i < 10) {
                circle.setAttribute('stroke-dasharray', '3 3');
                circle.setAttribute('stroke', 'rgba(255,255,255,0.03)');
            } else {
                circle.setAttribute('stroke', 'rgba(255,255,255,0.15)');
            }
            targetSvg.appendChild(circle);
        }

        // 2. Draw axes and labels
        WHEEL_CATEGORIES.forEach((cat, idx) => {
            const angle = -Math.PI / 2 + (idx * Math.PI / 4);
            const outerPoint = this.getPointCoords(idx, 10);

            // Axis line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', cx);
            line.setAttribute('y1', cy);
            line.setAttribute('x2', outerPoint.x);
            line.setAttribute('y2', outerPoint.y);
            line.setAttribute('class', 'radar-axis-line');
            targetSvg.appendChild(line);

            // Labels at outer edge
            const labelDist = this.svgRadius + 18;
            const lx = cx + labelDist * Math.cos(angle);
            const ly = cx + labelDist * Math.sin(angle) + 3; // Shift down slightly
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', lx);
            text.setAttribute('y', ly);
            text.setAttribute('class', 'radar-label');
            
            // Adjust anchor based on horizontal position
            if (Math.abs(Math.cos(angle)) < 0.1) {
                text.setAttribute('text-anchor', 'middle');
            } else if (Math.cos(angle) > 0) {
                text.setAttribute('text-anchor', 'start');
            } else {
                text.setAttribute('text-anchor', 'end');
            }

            text.textContent = cat.name.split(' ')[0]; // short text for svg
            targetSvg.appendChild(text);
        });

        // 3. Render Satisfaction and Growth polygons
        let satisPathPoints = [];
        let growthPathPoints = [];

        WHEEL_CATEGORIES.forEach((cat, idx) => {
            const score = this.scores[cat.id] || { satis: 5, growth: 7 };
            satisPathPoints.push(this.getPointCoords(idx, score.satis));
            growthPathPoints.push(this.getPointCoords(idx, score.growth));
        });

        // Create Path strings
        const makePathD = (points) => {
            return `M ${points[0].x} ${points[0].y} ` + 
                   points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + 
                   ' Z';
        };

        // Draw Satisfaction Polygon
        const satisPoly = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        satisPoly.setAttribute('d', makePathD(satisPathPoints));
        satisPoly.setAttribute('class', 'radar-area-satis');
        targetSvg.appendChild(satisPoly);

        // Draw Growth Polygon
        const growthPoly = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        growthPoly.setAttribute('d', makePathD(growthPathPoints));
        growthPoly.setAttribute('class', 'radar-area-growth');
        targetSvg.appendChild(growthPoly);

        // 4. Draw interactive handles (if interactive mode is true)
        if (interactive) {
            WHEEL_CATEGORIES.forEach((cat, idx) => {
                const score = this.scores[cat.id];
                
                // Satisfaction Handle (Teal)
                const sPt = satisPathPoints[idx];
                const sHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                sHandle.setAttribute('cx', sPt.x);
                sHandle.setAttribute('cy', sPt.y);
                sHandle.setAttribute('r', 5);
                sHandle.setAttribute('fill', 'var(--accent-teal)');
                sHandle.setAttribute('class', 'radar-handle');
                sHandle.setAttribute('title', `${cat.name} Satisfaction: ${score.satis}`);
                
                // Clicking handle increments score
                sHandle.addEventListener('click', () => {
                    let next = (score.satis % 10) + 1;
                    this.scores[cat.id].satis = next;
                    const slider = document.getElementById(`slider-s-${cat.id}`);
                    if (slider) slider.value = next;
                    const label = document.getElementById(`num-s-${cat.id}`);
                    if (label) label.innerText = next;
                    this.drawRadar(targetSvg, true);
                });
                
                targetSvg.appendChild(sHandle);

                // Growth Handle (Violet)
                const gPt = growthPathPoints[idx];
                const gHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                gHandle.setAttribute('cx', gPt.x);
                gHandle.setAttribute('cy', gPt.y);
                gHandle.setAttribute('r', 5);
                gHandle.setAttribute('fill', 'var(--accent-violet)');
                gHandle.setAttribute('class', 'radar-handle');
                gHandle.setAttribute('title', `${cat.name} Growth: ${score.growth}`);

                gHandle.addEventListener('click', () => {
                    let next = (score.growth % 10) + 1;
                    this.scores[cat.id].growth = next;
                    const slider = document.getElementById(`slider-g-${cat.id}`);
                    if (slider) slider.value = next;
                    const label = document.getElementById(`num-g-${cat.id}`);
                    if (label) label.innerText = next;
                    this.drawRadar(targetSvg, true);
                });

                targetSvg.appendChild(gHandle);
            });
        }
    }
}
