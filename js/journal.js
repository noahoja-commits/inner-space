/**
 * Module 4: Reflective Prompt Journal & Client-Side Text Analyzer
 */

export const REFLECTION_PROMPTS = [
    "What is a personal boundary that you've set recently, and how did it affect your relationship with yourself and others?",
    "Describe a choice you made today. Did it align with the person you want to become, or was it a reaction to stress?",
    "What is something you are holding onto that you know you need to let go of? What is keeping you from doing so?",
    "When was the last time you felt truly energized and in flow? What were you doing, and who were you with?",
    "What is a recent criticism or setback you experienced? How can you reframe it as a lesson or a moment of growth?",
    "Describe the physical environment in which you feel most calm and creative. How can you bring elements of that into your current space?",
    "What does balance mean to you in this current season of life? In what areas are you feeling out of alignment?",
    "If you could give one piece of compassionate advice to your younger self, what would it be?",
    "What are three small, simple things that brought you peace or joy today?",
    "What is a project or goal you are currently putting off? What is the core fear or resistance behind the delay?"
];

const STOP_WORDS = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
    'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or',
    'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on',
    'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
    "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
    'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn',
    "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn',
    "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't", 'would', 'could', 'should',
    'get', 'got', 'make', 'made', 'go', 'went', 'take', 'took', 'tell', 'said', 'think', 'thought', 'feel', 'felt'
]);

const POSITIVE_WORDS = new Set([
    'joy', 'happy', 'happier', 'happiest', 'excited', 'peace', 'peaceful', 'calm', 'calmer', 'proud', 'growth',
    'grow', 'love', 'loved', 'loving', 'support', 'supported', 'connection', 'connected', 'safe', 'safety',
    'positive', 'energy', 'energized', 'grateful', 'gratitude', 'clean', 'clear', 'clarity', 'healthy', 'health',
    'achieve', 'achieved', 'strong', 'strength', 'courage', 'courageous', 'values', 'aligned', 'alignment',
    'flow', 'warm', 'warmth', 'learn', 'learned', 'learning', 'inspire', 'inspired', 'thrive', 'thriving',
    'balance', 'balanced', 'hope', 'hopeful', 'kind', 'kindness', 'friendly', 'gentle', 'ease', 'comfort'
]);

const NEGATIVE_WORDS = new Set([
    'sad', 'sadder', 'saddest', 'angry', 'fear', 'fearful', 'stress', 'stressed', 'stressful', 'anxious',
    'anxiety', 'tired', 'down', 'pain', 'painful', 'hurt', 'lonely', 'loneliness', 'regret', 'regretful',
    'worry', 'worried', 'pressure', 'pressured', 'doubt', 'doubtful', 'block', 'blocked', 'struggle',
    'struggled', 'struggling', 'exhaust', 'exhausted', 'exhausting', 'confusion', 'confused', 'conflict',
    'lost', 'hate', 'hated', 'failure', 'fail', 'failed', 'bored', 'boredom', 'stuck', 'sadly', 'difficult',
    'difficulty', 'grief', 'grieved', 'unhappy', 'alone', 'broken', 'scared', 'worrying', 'worries', 'hard'
]);

const CATEGORY_KEYWORDS = {
    'Relationships': ['friend', 'friends', 'family', 'partner', 'wife', 'husband', 'kid', 'kids', 'mother', 'father', 'mom', 'dad', 'love', 'relationship', 'relationships', 'people', 'talked', 'shared'],
    'Career & Purpose': ['work', 'job', 'career', 'boss', 'office', 'project', 'projects', 'task', 'tasks', 'goals', 'goal', 'company', 'business', 'skills', 'learn', 'future'],
    'Wealth & Finance': ['money', 'budget', 'pay', 'paid', 'buy', 'save', 'savings', 'cost', 'spend', 'spent', 'finance', 'finances', 'financial', 'debt', 'bills'],
    'Health & Wellness': ['gym', 'run', 'running', 'sleep', 'sleeping', 'slept', 'health', 'healthy', 'eat', 'eating', 'food', 'nutrition', 'body', 'doctor', 'workout', 'physical', 'mental'],
    'Mindfulness': ['meditate', 'meditation', 'peace', 'spirit', 'spiritual', 'calm', 'breathe', 'breathing', 'breath', 'mind', 'mindful', 'present', 'moment', 'yoga', 'quiet']
};

