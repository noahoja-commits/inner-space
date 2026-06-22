/**
 * Module: Inner Map — Progress dashboard, Insights synthesis,
 * Journaling streak + daily prompts, Mood check-in tracking, and Data export.
 *
 * All client-side. Reuses the existing per-module localStorage state
 * (innerspace_journey_state) plus two append-only arrays:
 *   state.journalEntries — [{ ts, date, text, prompt, sentiment, themes }]
 *   state.moods          — [{ ts, dateKey, mood (1-5), energy (1-5) }]
 */

import { escapeHtml, safeCreateIcons } from './app.js';
import { WHEEL_CATEGORIES, WHEEL_ADVICE } from './wheel.js';

// Rotating bank of self-discovery prompts for the daily nudge. Kept separate
// from the journal carousel prompts so the "prompt of the day" stays fresh.
export const DAILY_PROMPTS = [
    "What is one small thing you can do today that your future self will thank you for?",
    "Name an emotion you felt strongly today. Where did you feel it in your body?",
    "What drained your energy recently, and what restored it?",
    "If today had a single word as its title, what would it be — and why?",
    "What is something you're avoiding? What would change if you faced it gently?",
    "Who or what are you grateful for right now, and have you told them?",
    "What does your ideal tomorrow look like in its first hour?",
    "What belief about yourself would you like to soften or release?",
    "When did you last feel proud of yourself? Relive that moment in detail.",
    "What boundary would protect your peace this week?",
    "What is your mind circling back to? What might it be trying to tell you?",
    "Describe a version of you, five years from now, who is thriving. What did they prioritize?",
    "What felt easy today that used to feel hard? Notice the growth.",
    "What would 'enough' look like for you today, free of perfectionism?"
];

const MOOD_OPTIONS = [
    { v: 1, label: 'Heavy',   icon: 'cloud-rain', color: 'var(--accent-blue)' },
    { v: 2, label: 'Low',     icon: 'cloud',      color: 'var(--accent-blue)' },
    { v: 3, label: 'Steady',  icon: 'minus',      color: 'var(--text-muted)' },
    { v: 4, label: 'Good',    icon: 'sun',        color: 'var(--accent-amber)' },
    { v: 5, label: 'Radiant', icon: 'sparkles',   color: 'var(--accent-amber)' }
];

const ENERGY_OPTIONS = [
    { v: 1, label: 'Drained' },
    { v: 2, label: 'Tired' },
    { v: 3, label: 'Balanced' },
    { v: 4, label: 'Lively' },
    { v: 5, label: 'Charged' }
];

const DIM_LABELS = {
    curiosity: 'Curiosity',
    resilience: 'Resilience',
    empathy: 'Empathy',
    focus: 'Focus'
};

function dateKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function prettyDate(ts) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetweenKeys(a, b) {
    // a, b are 'YYYY-MM-DD'. Returns whole-day difference (b - a).
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / 86400000);
}

export class Insights {
    constructor(app) {
        this.app = app;
        this.draftMood = null;
        this.draftEnergy = null;
        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.progressGrid = document.getElementById('im-progress-grid');
        this.synthBody = document.getElementById('im-synthesis-body');
        this.streakCurrent = document.getElementById('im-streak-current');
        this.streakLongest = document.getElementById('im-streak-longest');
        this.streakNudge = document.getElementById('im-streak-nudge');
        this.dailyPromptText = document.getElementById('im-daily-prompt');
        this.dailyPromptBtn = document.getElementById('im-daily-prompt-btn');

        this.moodCheckinWrap = document.getElementById('im-mood-checkin');
        this.moodOptionsWrap = document.getElementById('im-mood-options');
        this.energyOptionsWrap = document.getElementById('im-energy-options');
        this.moodSaveBtn = document.getElementById('im-mood-save-btn');
        this.moodChartSvg = document.getElementById('im-mood-chart-svg');
        this.moodEmptyText = document.getElementById('im-mood-empty');

        this.exportJsonBtn = document.getElementById('im-export-json-btn');
        this.exportTextBtn = document.getElementById('im-export-text-btn');
    }

    bindEvents() {
        if (this.dailyPromptBtn) {
            this.dailyPromptBtn.addEventListener('click', () => this.app.showScreen('journal-screen'));
        }
        if (this.moodSaveBtn) {
            this.moodSaveBtn.addEventListener('click', () => this.saveMood());
        }
        if (this.exportJsonBtn) {
            this.exportJsonBtn.addEventListener('click', () => this.exportData('json'));
        }
        if (this.exportTextBtn) {
            this.exportData && this.exportTextBtn.addEventListener('click', () => this.exportData('text'));
        }
    }

