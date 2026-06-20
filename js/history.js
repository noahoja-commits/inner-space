/**
 * Module: History & Alignment Timeline Tracker
 */

import { WHEEL_CATEGORIES } from './wheel.js';

export class AlignmentHistory {
    constructor(app) {
        this.app = app;
        this.selectedTrendCategory = 'health';

        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.saveSnapshotBtn = document.getElementById('save-snapshot-btn');
        this.snapshotsList = document.getElementById('history-snapshots-list');
        this.trendCatSelect = document.getElementById('trend-category-select');
        this.sparklineSvg = document.getElementById('trend-sparkline-svg');
        
        // Stats
        this.totalSnapshotsText = document.getElementById('history-total-snapshots');
        this.totalBreathMinutesText = document.getElementById('history-total-breath-min');
        
        this.breathLogList = document.getElementById('history-breath-log');
        this.milestonesList = document.getElementById('history-milestones-list');
    }

    bindEvents() {
        this.saveSnapshotBtn.addEventListener('click', () => this.captureSnapshot());

        this.trendCatSelect.addEventListener('change', (e) => {
            this.selectedTrendCategory = e.target.value;
            this.renderTrendSparkline();
        });
    }

    start() {
        this.populateCategorySelect();
        this.renderAll();
    }

    populateCategorySelect() {
        if (this.trendCatSelect.options.length === 0) {
            this.trendCatSelect.innerHTML = '';
            WHEEL_CATEGORIES.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.innerText = cat.name;
                this.trendCatSelect.appendChild(opt);
            });