export class PromptJournal {
    constructor(app) {
        this.app = app;
        this.promptIdx = 0;
        this.savedText = "";

        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.promptText = document.getElementById('current-prompt');
        this.textarea = document.getElementById('journal-textarea');
        this.charCounter = document.getElementById('journal-char-count');
        this.saveBtn = document.getElementById('save-journal-btn');
        this.prevPromptBtn = document.getElementById('prompt-prev-btn');
        this.nextPromptBtn = document.getElementById('prompt-next-btn');
        this.shufflePromptBtn = document.getElementById('shuffle-prompt-btn');

        // Analysis panel outputs
        this.sentimentMarker = document.getElementById('sentiment-marker-pos');
        this.sentimentPct = document.getElementById('sentiment-percentage');
        this.themeTagsCloud = document.getElementById('theme-tags-cloud');
    }

    bindEvents() {
        this.prevPromptBtn.addEventListener('click', () => this.shiftPrompt(-1));
        this.nextPromptBtn.addEventListener('click', () => this.shiftPrompt(1));
        this.shufflePromptBtn.addEventListener('click', () => this.shufflePrompt());

        this.textarea.addEventListener('input', () => {
            const text = this.textarea.value;
            const isValid = this.updateCounterUI(text);
            this.saveBtn.disabled = !isValid;

            // Auto-save the draft on every keystroke so leaving the screen
            // (without pressing Save) never loses what was written.
            this.saveDraft(text);

            if (isValid) {
                this.analyzeText(text);
            } else {
                this.resetAnalysis();
            }
        });

        this.saveBtn.addEventListener('click', () => {
            const text = this.textarea.value;
            const analysis = this.analyzeText(text);
            const entry = {
                ts: Date.now(),
                text: text,
                prompt: REFLECTION_PROMPTS[this.promptIdx],
                sentiment: analysis.sentiment,
                themes: analysis.themes
            };
            // Keep the existing single "journal" key (drives the Blueprint) AND
            // append to an entry log that powers streaks, synthesis and export.
            this.app.state.journal = {
                text: entry.text,
                prompt: entry.prompt,
                sentiment: entry.sentiment,
                themes: entry.themes
            };
            const entries = Array.isArray(this.app.state.journalEntries) ? this.app.state.journalEntries : [];
            entries.push(entry);
            this.app.state.journalEntries = entries;
            this.app.saveState();
            this.clearDraft();
            this.app.showToast('Reflection saved and integrated!', 'check');
            this.app.showScreen('dashboard-screen');
        });
    }

    saveDraft(text) {
        try {
            localStorage.setItem('innerspace_journal_draft', JSON.stringify({
                text: text,
                prompt: REFLECTION_PROMPTS[this.promptIdx]
            }));
        } catch (e) {
            // ignore quota / serialization errors for a best-effort draft
        }
    }