    start() {
        this.renderProgress();
        this.renderSynthesis();
        this.renderStreak();
        this.renderDailyPrompt();
        this.renderMoodCheckin();
        this.renderMoodChart();
        safeCreateIcons();
    }

    /* ===================== 1. PROGRESS DASHBOARD ===================== */

    moduleMeta() {
        const s = this.app.state;
        const journalCount = (s.journalEntries && s.journalEntries.length) || (s.journal ? 1 : 0);
        const lastJournalTs = (s.journalEntries && s.journalEntries.length)
            ? s.journalEntries[s.journalEntries.length - 1].ts
            : null;

        return [
            {
                key: 'values', icon: 'gem', name: 'Core Values',
                done: !!s.values,
                detail: s.values ? `${s.values.length} values ranked` : 'Not started',
                target: 'values-screen'
            },
            {
                key: 'wheel', icon: 'pie-chart', name: 'Life Balance',
                done: !!s.wheel,
                detail: s.wheel ? `Avg satisfaction ${this.avgSatisfaction(s.wheel)}/10` : 'Not started',
                target: 'wheel-screen'
            },
            {
                key: 'personality', icon: 'prism', name: 'Personality Prism',
                done: !!s.personality,
                detail: s.personality ? (s.personality.archetype.name.split('(')[0].trim()) : 'Not started',
                target: 'personality-screen'
            },
            {
                key: 'journal', icon: 'book-open', name: 'Reflections',
                done: journalCount > 0,
                detail: journalCount > 0
                    ? `${journalCount} ${journalCount === 1 ? 'entry' : 'entries'}${lastJournalTs ? ' · ' + prettyDate(lastJournalTs) : ''}`
                    : 'Not started',
                target: 'journal-screen'
            }
        ];
    }

    avgSatisfaction(wheel) {
        let sum = 0, n = 0;
        Object.keys(wheel).forEach(k => { sum += wheel[k].satis; n++; });
        return n ? (sum / n).toFixed(1) : '0';
    }

    renderProgress() {
        if (!this.progressGrid) return;
        const meta = this.moduleMeta();
        const doneCount = meta.filter(m => m.done).length;

        this.progressGrid.innerHTML = '';
        meta.forEach(m => {
            const card = document.createElement('div');
            card.className = 'im-progress-card glass-card' + (m.done ? ' complete' : '');
            card.innerHTML = `
                <div class="im-pc-top">
                    <span class="im-pc-icon"><i data-lucide="${m.icon}"></i></span>
                    <span class="im-pc-state">${m.done ? 'Complete' : 'Open'}</span>
                </div>
                <h4>${m.name}</h4>
                <p class="im-pc-detail">${escapeHtml(m.detail)}</p>
                <button class="btn btn-secondary btn-sm im-resume-btn" data-target="${m.target}">
                    <span>${m.done ? 'Review' : 'Resume'}</span>
                    <i data-lucide="arrow-right" style="width:14px;height:14px"></i>
                </button>
            `;
            card.querySelector('.im-resume-btn').addEventListener('click', () => {
                this.app.showScreen(m.target);
            });
            this.progressGrid.appendChild(card);
        });

        // Engagement summary card
        const moods = this.app.state.moods || [];
        const breath = this.app.state.breathHistory || [];
        const snaps = this.app.state.snapshots || [];
        const summary = document.createElement('div');
        summary.className = 'im-progress-card glass-card im-summary-card';
        summary.innerHTML = `
            <div class="im-pc-top">
                <span class="im-pc-icon"><i data-lucide="gauge"></i></span>
                <span class="im-pc-state">${doneCount}/4 pathways</span>
            </div>
            <h4>Engagement</h4>
            <ul class="im-summary-list">
                <li><i data-lucide="smile"></i> ${moods.length} mood check-in${moods.length === 1 ? '' : 's'}</li>
                <li><i data-lucide="wind"></i> ${breath.length} breath session${breath.length === 1 ? '' : 's'}</li>
                <li><i data-lucide="camera"></i> ${snaps.length} alignment snapshot${snaps.length === 1 ? '' : 's'}</li>
            </ul>
        `;
        this.progressGrid.appendChild(summary);
    }

    /* ===================== 2. INSIGHTS SYNTHESIS ===================== */