            // Append Journal Reflection Sentiment option
            const opt = document.createElement('option');
            opt.value = 'journal_sentiment';
            opt.innerText = 'Reflection Sentiment';
            this.trendCatSelect.appendChild(opt);
        }
    }

    /**
     * Create a historical snapshot of the user's current self-discovery state
     */
    captureSnapshot() {
        // Ensure they have at least filled out the Life Wheel
        if (!this.app.state.wheel) {
            this.app.showToast('Please complete the Life Balance Wheel first.', 'info');
            return;
        }

        const dateObj = new Date();
        const snapshot = {
            id: 'snap_' + Date.now(),
            date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp: Date.now(),
            wheel: { ...this.app.state.wheel },
            personality: this.app.state.personality ? { ...this.app.state.personality.scores } : null,
            archetype: this.app.state.personality ? this.app.state.personality.archetype.name : 'Not Completed',
            journalSentiment: this.app.state.journal ? this.app.state.journal.sentiment.pct : null
        };

        const snapshots = this.app.state.snapshots || [];
        snapshots.push(snapshot);
        
        this.app.saveModuleData('snapshots', snapshots);
        this.app.showToast('Alignment snapshot saved!', 'check');
        this.renderAll();
    }

    renderAll() {
        const snapshots = this.app.state.snapshots || [];
        const breathHistory = this.app.state.breathHistory || [];

        // 1. Stats Counter
        this.totalSnapshotsText.innerText = snapshots.length;
        
        const totalBreathSeconds = breathHistory.reduce((sum, item) => sum + item.duration, 0);
        const totalMinutes = Math.round(totalBreathSeconds / 60);
        this.totalBreathMinutesText.innerText = `${totalMinutes}m`;

        // 2. Render Snapshots Timeline List
        this.renderSnapshotsList(snapshots);

        // 3. Render Trend Sparkline
        this.renderTrendSparkline();

        // 4. Render Milestones
        this.renderMilestones(snapshots);

        // 5. Render Breath Logs list
        this.renderBreathLogs(breathHistory);
    }

    renderSnapshotsList(snapshots) {
        this.snapshotsList.innerHTML = '';
        if (snapshots.length === 0) {
            this.snapshotsList.innerHTML = `
                <div class="empty-history-placeholder">
                    <p>No snapshots logged. Adjust your Life Wheel and click 'Save Alignment Snapshot' to start tracking your growth timeline.</p>
                </div>
            `;
            return;
        }

        // Draw in reverse chronological order
        [...snapshots].reverse().forEach(snap => {
            const row = document.createElement('div');
            row.className = 'history-snapshot-row glass-card';
            
            // Average satisfaction
            let satisSum = 0;
            let catCount = 0;
            Object.keys(snap.wheel).forEach(key => {
                satisSum += snap.wheel[key].satis;
                catCount++;
            });
            const avgSatis = (satisSum / catCount).toFixed(1);

            row.innerHTML = `
                <div class="snap-meta">
                    <span class="snap-date">${snap.date}</span>
                    <span class="snap-arch">Archetype: <strong>${snap.archetype}</strong></span>
                </div>
                <div class="snap-score-badge">
                    <span class="score-lbl">Avg Satisfaction:</span>
                    <span class="score-num">${avgSatis}/10</span>
                </div>
                <button class="btn btn-outline btn-xs delete-snap-btn" data-id="${snap.id}" title="Delete snapshot">
                    <i data-lucide="trash-2" style="width:14px;height:14px;color:var(--accent-rose)"></i>
                </button>
            `;

            row.querySelector('.delete-snap-btn').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.deleteSnapshot(id);
            });

            this.snapshotsList.appendChild(row);
        });

        lucide.createIcons();
    }

    deleteSnapshot(id) {
        if (confirm("Delete this snapshot from your history?")) {
            const snapshots = this.app.state.snapshots || [];
            const filtered = snapshots.filter(s => s.id !== id);
            this.app.saveModuleData('snapshots', filtered);
            this.app.showToast('Snapshot deleted', 'info');
            this.renderAll();
        }
    }

    /**
     * Renders a custom sparkline SVG representing the satisfaction trend of the selected category
     */
    renderTrendSparkline() {
        this.sparklineSvg.innerHTML = '';
        const snapshots = this.app.state.snapshots || [];
        
        if (snapshots.length < 2) {
            // Write placeholder text inside SVG
            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', '150');
            txt.setAttribute('y', '50');
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('fill', 'var(--text-muted)');
            txt.setAttribute('font-size', '12');
            txt.textContent = "Requires at least 2 snapshots to chart trends.";
            this.sparklineSvg.appendChild(txt);
            return;
        }

        const width = 320;
        const height = 100;
        const padding = 15;

        const maxIdx = snapshots.length - 1;
        const points = [];
        const isSentiment = this.selectedTrendCategory === 'journal_sentiment';

        snapshots.forEach((snap, idx) => {
            let score;
            let labelText;
            let y;
            
            if (isSentiment) {
                score = snap.journalSentiment !== undefined && snap.journalSentiment !== null ? snap.journalSentiment : null;
                if (score === null) score = 50; // default to neutral if not recorded
                y = height - padding - (score / 100) * (height - 2 * padding);
                labelText = `${score}%`;
            } else {
                score = snap.wheel[this.selectedTrendCategory] ? snap.wheel[this.selectedTrendCategory].satis : 5;
                y = height - padding - ((score - 1) / 9) * (height - 2 * padding);
                labelText = score.toString();
            }
            
            // X coordinate (stretched across width)
            const x = padding + (idx / maxIdx) * (width - 2 * padding);
            
            points.push({ x, y, score, labelText, date: snap.date });
        });

        // 1. Draw grid line paths (y levels)
        const gridLevels = isSentiment ? [10, 50, 90] : [1, 5, 10];
        for (let level of gridLevels) {
            const gridY = isSentiment 
                ? height - padding - (level / 100) * (height - 2 * padding)
                : height - padding - ((level - 1) / 9) * (height - 2 * padding);
                
            const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            gridLine.setAttribute('x1', padding);
            gridLine.setAttribute('y1', gridY);
            gridLine.setAttribute('x2', width - padding);
            gridLine.setAttribute('y2', gridY);
            gridLine.setAttribute('stroke', 'rgba(255,255,255,0.03)');
            gridLine.setAttribute('stroke-width', '1');
            this.sparklineSvg.appendChild(gridLine);
        }

        // 2. Draw Polyline path connecting points
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
        polyline.setAttribute('points', pointsString);
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('stroke', isSentiment ? 'var(--accent-amber)' : 'var(--accent-teal)');
        polyline.setAttribute('stroke-width', '3');
        polyline.setAttribute('stroke-linecap', 'round');
        polyline.setAttribute('stroke-linejoin', 'round');
        this.sparklineSvg.appendChild(polyline);

        // 3. Draw dots & text values at vertices
        points.forEach((p, idx) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', 'white');
            circle.setAttribute('stroke', isSentiment ? 'var(--accent-amber)' : 'var(--accent-teal)');
            circle.setAttribute('stroke-width', '2');
            
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${p.date}: ${p.labelText}`;
            circle.appendChild(title);
            
            this.sparklineSvg.appendChild(circle);

            // Add value text label above dot (if space permits)
            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', p.x);
            txt.setAttribute('y', p.y - 8);
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('fill', 'var(--text-primary)');
            txt.setAttribute('font-size', '8');
            txt.setAttribute('font-weight', '700');
            txt.textContent = p.labelText;
            this.sparklineSvg.appendChild(txt);
        });
    }

    renderMilestones(snapshots) {
        this.milestonesList.innerHTML = '';
        
        if (snapshots.length < 2) {
            this.milestonesList.innerHTML = `
                <div class="milestone-card empty">
                    <p>Milestones will unlock as you log snapshots and improve your alignment over time.</p>
                </div>
            `;
            return;
        }

        const latest = snapshots[snapshots.length - 1];
        const previous = snapshots[snapshots.length - 2];
        let milestonesFound = 0;

        // Check if overall satisfaction improved
        let latestSum = 0;
        let prevSum = 0;
        let count = 0;
        WHEEL_CATEGORIES.forEach(cat => {
            latestSum += latest.wheel[cat.id] ? latest.wheel[cat.id].satis : 0;
            prevSum += previous.wheel[cat.id] ? previous.wheel[cat.id].satis : 0;
            count++;
        });

        const latestAvg = latestSum / count;
        const prevAvg = prevSum / count;

        if (latestAvg > prevAvg) {
            const diff = (latestAvg - prevAvg).toFixed(1);
            this.addMilestoneUI("Overall Well-Being Lift", `Your overall Life Wheel satisfaction increased by +${diff} points! Excellent progress.`, 'heart');
            milestonesFound++;
        }

        // Check if journal reflection sentiment score improved
        const lSent = latest.journalSentiment !== undefined && latest.journalSentiment !== null ? latest.journalSentiment : null;
        const pSent = previous.journalSentiment !== undefined && previous.journalSentiment !== null ? previous.journalSentiment : null;
        if (lSent !== null && pSent !== null && lSent > pSent) {
            const diff = lSent - pSent;
            this.addMilestoneUI("Emotional Frequency Lift", `Your reflection sentiment score increased by +${diff}% (showing a more positive, energetic state)!`, 'smile');
            milestonesFound++;
        }

        // Check individual categories improvements
        WHEEL_CATEGORIES.forEach(cat => {
            const lScore = latest.wheel[cat.id] ? latest.wheel[cat.id].satis : 0;
            const pScore = previous.wheel[cat.id] ? previous.wheel[cat.id].satis : 0;
            
            if (lScore > pScore) {
                const diff = lScore - pScore;
                this.addMilestoneUI(`${cat.name} Expansion`, `Satisfaction in this category improved by +${diff} (from ${pScore} to ${lScore}).`, cat.icon);
                milestonesFound++;
            }
        });

        if (milestonesFound === 0) {
            this.milestonesList.innerHTML = `
                <div class="milestone-card empty">
                    <p>Current snapshot is aligned with your previous one. Continue reflecting and implementing your self-improvement actions!</p>
                </div>
            `;
        }
    }

    addMilestoneUI(title, text, iconName) {
        const card = document.createElement('div');
        card.className = 'milestone-card glass-card';
        card.innerHTML = `
            <div class="m-icon"><i data-lucide="${iconName}"></i></div>
            <div class="m-text">
                <h4>${title}</h4>
                <p>${text}</p>
            </div>
        `;
        this.milestonesList.appendChild(card);
        lucide.createIcons();
    }

    renderBreathLogs(logs) {
        this.breathLogList.innerHTML = '';
        if (logs.length === 0) {
            this.breathLogList.innerHTML = `<li>No recent logs. Start a breathing exercise in the Breath Sync panel.</li>`;
            return;
        }

        // Render top 5 recent logs
        [...logs].reverse().slice(0, 5).forEach(log => {
            const li = document.createElement('li');
            li.className = 'breath-log-item';
            const durationMin = (log.duration / 60).toFixed(1);
            li.innerHTML = `
                <span class="log-date">${log.date}</span>
                <span class="log-tech">${log.technique}</span>
                <span class="log-stat"><strong>${durationMin}m</strong> (${log.cycles} cycles)</span>
            `;
            this.breathLogList.appendChild(li);
        });
    }
}
