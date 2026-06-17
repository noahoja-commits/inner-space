/**
 * Module 3: Personality Prism
 */

export const QUIZ_QUESTIONS = [
    { id: 1, text: "I frequently find myself researching new topics simply out of sheer interest.", dim: "curiosity" },
    { id: 2, text: "I usually bounce back quickly after experiencing a setback or frustration.", dim: "resilience" },
    { id: 3, text: "I easily sense what another person is feeling, even before they explain it.", dim: "empathy" },
    { id: 4, text: "When working on a task, I easily tune out distractions and stay locked in.", dim: "focus" },
    { id: 5, text: "I enjoy exploring philosophical questions that do not have direct, concrete answers.", dim: "curiosity" },
    { id: 6, text: "I view obstacles and challenges as opportunities to learn rather than personal failures.", dim: "resilience" },
    { id: 7, text: "I often feel a strong emotional resonance when I witness someone else going through a hard time.", dim: "empathy" },
    { id: 8, text: "I prefer setting clear, step-by-step milestones before initiating a project.", dim: "focus" },
    { id: 9, text: "I actively seek out activities that push me outside of my comfort zone.", dim: "curiosity" },
    { id: 10, text: "Even under pressure, I find it relatively easy to remain steady and composed.", dim: "resilience" },
    { id: 11, text: "I place a high value on supporting others, even if it requires a personal sacrifice.", dim: "empathy" },
    { id: 12, text: "I am highly skilled at resisting short-term temptations to secure long-term goals.", dim: "focus" },
    { id: 13, text: "I find routine boring and actively look for fresh, alternative ways of doing things.", dim: "curiosity" },
    { id: 14, text: "I rarely let criticism or rejection discourage me from trying again.", dim: "resilience" },
    { id: 15, text: "I can see things clearly from another's perspective, even if I strongly disagree with them.", dim: "empathy" },
    { id: 16, text: "I pay close attention to small details to ensure tasks are completed correctly.", dim: "focus" },
    { id: 17, text: "I have a wide and highly diverse range of interests rather than concentrating on one or two.", dim: "curiosity" },
    { id: 18, text: "I believe that setbacks are temporary, and I possess the agency to change my circumstances.", dim: "resilience" },
    { id: 19, text: "People frequently open up to me and share their personal concerns and emotional thoughts.", dim: "empathy" },
    { id: 20, text: "I pride myself on my consistency and self-discipline when working toward a plan.", dim: "focus" }
];

export const ARCHETYPES = {
    explorer: {
        name: "The Wandering Mind (Explorer)",
        desc: "You are driven by a deep thirst for knowledge and novel experiences. Your curiosity is your superpower, leading you to connect disparate ideas and challenge conventional wisdom. While you excel at innovation, remember to occasionally ground your projects in focus to bring them to fruition."
    },
    anchor: {
        name: "The Steady Presence (Anchor)",
        desc: "You possess a remarkable psychological fortitude. When storms hit, you stay grounded, serving as a pillar of strength for yourself and those around you. Setbacks do not define you. Your challenge is to ensure your steady nature doesn't keep you from taking creative risks."
    },
    altruist: {
        name: "The Safe Harbor (Altruist)",
        desc: "Your heart is highly attuned to the emotional wavelengths of others. You lead with empathy, making people feel deeply seen, heard, and valued. You create supportive spaces wherever you go. Take care to set healthy emotional boundaries so you don't exhaust your energy."
    },
    strategist: {
        name: "The Precision Architect (Strategist)",
        desc: "You approach life with intent, discipline, and laser focus. You thrive on structure, clarity, and executing long-term goals. Your ability to resist distractions is exceptional. Practice staying adaptable when life throws unexpected shifts into your structured plans."
    },
    visionary: {
        name: "The Bold Catalyst (Visionary)",
        desc: "High in curiosity and resilience, you combine a desire for exploration with the courage to fail. You look at the horizon and see possibilities, bouncing back quickly from any experiments that miss the mark. You inspire others with your courage, though you occasionally struggle with execution details."
    },
    harmonizer: {
        name: "The Heartfelt Guide (Harmonizer)",
        desc: "Blending deep empathy with broad curiosity, you seek to understand the human condition. You excel at mediation, cross-cultural connections, and creating inclusive environments. You look for the goodness in everyone, but must watch out for over-extending yourself to please others."
    },
    achiever: {
        name: "The Iron Pillar (Achiever)",
        desc: "Exhibiting high focus and high resilience, you are a powerhouse of productivity. You set difficult targets and persevere through exhaustion or failure until they are hit. You get things done. Be sure to schedule regular rest periods and value relationships as much as achievements."
    },
    mentor: {
        name: "The Compassionate Leader (Mentor)",
        desc: "Merging high empathy with structured focus, you are a natural guide and teacher. You plan systematically to help others grow, showing immense patience and understanding along the path. You help people reach their potential, but must remember to apply the same patience to your own limits."
    }
};