    renderSynthesis() {
        if (!this.synthBody) return;
        const s = this.app.state;
        const blocks = [];

        const hasAny = s.values || s.wheel || s.personality || (s.journalEntries && s.journalEntries.length);
        if (!hasAny) {
            this.synthBody.innerHTML = `
                <div class="im-synth-empty">
                    <i data-lucide="map"></i>
                    <p>Complete a pathway or two and your inner map will draw itself here — weaving together your values, life balance, personality and reflections.</p>
                </div>`;
            return;
        }

        // -- Personality + dominant trait
        if (s.personality) {
            const sc = s.personality.scores;
            const ordered = Object.keys(sc).sort((a, b) => sc[b] - sc[a]);
            const top = ordered[0], low = ordered[ordered.length - 1];
            blocks.push(this.synthBlock('prism', 'Who you are',
                `You read as <strong>${escapeHtml(s.personality.archetype.name)}</strong>. Your strongest current is <strong>${DIM_LABELS[top]}</strong> (${sc[top]}%), while <strong>${DIM_LABELS[low]}</strong> (${sc[low]}%) is where there's most room to stretch.`));
        }

        // -- Top values
        if (s.values && s.values.length) {
            const names = s.values.map(v => v.name);
            const tags = [...new Set(s.values.map(v => v.tag).filter(Boolean))];
            const top3 = names.slice(0, 3).join(', ');
            blocks.push(this.synthBlock('gem', 'What guides you',
                `Your compass points to <strong>${escapeHtml(top3)}</strong>${names.length > 3 ? ' and beyond' : ''}.` +
                (tags.length ? ` The themes underneath: ${escapeHtml(tags.join(', '))}.` : '')));
        }

        // -- Life-area balance (largest gaps)
        if (s.wheel) {
            const gaps = WHEEL_CATEGORIES.map(c => {
                const w = s.wheel[c.id] || { satis: 5, growth: 7 };
                return { name: c.name, id: c.id, satis: w.satis, gap: w.growth - w.satis };
            });
            const lowest = [...gaps].sort((a, b) => a.satis - b.satis)[0];
            const widest = [...gaps].sort((a, b) => b.gap - a.gap)[0];
            const strongest = [...gaps].sort((a, b) => b.satis - a.satis)[0];
            let txt = `You feel most resourced in <strong>${escapeHtml(strongest.name)}</strong> (${strongest.satis}/10).`;
            if (lowest.satis < strongest.satis) {
                txt += ` <strong>${escapeHtml(lowest.name)}</strong> (${lowest.satis}/10) is asking for attention.`;
            }
            if (widest.gap > 0) {
                txt += ` Your widest growth gap is in <strong>${escapeHtml(widest.name)}</strong> (+${widest.gap}).`;
                const advice = WHEEL_ADVICE[widest.id];
                if (advice) txt += `<br><span class="im-synth-advice">${escapeHtml(advice)}</span>`;
            }
            blocks.push(this.synthBlock('pie-chart', 'Where life sits', txt));
        }

        // -- Reflection tone + recurring themes (across all entries)
        const entries = (s.journalEntries && s.journalEntries.length)
            ? s.journalEntries
            : (s.journal ? [s.journal] : []);
        if (entries.length) {
            const themeFreq = {};
            let pctSum = 0, pctN = 0;
            entries.forEach(e => {
                (e.themes || []).forEach(t => { themeFreq[t] = (themeFreq[t] || 0) + 1; });
                if (e.sentiment && typeof e.sentiment.pct === 'number') { pctSum += e.sentiment.pct; pctN++; }
            });
            const topThemes = Object.keys(themeFreq).sort((a, b) => themeFreq[b] - themeFreq[a]).slice(0, 4);
            const avgPct = pctN ? Math.round(pctSum / pctN) : 50;
            let tone = 'balanced and reflective';
            if (avgPct > 62) tone = 'warm and energized';
            else if (avgPct < 42) tone = 'quiet and introspective';
            let txt = `Across ${entries.length} reflection${entries.length === 1 ? '' : 's'}, your tone reads as <strong>${tone}</strong> (avg ${avgPct}%).`;
            if (topThemes.length) txt += ` Recurring on your mind: ${topThemes.map(t => escapeHtml(t)).join(', ')}.`;
            blocks.push(this.synthBlock('book-open', "What's on your mind", txt));
        }

        // -- Cross-cutting alignment note: do top values map to life-area gaps?
        if (s.values && s.wheel) {
            const note = this.alignmentNote(s.values, s.wheel);
            if (note) blocks.push(this.synthBlock('link', 'A thread to notice', note));
        }

        this.synthBody.innerHTML = blocks.join('');
    }