    loadDraft() {
        try {
            const raw = localStorage.getItem('innerspace_journal_draft');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    clearDraft() {
        localStorage.removeItem('innerspace_journal_draft');
    }

    updateCounterUI(text) {
        const len = text.length;
        const trimmed = text.trim();
        const wordsCount = trimmed ? trimmed.split(/\s+/).length : 0;
        this.charCounter.innerText = `${len} characters | ${wordsCount} words`;
        return wordsCount >= 10;
    }

    start() {
        // Load existing text if saved
        if (this.app.state.journal) {
            const text = this.app.state.journal.text;
            this.textarea.value = text;
            const isValid = this.updateCounterUI(text);
            this.saveBtn.disabled = !isValid;
            
            // Find index of saved prompt, if exists
            const savedPromptIdx = REFLECTION_PROMPTS.indexOf(this.app.state.journal.prompt);
            if (savedPromptIdx !== -1) {
                this.promptIdx = savedPromptIdx;
            }
            this.analyzeText(text);
        } else {
            // No completed entry — restore an in-progress draft if one exists.
            const draft = this.loadDraft();
            if (draft && draft.text) {
                this.textarea.value = draft.text;
                const savedPromptIdx = REFLECTION_PROMPTS.indexOf(draft.prompt);
                if (savedPromptIdx !== -1) this.promptIdx = savedPromptIdx;
                const isValid = this.updateCounterUI(draft.text);
                this.saveBtn.disabled = !isValid;
                if (isValid) {
                    this.analyzeText(draft.text);
                } else {
                    this.resetAnalysis();
                }
            } else {
                this.textarea.value = "";
                this.updateCounterUI("");
                this.saveBtn.disabled = true;
                this.resetAnalysis();
            }
        }

        this.updatePromptDisplay();
    }

    shiftPrompt(direction) {
        this.promptIdx = (this.promptIdx + direction + REFLECTION_PROMPTS.length) % REFLECTION_PROMPTS.length;
        this.updatePromptDisplay();
    }

    shufflePrompt() {
        let newIdx;
        do {
            newIdx = Math.floor(Math.random() * REFLECTION_PROMPTS.length);
        } while (newIdx === this.promptIdx);
        this.promptIdx = newIdx;
        this.updatePromptDisplay();
    }

    updatePromptDisplay() {
        this.promptText.innerText = `"${REFLECTION_PROMPTS[this.promptIdx]}"`;
    }

    resetAnalysis() {
        this.sentimentMarker.style.left = '50%';
        this.sentimentPct.innerText = 'Neutral';
        this.themeTagsCloud.innerHTML = `
            <span class="theme-tag-placeholder">Write at least 10 words to map your themes...</span>
        `;
    }

    /**
     * Client-Side NLP Engine
     * Calculates sentiment index and extracts semantic theme tags
     */
    analyzeText(text) {
        // Clean text & tokenize
        const words = text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\n]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0);

        let posCount = 0;
        let negCount = 0;
        const wordFreq = {};
        const catFreq = {
            'Relationships': 0,
            'Career & Purpose': 0,
            'Wealth & Finance': 0,
            'Health & Wellness': 0,
            'Mindfulness': 0
        };

        words.forEach(w => {
            // Sentiment count
            if (POSITIVE_WORDS.has(w)) posCount++;
            if (NEGATIVE_WORDS.has(w)) negCount++;

            // Semantic Category scoring
            Object.keys(CATEGORY_KEYWORDS).forEach(cat => {
                if (CATEGORY_KEYWORDS[cat].includes(w)) {
                    catFreq[cat]++;
                }
            });

            // Frequency tracking for non-stop words
            if (!STOP_WORDS.has(w) && w.length >= 4) {
                wordFreq[w] = (wordFreq[w] || 0) + 1;
            }
        });

        // 1. Sentiment Score calculation
        // Returns float between -1.0 (extremely negative) and 1.0 (extremely positive)
        let sentimentVal = 0.0;
        const totalSentWords = posCount + negCount;
        if (totalSentWords > 0) {
            sentimentVal = (posCount - negCount) / totalSentWords;
        }

        // Map to 0 - 100 percentage for UI slider positioning (50% is neutral)
        const sentimentPct = Math.round((sentimentVal + 1) * 50);

        // Update Sentiment UI
        this.sentimentMarker.style.left = `${sentimentPct}%`;
        let textLabel = 'Neutral';
        if (sentimentPct > 65) textLabel = 'Energized & Positive';
        else if (sentimentPct > 52) textLabel = 'Slightly Positive';
        else if (sentimentPct < 35) textLabel = 'Heavy & Restless';
        else if (sentimentPct < 48) textLabel = 'Quiet & Reflective';
        
        this.sentimentPct.innerText = `${textLabel} (${sentimentPct}%)`;

        // 2. Theme Tag Extraction
        let themes = [];

        // Check if any major category has multiple hits (weight: category gets prioritized)
        Object.keys(catFreq).forEach(cat => {
            if (catFreq[cat] >= 2) {
                themes.push(cat);
            }
        });

        // Extract top recurring terms
        const sortedWords = Object.keys(wordFreq).sort((a, b) => wordFreq[b] - wordFreq[a]);
        
        // Take top 4 frequent words and capitalize them
        const wordThemes = sortedWords.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1));
        
        // Combine category hits and top words
        themes = [...new Set([...themes, ...wordThemes])].slice(0, 5);

        // Render UI cloud tags
        this.themeTagsCloud.innerHTML = '';
        if (themes.length === 0) {
            this.themeTagsCloud.innerHTML = `
                <span class="theme-tag-placeholder">Keep writing to discover themes...</span>
            `;
        } else {
            themes.forEach(theme => {
                const tag = document.createElement('span');
                tag.className = 'theme-tag';
                tag.innerText = theme;
                this.themeTagsCloud.appendChild(tag);
            });
        }

        return {
            sentiment: { value: sentimentVal, pct: sentimentPct, label: textLabel },
            themes: themes
        };
    }
}