export class PersonalityPrism {
    constructor(app) {
        this.app = app;
        
        // Quiz State
        this.answers = {}; // qId -> score (1 to 5)
        this.currentIdx = 0;
        this.dimensionScores = { curiosity: 0, resilience: 0, empathy: 0, focus: 0 };

        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.quizCard = document.getElementById('quiz-card');
        this.resultsCard = document.getElementById('quiz-results-container');
        this.progressLine = document.getElementById('quiz-progress-line');
        this.progressFraction = document.getElementById('quiz-progress-fraction');
        this.qText = document.getElementById('question-text');
        this.prevBtn = document.getElementById('quiz-prev-btn');
        this.dimensionLabel = document.getElementById('quiz-dimension-label');
        
        // Answers buttons
        this.answerButtons = document.querySelectorAll('.likert-scale-answers .likert-btn');
        
        // Results
        this.resultsSvg = document.getElementById('prism-results-svg');
        this.archName = document.getElementById('archetype-name');
        this.archDesc = document.getElementById('archetype-description');
        this.restartBtn = document.getElementById('restart-quiz-btn');
        this.saveBtn = document.getElementById('save-quiz-btn');
    }

    bindEvents() {
        this.answerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const score = parseInt(e.currentTarget.getAttribute('data-score'));
                this.answerQuestion(score);
            });
        });

        this.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.restartBtn.addEventListener('click', () => this.restart());
        
        this.saveBtn.addEventListener('click', () => {
            this.app.saveModuleData('personality', {
                answers: this.answers,
                scores: this.dimensionScores,
                archetype: this.getArchetype()
            });
            this.app.showToast('Personality Profile locked in!', 'check');
            this.app.showScreen('dashboard-screen');
        });
    }

    start() {
        this.answers = {};
        this.currentIdx = 0;
        this.quizCard.style.display = 'block';
        this.resultsCard.style.display = 'none';

        // Load existing saved data if available
        if (this.app.state.personality) {
            this.answers = { ...this.app.state.personality.answers };
            // Go to end or show results immediately
            this.calculateScores();
            this.showResults();
            return;
        }

        this.showQuestion();
    }

    restart() {
        this.answers = {};
        this.currentIdx = 0;
        this.quizCard.style.display = 'block';
        this.resultsCard.style.display = 'none';
        this.showQuestion();
    }

    showQuestion() {
        const q = QUIZ_QUESTIONS[this.currentIdx];
        this.qText.innerText = `"${q.text}"`;
        
        // Update labels and progress
        const qNum = this.currentIdx + 1;
        const total = QUIZ_QUESTIONS.length;
        const pct = (qNum / total) * 100;
        
        this.progressLine.style.width = `${pct}%`;
        this.progressFraction.innerText = `Question ${qNum} of ${total}`;
        
        // Pretty dimension label
        const dims = {
            curiosity: 'Curiosity & Openness',
            resilience: 'Resilience & Fortitude',
            empathy: 'Empathy & Connection',
            focus: 'Focus & Drive'
        };
        this.dimensionLabel.innerText = `Dimension: ${dims[q.dim]}`;

        // Previous button state
        this.prevBtn.disabled = this.currentIdx === 0;

        // Reset button animations/focus
        this.answerButtons.forEach(btn => btn.blur());
    }

    answerQuestion(score) {
        const q = QUIZ_QUESTIONS[this.currentIdx];
        this.answers[q.id] = score;

        if (this.currentIdx < QUIZ_QUESTIONS.length - 1) {
            this.currentIdx++;
            this.showQuestion();
        } else {
            // Completed all questions
            this.calculateScores();
            this.showResults();
        }
    }

    previousQuestion() {
        if (this.currentIdx > 0) {
            this.currentIdx--;
            this.showQuestion();
        }
    }

    calculateScores() {
        // Reset scores
        this.dimensionScores = { curiosity: 0, resilience: 0, empathy: 0, focus: 0 };
        
        // Accumulate scores
        QUIZ_QUESTIONS.forEach(q => {
            const score = this.answers[q.id] || 3; // default to neutral if missing
            this.dimensionScores[q.dim] += score;
        });

        // Convert raw scores (5 questions per dimension, max 25) to percentage (0 - 100)
        // Formula: percentage = ((raw_score - 5) / 20) * 100.
        // Actually, let's keep it simple: raw_score / 25 * 100. This maps neutral (15) to 60%.
        // Using (raw_score - 5) / 20 * 100 maps neutral (15) to 50%, which is standard Likert conversion.
        Object.keys(this.dimensionScores).forEach(dim => {
            const raw = this.dimensionScores[dim];
            this.dimensionScores[dim] = Math.round(((raw - 5) / 20) * 100);
            if (this.dimensionScores[dim] < 0) this.dimensionScores[dim] = 0;
        });
    }

    getArchetype() {
        const { curiosity, resilience, empathy, focus } = this.dimensionScores;
        
        // Multi-dimensional rules
        // Threshold for a "high" score is 60%
        const highC = curiosity >= 60;
        const highR = resilience >= 60;
        const highE = empathy >= 60;
        const highF = focus >= 60;

        // Check combinations
        if (highC && highR && !highE && !highF) return ARCHETYPES.visionary;
        if (highC && highE && !highR && !highF) return ARCHETYPES.harmonizer;
        if (highF && highR && !highC && !highE) return ARCHETYPES.achiever;
        if (highF && highE && !highC && !highR) return ARCHETYPES.mentor;

        // Otherwise find dominant single score
        const scoresArr = [
            { id: 'explorer', val: curiosity },
            { id: 'anchor', val: resilience },
            { id: 'altruist', val: empathy },
            { id: 'strategist', val: focus }
        ];

        // Sort descending
        scoresArr.sort((a, b) => b.val - a.val);
        return ARCHETYPES[scoresArr[0].id];
    }

    showResults() {
        this.quizCard.style.display = 'none';
        this.resultsCard.style.display = 'block';

        const arch = this.getArchetype();
        this.archName.innerText = arch.name;
        this.archDesc.innerText = arch.desc;

        // Fill progress bars
        document.getElementById('bar-curiosity').style.width = `${this.dimensionScores.curiosity}%`;
        document.getElementById('bar-resilience').style.width = `${this.dimensionScores.resilience}%`;
        document.getElementById('bar-empathy').style.width = `${this.dimensionScores.empathy}%`;
        document.getElementById('bar-focus').style.width = `${this.dimensionScores.focus}%`;

        this.drawPolarChart(this.resultsSvg);
    }

    drawPolarChart(targetSvg) {
        if (!targetSvg) return;
        targetSvg.innerHTML = '';

        const cx = 150;
        const cy = 150;
        const maxRadius = 100;

        // 1. Draw grid rings
        for (let i = 1; i <= 5; i++) {
            const r = (i / 5) * maxRadius;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', r);
            circle.setAttribute('class', 'prism-radar-grid');
            circle.setAttribute('stroke', 'rgba(255,255,255,0.03)');
            targetSvg.appendChild(circle);
        }

        const dims = [
            { key: 'curiosity', name: 'Curiosity', angle: -Math.PI / 2 }, // Top
            { key: 'resilience', name: 'Resilience', angle: 0 },         // Right
            { key: 'empathy', name: 'Empathy', angle: Math.PI / 2 },      // Bottom
            { key: 'focus', name: 'Focus', angle: Math.PI }              // Left
        ];

        // 2. Draw axes & text
        dims.forEach(dim => {
            const lx = cx + (maxRadius + 22) * Math.cos(dim.angle);
            const ly = cy + (maxRadius + 22) * Math.sin(dim.angle) + 3;

            const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            axis.setAttribute('x1', cx);
            axis.setAttribute('y1', cy);
            axis.setAttribute('x2', cx + maxRadius * Math.cos(dim.angle));
            axis.setAttribute('y2', cy + maxRadius * Math.sin(dim.angle));
            axis.setAttribute('class', 'prism-radar-axis');
            targetSvg.appendChild(axis);

            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', lx);
            txt.setAttribute('y', ly);
            txt.setAttribute('class', 'prism-radar-lbl');
            txt.textContent = dim.name;
            targetSvg.appendChild(txt);
        });

        // 3. Draw score polygon
        const points = dims.map(dim => {
            const val = this.dimensionScores[dim.key]; // 0 - 100
            const r = (val / 100) * maxRadius;
            return {
                x: cx + r * Math.cos(dim.angle),
                y: cy + r * Math.sin(dim.angle),
                val: val
            };
        });

        const pathD = `M ${points[0].x} ${points[0].y} ` +
                     points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
                     ' Z';

        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        poly.setAttribute('d', pathD);
        poly.setAttribute('class', 'prism-radar-area');
        targetSvg.appendChild(poly);

        // 4. Draw markers
        points.forEach(p => {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            marker.setAttribute('cx', p.x);
            marker.setAttribute('cy', p.y);
            marker.setAttribute('r', 4.5);
            marker.setAttribute('class', 'prism-radar-marker');
            
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${p.val}%`;
            marker.appendChild(title);
            
            targetSvg.appendChild(marker);
        });
    }
}