    synthBlock(icon, title, html) {
        return `
            <div class="im-synth-block">
                <div class="im-synth-head"><i data-lucide="${icon}"></i><h4>${title}</h4></div>
                <p>${html}</p>
            </div>`;
    }

    alignmentNote(values, wheel) {
        // Map value ids -> a relevant life-area to surface tension between
        // "what you say matters" and "where you feel under-resourced".
        const VAL_TO_AREA = {
            health: 'health', connection: 'relations', community: 'relations',
            growth: 'growth', curiosity: 'growth', wisdom: 'growth',
            contribution: 'career', excellence: 'career', influence: 'career',
            security: 'finance', freedom: 'finance',
            peace: 'spirit', balance: 'spirit', gratitude: 'spirit',
            joy: 'fun', adventure: 'fun', creativity: 'fun'
        };
        const areaName = id => (WHEEL_CATEGORIES.find(c => c.id === id) || {}).name || id;
        for (const v of values) {
            const area = VAL_TO_AREA[v.id];
            if (area && wheel[area] && wheel[area].satis <= 4) {
                return `You rank <strong>${escapeHtml(v.name)}</strong> among your core values, yet <strong>${escapeHtml(areaName(area))}</strong> sits low (${wheel[area].satis}/10) on your wheel. That gap between what matters and what you're living is often the most fertile place to focus.`;
            }
        }
        return null;
    }

    /* ===================== 3. STREAK + DAILY PROMPT ===================== */

    journalDateKeys() {
        const s = this.app.state;
        const entries = s.journalEntries || [];
        const keys = new Set();
        entries.forEach(e => { if (e.ts) keys.add(dateKey(e.ts)); });
        // include a legacy single journal entry (no ts) as "today" only if no log exists
        if (!entries.length && s.journal) keys.add(dateKey(Date.now()));
        return [...keys].sort();
    }

    computeStreaks() {
        const keys = this.journalDateKeys();
        if (!keys.length) return { current: 0, longest: 0, todayDone: false };

        const todayKey = dateKey(Date.now());
        const yesterdayKey = dateKey(Date.now() - 86400000);
        const keySet = new Set(keys);

        // Longest run of consecutive days anywhere in history
        let longest = 1, run = 1;
        for (let i = 1; i < keys.length; i++) {
            if (daysBetweenKeys(keys[i - 1], keys[i]) === 1) { run++; } else { run = 1; }
            if (run > longest) longest = run;
        }

        // Current streak counts back from today (or yesterday if not yet logged today)
        let current = 0;
        if (keySet.has(todayKey) || keySet.has(yesterdayKey)) {
            let cursor = keySet.has(todayKey) ? todayKey : yesterdayKey;
            while (keySet.has(cursor)) {
                current++;
                cursor = dateKey(new Date(cursor + 'T00:00:00').getTime() - 86400000);
            }
        }
        return { current, longest: Math.max(longest, current), todayDone: keySet.has(todayKey) };
    }

    renderStreak() {
        if (!this.streakCurrent) return;
        const { current, longest, todayDone } = this.computeStreaks();
        this.streakCurrent.innerText = current;
        this.streakLongest.innerText = longest;
        if (this.streakNudge) {
            if (todayDone) {
                this.streakNudge.innerHTML = `<i data-lucide="check-circle"></i> You've reflected today — streak alive.`;
                this.streakNudge.className = 'im-streak-nudge done';
            } else if (current > 0) {
                this.streakNudge.innerHTML = `<i data-lucide="flame"></i> Keep your ${current}-day streak going — write today's reflection.`;
                this.streakNudge.className = 'im-streak-nudge';
            } else {
                this.streakNudge.innerHTML = `<i data-lucide="sparkles"></i> A single reflection starts a streak. Begin today.`;
                this.streakNudge.className = 'im-streak-nudge';
            }
        }
    }

    renderDailyPrompt() {
        if (!this.dailyPromptText) return;
        // Deterministic prompt-of-the-day so it's stable within a calendar day.
        const d = new Date();
        const dayNum = Math.floor(d.getTime() / 86400000);
        const idx = dayNum % DAILY_PROMPTS.length;
        this.dailyPromptText.innerText = `"${DAILY_PROMPTS[idx]}"`;
    }

    /* ===================== 4. MOOD / CHECK-IN ===================== */

    renderMoodCheckin() {
        if (!this.moodOptionsWrap) return;

        const todayKey = dateKey(Date.now());
        const moods = this.app.state.moods || [];
        const todayMood = moods.find(m => m.dateKey === todayKey);
        if (todayMood) {
            this.draftMood = todayMood.mood;
            this.draftEnergy = todayMood.energy;
        }

        this.moodOptionsWrap.innerHTML = '';
        MOOD_OPTIONS.forEach(o => {
            const btn = document.createElement('button');
            btn.className = 'im-mood-btn' + (this.draftMood === o.v ? ' selected' : '');
            btn.setAttribute('data-mood', o.v);
            btn.setAttribute('title', o.label);
            btn.innerHTML = `<i data-lucide="${o.icon}" style="color:${o.color}"></i><span>${o.label}</span>`;
            btn.addEventListener('click', () => {
                this.draftMood = o.v;
                this.moodOptionsWrap.querySelectorAll('.im-mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.refreshMoodSaveState();
            });
            this.moodOptionsWrap.appendChild(btn);
        });

        this.energyOptionsWrap.innerHTML = '';
        ENERGY_OPTIONS.forEach(o => {
            const btn = document.createElement('button');
            btn.className = 'im-energy-btn' + (this.draftEnergy === o.v ? ' selected' : '');
            btn.setAttribute('data-energy', o.v);
            btn.innerText = o.label;
            btn.addEventListener('click', () => {
                this.draftEnergy = o.v;
                this.energyOptionsWrap.querySelectorAll('.im-energy-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.refreshMoodSaveState();
            });
            this.energyOptionsWrap.appendChild(btn);
        });

        if (this.moodSaveBtn) {
            this.moodSaveBtn.querySelector('span').innerText = todayMood ? 'Update today\'s check-in' : 'Save today\'s check-in';
        }
        this.refreshMoodSaveState();
    }

    refreshMoodSaveState() {
        if (this.moodSaveBtn) {
            this.moodSaveBtn.disabled = !(this.draftMood && this.draftEnergy);
        }
    }

    saveMood() {
        if (!(this.draftMood && this.draftEnergy)) return;
        const todayKey = dateKey(Date.now());
        const moods = (this.app.state.moods || []).filter(m => m.dateKey !== todayKey);
        moods.push({ ts: Date.now(), dateKey: todayKey, mood: this.draftMood, energy: this.draftEnergy });
        moods.sort((a, b) => a.ts - b.ts);
        this.app.saveModuleData('moods', moods);
        this.app.showToast('Check-in saved.', 'check');
        this.renderMoodChart();
        this.renderProgress();
        this.renderMoodCheckin();
        safeCreateIcons();
    }

    renderMoodChart() {
        if (!this.moodChartSvg) return;
        const moods = [...(this.app.state.moods || [])].sort((a, b) => a.ts - b.ts);
        this.moodChartSvg.innerHTML = '';

        if (moods.length < 2) {
            if (this.moodEmptyText) this.moodEmptyText.style.display = 'block';
            this.moodChartSvg.style.display = 'none';
            return;
        }
        if (this.moodEmptyText) this.moodEmptyText.style.display = 'none';
        this.moodChartSvg.style.display = 'block';

        const recent = moods.slice(-14); // last 14 check-ins
        const width = 320, height = 130, padX = 18, padY = 18;
        const maxIdx = recent.length - 1;
        const yFor = v => height - padY - ((v - 1) / 4) * (height - 2 * padY); // v in 1..5
        const xFor = i => padX + (i / maxIdx) * (width - 2 * padX);

        const svgNS = 'http://www.w3.org/2000/svg';
        // grid lines for 1,3,5
        [1, 3, 5].forEach(level => {
            const ln = document.createElementNS(svgNS, 'line');
            ln.setAttribute('x1', padX); ln.setAttribute('x2', width - padX);
            ln.setAttribute('y1', yFor(level)); ln.setAttribute('y2', yFor(level));
            ln.setAttribute('stroke', 'rgba(255,255,255,0.04)'); ln.setAttribute('stroke-width', '1');
            this.moodChartSvg.appendChild(ln);
        });

        const series = [
            { key: 'mood', stroke: 'var(--accent-rose)' },
            { key: 'energy', stroke: 'var(--accent-teal)' }
        ];

        series.forEach(s => {
            const pts = recent.map((m, i) => ({ x: xFor(i), y: yFor(m[s.key]), v: m[s.key], date: prettyDate(m.ts) }));
            const poly = document.createElementNS(svgNS, 'polyline');
            poly.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '));
            poly.setAttribute('fill', 'none');
            poly.setAttribute('stroke', s.stroke);
            poly.setAttribute('stroke-width', '2.5');
            poly.setAttribute('stroke-linecap', 'round');
            poly.setAttribute('stroke-linejoin', 'round');
            this.moodChartSvg.appendChild(poly);

            pts.forEach(p => {
                const c = document.createElementNS(svgNS, 'circle');
                c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', '3.5');
                c.setAttribute('fill', 'white'); c.setAttribute('stroke', s.stroke); c.setAttribute('stroke-width', '2');
                const t = document.createElementNS(svgNS, 'title');
                t.textContent = `${p.date} — ${s.key}: ${p.v}/5`;
                c.appendChild(t);
                this.moodChartSvg.appendChild(c);
            });
        });
    }

    /* ===================== 5. EXPORT ===================== */

    buildExportObject() {
        const s = this.app.state;
        return {
            app: 'InnerSpace',
            exportedAt: new Date().toISOString(),
            user: s.username || '',
            values: s.values || null,
            wheel: s.wheel || null,
            personality: s.personality || null,
            journal: s.journal || null,
            journalEntries: s.journalEntries || [],
            moods: s.moods || [],
            snapshots: s.snapshots || [],
            breathHistory: s.breathHistory || []
        };
    }

    buildExportText() {
        const s = this.app.state;
        const L = [];
        const rule = '='.repeat(48);
        L.push('INNERSPACE — SELF-DISCOVERY EXPORT');
        L.push(`Generated: ${new Date().toLocaleString()}`);
        if (s.username) L.push(`Explorer: ${s.username}`);
        L.push(rule, '');

        if (s.personality) {
            L.push('PERSONALITY PRISM');
            L.push(`Archetype: ${s.personality.archetype.name}`);
            L.push(s.personality.archetype.desc);
            const sc = s.personality.scores;
            L.push(`Curiosity ${sc.curiosity}% | Resilience ${sc.resilience}% | Empathy ${sc.empathy}% | Focus ${sc.focus}%`);
            L.push('');
        }

        if (s.values && s.values.length) {
            L.push('CORE VALUES (ranked)');
            s.values.forEach((v, i) => L.push(`${i + 1}. ${v.name} — ${v.desc}`));
            L.push('');
        }

        if (s.wheel) {
            L.push('LIFE BALANCE WHEEL (satisfaction / desired growth)');
            WHEEL_CATEGORIES.forEach(c => {
                const w = s.wheel[c.id];
                if (w) L.push(`${c.name}: ${w.satis}/10  (growth target ${w.growth}/10)`);
            });
            L.push('');
        }

        const entries = (s.journalEntries && s.journalEntries.length) ? s.journalEntries : (s.journal ? [s.journal] : []);
        if (entries.length) {
            L.push('REFLECTIONS');
            entries.forEach(e => {
                L.push('-'.repeat(40));
                if (e.ts) L.push(prettyDate(e.ts));
                if (e.prompt) L.push(`Prompt: ${e.prompt}`);
                if (e.sentiment) L.push(`Tone: ${e.sentiment.label}`);
                if (e.themes && e.themes.length) L.push(`Themes: ${e.themes.join(', ')}`);
                L.push('');
                L.push(e.text || '');
                L.push('');
            });
        }

        const moods = s.moods || [];
        if (moods.length) {
            L.push('MOOD / ENERGY CHECK-INS');
            moods.forEach(m => L.push(`${prettyDate(m.ts)}: mood ${m.mood}/5, energy ${m.energy}/5`));
            L.push('');
        }

        L.push(rule);
        L.push('Reflect gently. — InnerSpace');
        return L.join('\n');
    }

    exportData(format) {
        let blob, filename;
        const stamp = dateKey(Date.now());
        if (format === 'json') {
            blob = new Blob([JSON.stringify(this.buildExportObject(), null, 2)], { type: 'application/json' });
            filename = `innerspace-export-${stamp}.json`;
        } else {
            blob = new Blob([this.buildExportText()], { type: 'text/plain' });
            filename = `innerspace-reflections-${stamp}.txt`;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.app.showToast(`Exported ${format.toUpperCase()} file.`, 'check');
    }
}
