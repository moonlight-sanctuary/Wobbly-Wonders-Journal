// Sidebar Manager Class - Handles mutual exclusivity between sidebars
class SidebarManager {
    constructor(leftToggle, rightToggle, analytics = null) {
        this.leftToggle = leftToggle;
        this.rightToggle = rightToggle;
        this.currentSidebar = null; // 'left', 'right', or null
        this.analytics = analytics;

        console.log('SidebarManager constructor called with:', {
            leftToggle: leftToggle,
            rightToggle: rightToggle,
            leftToggleExists: !!leftToggle,
            rightToggleExists: !!rightToggle
        });

        if (!leftToggle || !rightToggle) {
            console.error('SidebarManager: Missing toggle buttons!', { leftToggle, rightToggle });
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.leftToggle || !this.rightToggle) {
            console.error('Cannot setup event listeners: missing toggle buttons');
            return;
        }

        this.leftToggle.addEventListener('click', (e) => {
            console.log('Left toggle clicked!');
            e.preventDefault();
            this.toggleSidebar('left');
        });

        this.rightToggle.addEventListener('click', (e) => {
            console.log('Right toggle clicked!');
            e.preventDefault();
            this.toggleSidebar('right');
        });

        console.log('Event listeners attached to sidebar toggles');
    }

    toggleSidebar(side) {
        if (this.currentSidebar === side) {
            // Close the current sidebar
            this.closeSidebar(side);
        } else {
            // Open the requested sidebar (this will close the other if open)
            this.openSidebar(side);
        }
    }

    openSidebar(side) {
        console.log(`Opening ${side} sidebar`);

        // Close the other sidebar if it's open
        if (this.currentSidebar && this.currentSidebar !== side) {
            this.closeSidebar(this.currentSidebar);
        }

        // Open the requested sidebar
        document.body.classList.add(`${side}-open`);
        this.currentSidebar = side;

        console.log(`Body classes after opening ${side}:`, document.body.className);

        // Track sidebar usage (no content tracked)
        if (this.analytics) {
            this.analytics.trackUIInteraction(`${side}_sidebar`, 'opened');
        }

        // Update toggle button states
        this.updateToggleStates();
    }

    closeSidebar(side) {
        document.body.classList.remove(`${side}-open`);
        if (this.currentSidebar === side) {
            this.currentSidebar = null;
        }

        // Update toggle button states
        this.updateToggleStates();
    }

    updateToggleStates() {
        // Update visual states of toggle buttons if needed
        // This can be extended for visual feedback
    }

    getCurrentSidebar() {
        return this.currentSidebar;
    }

    isSidebarOpen(side) {
        return this.currentSidebar === side;
    }
}

// Template Manager Class - Handles entry templates and template management
class TemplateManager {
    constructor(journal) {
        this.journal = journal;
        this.maxTemplates = 5;
        this.defaultTemplates = this.initializeDefaultTemplates();
    }

    initializeDefaultTemplates() {
        return [
            {
                id: 'default-six-fs',
                name: 'Six F\'s Framework',
                icon: '📋',
                content: `# Six F's Reflection

## Facts
What happened today? What are the objective events?


## Feelings
How did I feel about these events? What emotions came up?


## Findings
What did I learn or discover? What patterns do I notice?


## Future
What do I want to do differently? What are my next steps?


## Feedback
What feedback did I receive or give? How can I grow from it?


## Fun
What brought me joy today? What am I grateful for?

`
            },
            {
                id: 'default-checkin',
                name: 'Basic Check-in',
                icon: '📋',
                content: `# Daily Check-in

## How am I feeling right now?


## What's on my mind?


## What went well today?


## What could have gone better?


## What am I looking forward to?

`
            }
        ];
    }

    getAvailableTemplates() {
        // Get custom templates sorted by order
        const customTemplates = this.getTemplateEntries()
            .sort((a, b) => a.templateOrder - b.templateOrder)
            .map(entry => ({
                id: entry.id,
                name: entry.title || this.truncateText(entry.content, 30),
                icon: '📌',
                content: entry.content,
                isCustom: true
            }));

        // Calculate how many default templates to show
        const availableSlots = this.maxTemplates - customTemplates.length;
        const defaultsToShow = this.defaultTemplates.slice(0, Math.max(0, availableSlots));

        return [...customTemplates, ...defaultsToShow];
    }

    getTemplateEntries() {
        return this.journal.entries.filter(entry => entry.isTemplate === true);
    }

    canAddMoreTemplates() {
        return this.getTemplateEntries().length < this.maxTemplates;
    }

    markAsTemplate(entryId) {
        if (!this.canAddMoreTemplates()) {
            this.journal.themeManager.showToast(
                'Template limit reached (5 max)',
                'warning',
                '⚠️'
            );
            return false;
        }

        const entry = this.journal.entries.find(e => e.id === entryId);
        if (!entry) {
            console.error('Entry not found:', entryId);
            return false;
        }

        // Find next available template order
        const existingOrders = this.getTemplateEntries()
            .map(e => e.templateOrder)
            .filter(order => order !== null);
        
        let nextOrder = 0;
        while (existingOrders.includes(nextOrder) && nextOrder < this.maxTemplates) {
            nextOrder++;
        }

        // Mark as template
        entry.isTemplate = true;
        entry.templateOrder = nextOrder;

        this.journal.saveEntries();
        this.journal.renderEntries();

        this.journal.themeManager.showToast(
            'Entry marked as template',
            'success',
            '📌'
        );

        // Track analytics
        this.journal.analytics.trackFeatureUse('template', 'created');

        return true;
    }

    unmarkAsTemplate(entryId) {
        const entry = this.journal.entries.find(e => e.id === entryId);
        if (!entry) {
            console.error('Entry not found:', entryId);
            return false;
        }

        // Unmark as template
        entry.isTemplate = false;
        entry.templateOrder = null;

        this.journal.saveEntries();
        this.journal.renderEntries();

        this.journal.themeManager.showToast(
            'Template removed',
            'info',
            '📌'
        );

        return true;
    }

    createEntryFromTemplate(templateId) {
        let templateContent = '';
        let templateName = '';

        // Check if it's a default template
        const defaultTemplate = this.defaultTemplates.find(t => t.id === templateId);
        if (defaultTemplate) {
            templateContent = defaultTemplate.content;
            templateName = defaultTemplate.name;
        } else {
            // It's a custom template
            const customTemplate = this.journal.entries.find(e => e.id === templateId);
            if (customTemplate) {
                templateContent = customTemplate.content;
                templateName = customTemplate.title || 'Custom Template';
            } else {
                this.journal.themeManager.showToast(
                    'Template not found',
                    'error',
                    '❌'
                );
                return;
            }
        }

        // Create new entry with template content
        this.journal.textarea.value = templateContent;
        this.journal.currentEntryId = null; // New entry
        this.journal.updateWordCount();
        
        // Mark as template content (ephemeral until edited)
        this.journal.isTemplateContent = true;
        this.journal.templateContentOriginal = templateContent;
        
        this.journal.textarea.focus();

        // Don't auto-save - wait for user to edit
        // Clear any pending auto-save
        if (this.journal.saveTimeout) {
            clearTimeout(this.journal.saveTimeout);
        }

        this.journal.themeManager.showToast(
            `Created from ${templateName}`,
            'success',
            '✨'
        );

        // Track analytics
        this.journal.analytics.trackFeatureUse('template', 'used');
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Theme Manager Class - Handles theme switching and customization
class ThemeManager {
    constructor() {
        this.currentTheme = 'warm';
        this.currentMode = 'light';
        this.themes = {
            warm: {
                name: 'Warm',
                description: 'Cozy and inviting',
                icon: '🔥',
                colors: {
                    light: { primary: '#ed8441', background: '#fef7f0', surface: '#ffffff' },
                    dark: { primary: '#f1a169', background: '#000000', surface: '#111111' }
                }
            },
            cool: {
                name: 'Cool',
                description: 'Professional and calming',
                icon: '❄️',
                colors: {
                    light: { primary: '#3b82f6', background: '#f0f9ff', surface: '#ffffff' },
                    dark: { primary: '#60a5fa', background: '#000000', surface: '#0f172a' }
                }
            },
            minimal: {
                name: 'Minimal',
                description: 'Clean and distraction-free',
                icon: '⚪',
                colors: {
                    light: { primary: '#374151', background: '#ffffff', surface: '#f9fafb' },
                    dark: { primary: '#d1d5db', background: '#000000', surface: '#111827' }
                }
            }
        };

        this.loadPreferences();
        this.initializeTheme();
        this.setupSystemThemeListener();
    }

    initializeTheme() {
        // Set initial theme attributes on document
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.documentElement.setAttribute('data-mode', this.currentMode);

        // Apply theme immediately
        this.applyTheme(this.currentTheme, this.currentMode);
    }

    setTheme(themeName, mode = null) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found`);
            return;
        }

        this.currentTheme = themeName;
        if (mode) {
            this.currentMode = mode;
        }

        this.applyTheme(themeName, this.currentMode);
        this.savePreferences();
        this.notifyThemeChange();
        
        // Notify analytics if available (passed via callback)
        if (this.onThemeChange) {
            this.onThemeChange(themeName, this.currentMode);
        }
    }

    toggleMode() {
        const newMode = this.currentMode === 'light' ? 'dark' : 'light';
        this.setTheme(this.currentTheme, newMode);
    }

    applyTheme(themeName, mode) {
        // Update document attributes for CSS targeting
        document.documentElement.setAttribute('data-theme', themeName);
        document.documentElement.setAttribute('data-mode', mode);

        // Add transition class for smooth changes
        document.documentElement.classList.add('theme-transitioning');

        // Remove transition class after animation
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 300);
    }

    savePreferences() {
        try {
            const preferences = {
                theme: this.currentTheme,
                mode: this.currentMode
            };
            localStorage.setItem('themePreferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Failed to save theme preferences:', error);
        }
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('themePreferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                this.currentTheme = preferences.theme || 'warm';
                this.currentMode = preferences.mode || this.getSystemPreference();
            } else {
                // Use system preference for initial mode
                this.currentMode = this.getSystemPreference();
            }
        } catch (error) {
            console.error('Failed to load theme preferences:', error);
            // Use defaults
            this.currentTheme = 'warm';
            this.currentMode = this.getSystemPreference();
        }
    }

    getSystemPreference() {
        // Check system preference for dark mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    setupSystemThemeListener() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const saved = localStorage.getItem('themePreferences');
                if (!saved) {
                    const newMode = e.matches ? 'dark' : 'light';
                    this.setTheme(this.currentTheme, newMode);
                }
            });
        }
    }

    notifyThemeChange() {
        // Update UI elements
        this.updateThemeSelector();
        this.updateModeToggle();

        // Dispatch custom event for components that need to react to theme changes
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: this.currentTheme,
                mode: this.currentMode
            }
        });
        document.dispatchEvent(event);
    }

    getCurrentTheme() {
        return {
            theme: this.currentTheme,
            mode: this.currentMode,
            info: this.themes[this.currentTheme]
        };
    }

    getAvailableThemes() {
        return this.themes;
    }

    showToast(message, type = 'info', icon = '✨') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

        // Add to container
        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    initializeUI() {
        this.createThemeSelector();
        this.setupEventListeners();
    }

    createThemeSelector() {
        const themeOptions = document.getElementById('themeOptions');
        if (!themeOptions) return;

        // Clear existing options
        themeOptions.innerHTML = '';

        // Create theme cards
        Object.entries(this.themes).forEach(([key, theme]) => {
            const themeCard = document.createElement('div');
            themeCard.className = `theme-card ${key === this.currentTheme ? 'active' : ''}`;
            themeCard.dataset.theme = key;

            const colors = theme.colors[this.currentMode];
            themeCard.innerHTML = `
                <div class="theme-preview">
                    <div class="color-dot" style="background-color: ${colors.primary}"></div>
                </div>
                <div class="theme-info">
                    <div class="theme-name">${theme.icon} ${theme.name}</div>
                    <div class="theme-description">${theme.description}</div>
                </div>
            `;

            themeOptions.appendChild(themeCard);
        });
    }

    setupEventListeners() {
        // Theme card clicks
        document.addEventListener('click', (e) => {
            const themeCard = e.target.closest('.theme-card');
            if (themeCard) {
                const themeName = themeCard.dataset.theme;
                const theme = this.themes[themeName];
                this.setTheme(themeName);
                this.showToast(`Switched to ${theme.name} theme`, 'success', theme.icon);
            }
        });

        // Mode toggle clicks
        document.addEventListener('click', (e) => {
            const modeBtn = e.target.closest('.mode-btn');
            if (modeBtn) {
                const mode = modeBtn.dataset.mode;
                this.setTheme(this.currentTheme, mode);
                const icon = mode === 'dark' ? '🌙' : '☀️';
                const modeName = mode === 'dark' ? 'Dark' : 'Light';
                this.showToast(`Switched to ${modeName} mode`, 'success', icon);
            }
        });
    }

    updateThemeSelector() {
        // Update active theme card
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.theme === this.currentTheme);
        });

        // Recreate theme cards with updated colors
        this.createThemeSelector();
    }

    updateModeToggle() {
        // Update active mode button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });
    }
}

// AI Service Class - Handles AI communication and status monitoring
class AIService {
    constructor() {
        this.status = 'disconnected';
        this.capabilities = [];
        this.ollamaEndpoint = 'http://localhost:11434';
        this.model = this.loadSelectedModel();
        this.statusCallbacks = [];
        this.isChecking = false;

        // Available models with descriptions - Latest and best options
        this.availableModels = {
            'qwen3:0.6b': {
                name: 'Qwen3 0.6B',
                description: 'Latest Qwen model, ultra-fast and efficient',
                size: '0.4GB',
                speed: 'Ultra Fast',
                category: 'Latest'
            },
            'qwen3:1.7b': {
                name: 'Qwen3 1.7B',
                description: 'Latest Qwen with excellent reasoning',
                size: '1.0GB',
                speed: 'Very Fast',
                category: 'Latest'
            },
            'qwen3:4b': {
                name: 'Qwen3 4B',
                description: 'High-quality latest generation model',
                size: '2.4GB',
                speed: 'Fast',
                category: 'Latest'
            },
            'gemma3:1b': {
                name: 'Gemma3 1B',
                description: 'Google\'s latest, most efficient model',
                size: '0.7GB',
                speed: 'Ultra Fast',
                category: 'Latest'
            },
            'gemma3:4b': {
                name: 'Gemma3 4B',
                description: 'Latest Gemma with superior capabilities',
                size: '2.5GB',
                speed: 'Fast',
                category: 'Latest'
            },
            'deepseek-r1:1.5b': {
                name: 'DeepSeek-R1 1.5B',
                description: 'Thinking model with reasoning chains',
                size: '0.9GB',
                speed: 'Fast',
                category: 'Thinking'
            },
            'deepseek-r1:7b': {
                name: 'DeepSeek-R1 7B',
                description: 'Advanced thinking model, excellent reasoning',
                size: '4.1GB',
                speed: 'Medium',
                category: 'Thinking'
            },
            'gpt-oss:20b': {
                name: 'GPT-OSS 20B',
                description: 'OpenAI-style thinking model, very capable',
                size: '12GB',
                speed: 'Slow',
                category: 'Thinking'
            },
            'llama3.1:8b': {
                name: 'Llama 3.1 8B',
                description: 'Meta\'s proven model, reliable and fast',
                size: '4.7GB',
                speed: 'Medium',
                category: 'Reliable'
            },
            'llama3.2:1b': {
                name: 'Llama 3.2 1B',
                description: 'Compact and efficient (current default)',
                size: '1.3GB',
                speed: 'Very Fast',
                category: 'Reliable'
            }
        };
    }

    loadSelectedModel() {
        try {
            const saved = localStorage.getItem('selectedAIModel');
            return saved || 'llama3.2:1b';
        } catch (error) {
            return 'llama3.2:1b';
        }
    }

    async setModel(modelName) {
        if (this.availableModels[modelName]) {
            this.model = modelName;
            localStorage.setItem('selectedAIModel', modelName);

            // Show downloading status if model needs to be downloaded
            this.updateStatus('downloading');

            try {
                // Try to pull the model if it doesn't exist
                await this.ensureModelExists(modelName);
                // Re-check status with new model
                await this.checkOllamaStatus();

                // Show success toast if connected
                if (this.status === 'connected') {
                    const model = this.getCurrentModel();
                    // Find theme manager through window.journal
                    if (window.journal && window.journal.themeManager) {
                        window.journal.themeManager.showToast(`${model.name} ready!`, 'success', '✅');
                    }
                }
            } catch (error) {
                console.error('Error setting model:', error);
                this.updateStatus('model-missing');

                // Show error toast
                if (window.journal && window.journal.themeManager) {
                    window.journal.themeManager.showToast('Model download failed', 'error', '❌');
                }
            }
        }
    }

    async ensureModelExists(modelName) {
        try {
            // First check if model exists
            const response = await fetch(`${this.ollamaEndpoint}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });

            if (response.ok) {
                const data = await response.json();
                const hasModel = data.models?.some(model =>
                    model.name.includes(modelName.split(':')[0]) &&
                    model.name.includes(modelName.split(':')[1])
                );

                if (!hasModel) {
                    // Model doesn't exist, try to pull it
                    console.log(`Downloading model: ${modelName}`);

                    // Show downloading toast
                    if (window.journal && window.journal.themeManager) {
                        window.journal.themeManager.showToast(`Downloading ${modelName}...`, 'info', '⬇️');
                    }

                    const pullResponse = await fetch(`${this.ollamaEndpoint}/api/pull`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: modelName })
                    });

                    if (!pullResponse.ok) {
                        throw new Error(`Failed to download model: ${modelName}`);
                    }

                    // Wait a bit for the download to start
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    console.log(`Model download initiated: ${modelName}`);
                }
            }
        } catch (error) {
            console.error('Error ensuring model exists:', error);
            throw error;
        }
    }

    getAvailableModels() {
        return this.availableModels;
    }

    getCurrentModel() {
        return {
            id: this.model,
            ...this.availableModels[this.model]
        };
    }

    async checkOllamaStatus() {
        if (this.isChecking) return this.status;

        this.isChecking = true;
        this.updateStatus('checking');

        try {
            // Check if Ollama is running
            const response = await fetch(`${this.ollamaEndpoint}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });

            if (response.ok) {
                const data = await response.json();
                const hasModel = data.models?.some(model =>
                    model.name.includes(this.model.split(':')[0]) &&
                    model.name.includes(this.model.split(':')[1])
                );

                if (hasModel) {
                    this.updateStatus('connected');
                    this.capabilities = ['Chat with AI', 'Explore Patterns', 'Reflect on Entries'];
                } else {
                    this.updateStatus('model-missing');
                }
            } else {
                this.updateStatus('disconnected');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                this.updateStatus('timeout');
            } else {
                this.updateStatus('not-installed');
            }
        }

        this.isChecking = false;
        return this.status;
    }

    updateStatus(status) {
        this.status = status;
        this.statusCallbacks.forEach(callback => callback(status));

        // Update UI status display
        const statusElement = document.getElementById('aiStatus');
        if (statusElement) {
            const indicator = statusElement.querySelector('.status-indicator');
            const text = statusElement.querySelector('span');

            if (indicator && text) {
                switch (status) {
                    case 'connected':
                        indicator.className = 'status-indicator connected';
                        text.textContent = `AI: ${this.getCurrentModel().name}`;
                        break;
                    case 'downloading':
                        indicator.className = 'status-indicator downloading';
                        text.textContent = 'AI: Downloading model...';
                        break;
                    case 'model-missing':
                        indicator.className = 'status-indicator warning';
                        text.textContent = 'AI: Model not found';
                        break;
                    case 'checking':
                        indicator.className = 'status-indicator checking';
                        text.textContent = 'AI: Checking...';
                        break;
                    default:
                        indicator.className = 'status-indicator disconnected';
                        text.textContent = 'AI: Disconnected';
                }
            }
        }
    }

    onStatusChange(callback) {
        this.statusCallbacks.push(callback);
    }



    // Entry title generation removed - focusing on chat-based AI interaction

    async chatWithEntries(query, entries, currentEntryId = null) {
        if (this.status !== 'connected') {
            throw new Error('AI service not available');
        }

        // Smart context creation that includes all entries but manages size
        const allEntriesContext = this.createSmartContext(query, entries);

        // Add current entry context if available
        let currentEntryContext = '';
        if (currentEntryId) {
            const currentEntry = entries.find(e => e.id === currentEntryId);
            if (currentEntry) {
                const date = new Date(currentEntry.date).toLocaleDateString();
                currentEntryContext = `\n\nCURRENT ENTRY (what they're viewing now):\n[${date}] ${currentEntry.content}`;
            }
        }

        const prompt = `You are a reflection companion helping someone explore their journal entries. Be supportive but not overly empathetic. Focus on practical insights and healthy reflection.

${allEntriesContext}${currentEntryContext}

Their question: ${query}

RESPONSE STRUCTURE (follow exactly):
1. ACKNOWLEDGE (1-2 sentences): Mirror their question/desire to reflect
2. OBSERVE (2-3 sentences): Brief summary of what you notice in their entries
3. ANSWER (2-3 sentences): Direct response to their specific question
4. INSIGHT (2-3 sentences): Additional perspective or pattern you notice
5. REFLECT (1-2 sentences): Ask them to consider the insights provided

IMPORTANT GUIDELINES:
- Write in short paragraphs (2-3 sentences max)
- Reference specific entries: "In your [date] entry..."
- If negative emotions detected: acknowledge briefly, then redirect to positive actions
- For harmful thoughts: encourage external support (trusted friend, family, professional help)
- Suggest healthy activities: going outside, talking to someone, doing something enjoyable
- Stay supportive but professional, not overly emotional
- Focus on growth and self-awareness

Your structured response:`;

        const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate response');
        }

        const data = await response.json();
        return data.response.trim();
    }

    createSmartContext(query, entries) {
        if (entries.length === 0) {
            return "No journal entries found.";
        }

        // Create a comprehensive but manageable context
        let context = `COMPLETE JOURNAL HISTORY (${entries.length} total entries):\n\n`;

        // For queries about specific topics, try to find relevant entries
        const queryLower = query.toLowerCase();
        const relevantEntries = [];
        const otherEntries = [];

        // Categorize entries based on relevance to the query
        entries.forEach(entry => {
            const contentLower = entry.content.toLowerCase();
            const isRelevant = this.isEntryRelevant(queryLower, contentLower);

            if (isRelevant) {
                relevantEntries.push(entry);
            } else {
                otherEntries.push(entry);
            }
        });

        // Include all relevant entries with full content
        if (relevantEntries.length > 0) {
            context += "MOST RELEVANT ENTRIES:\n";
            relevantEntries.forEach(entry => {
                const date = new Date(entry.date).toLocaleDateString();
                const preview = entry.content.length > 500 ?
                    entry.content.substring(0, 500) + '...' :
                    entry.content;
                context += `[${date}] ${preview}\n\n`;
            });
        }

        // Include recent entries (last 15) with moderate detail
        const recentEntries = otherEntries.slice(0, 15);
        if (recentEntries.length > 0) {
            context += "RECENT ENTRIES:\n";
            recentEntries.forEach(entry => {
                const date = new Date(entry.date).toLocaleDateString();
                const preview = entry.content.substring(0, 300);
                context += `[${date}] ${preview}${entry.content.length > 300 ? '...' : ''}\n\n`;
            });
        }

        // Include older entries with brief summaries
        const olderEntries = otherEntries.slice(15);
        if (olderEntries.length > 0) {
            context += `OLDER ENTRIES SUMMARY (${olderEntries.length} entries):\n`;

            // Group older entries by month for better organization
            const monthlyGroups = this.groupEntriesByMonth(olderEntries);

            Object.entries(monthlyGroups).forEach(([month, monthEntries]) => {
                context += `${month}: ${monthEntries.length} entries - `;
                const themes = this.extractThemes(monthEntries);
                context += `Main themes: ${themes.join(', ')}\n`;
            });
        }

        return context;
    }

    isEntryRelevant(queryLower, contentLower) {
        // Extract key terms from the query
        const queryTerms = queryLower
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(term => term.length > 2)
            .filter(term => !['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'what', 'when', 'where', 'why', 'how', 'about', 'with', 'from', 'they', 'them', 'their', 'this', 'that', 'these', 'those'].includes(term));

        // Check if any query terms appear in the content
        return queryTerms.some(term => contentLower.includes(term));
    }

    groupEntriesByMonth(entries) {
        const groups = {};

        entries.forEach(entry => {
            const date = new Date(entry.date);
            const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(entry);
        });

        return groups;
    }

    extractThemes(entries) {
        // Simple theme extraction based on common words
        const wordCounts = {};
        const commonWords = new Set(['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'with', 'from', 'they', 'them', 'their', 'this', 'that', 'these', 'those', 'very', 'just', 'like', 'more', 'some', 'time', 'only', 'know', 'think', 'also', 'back', 'after', 'use', 'two', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us']);

        entries.forEach(entry => {
            const words = entry.content.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 3 && !commonWords.has(word));

            words.forEach(word => {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
        });

        // Return top themes
        return Object.entries(wordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([word]) => word);
    }


}

// Privacy-Safe Analytics Wrapper
class PrivacyAnalytics {
    constructor() {
        this.enabled = typeof gtag !== 'undefined';
        console.log('Privacy Analytics initialized:', this.enabled ? 'Enabled' : 'Disabled');
    }
    
    // Track feature usage without any content
    trackFeatureUse(feature, action = 'used') {
        if (!this.enabled) return;
        
        gtag('event', action, {
            event_category: 'feature_usage',
            event_label: feature,
            // NEVER include any user content or data
            value: 1
        });
    }
    
    // Track UI interactions
    trackUIInteraction(element, action = 'click') {
        if (!this.enabled) return;
        
        gtag('event', action, {
            event_category: 'ui_interaction',
            event_label: element,
            // Only track the interaction, never the content
            value: 1
        });
    }
    
    // Track theme changes (safe - no content)
    trackThemeChange(theme, mode) {
        if (!this.enabled) return;
        
        gtag('event', 'theme_change', {
            event_category: 'customization',
            event_label: `${theme}_${mode}`,
            value: 1
        });
    }
    
    // Track AI status (safe - no content)
    trackAIStatus(status) {
        if (!this.enabled) return;
        
        gtag('event', 'ai_status', {
            event_category: 'ai_usage',
            event_label: status,
            value: 1
        });
    }
}

// Simple Journal App - Extracted JavaScript
class SimpleJournal {
    constructor() {
        this.entries = this.loadEntries();
        this.currentEntryId = null;
        this.saveTimeout = null;
        this.typingTimeout = null;
        this.timeUpdateInterval = null;
        this.lastSavedTimestamp = null;
        this.sidebarManager = null; // Will be initialized in setupElements
        this.aiService = new AIService();
        this.themeManager = new ThemeManager();
        this.analytics = new PrivacyAnalytics();
        this.templateManager = new TemplateManager(this); // Initialize template manager
        this.currentFilter = 'all'; // 'all' or 'templates'
        this.isTemplateContent = false; // Track if current content is from template
        this.templateContentOriginal = null; // Store original template content
        
        // Set up analytics callbacks
        this.themeManager.onThemeChange = (theme, mode) => {
            this.analytics.trackThemeChange(theme, mode);
        };
        
        this.aiService.onStatusChange((status) => {
            this.analytics.trackAIStatus(status);
        });
        this.chatInterface = null;

        this.init();
    }

    init() {
        console.log('🚀 Starting Simple Journal...');

        // Add loading class to body
        document.body.classList.add('loading');

        this.setupElements();
        this.setupEventListeners();
        this.renderEntries();
        this.updateWordCount();

        // Initialize AI service
        this.initializeAIService();

        // Welcome overlay removed - cleaner startup

        // Remove loading class after a short delay
        setTimeout(() => {
            document.body.classList.remove('loading');
        }, 200);

        console.log('✅ Simple Journal ready!');
    }

    setupElements() {
        // Core elements
        this.textarea = document.getElementById('journalEntry');
        this.wordCount = document.getElementById('wordCount');
        this.entryList = document.getElementById('entryList');
        this.searchInput = document.getElementById('searchInput');
        // Welcome overlay removed - no longer needed
        this.writingContainer = document.querySelector('.writing-container');

        // Autosave elements
        this.autosaveDot = document.getElementById('autosaveDot');
        this.autosaveStatus = document.getElementById('autosaveStatus');
        this.lastSavedTime = document.getElementById('lastSavedTime');

        // Initialize enhanced sidebar management - get elements fresh
        setTimeout(() => {
            this.leftToggle = document.getElementById('leftToggle');
            this.rightToggle = document.getElementById('rightToggle');

            console.log('Fresh element lookup:', {
                leftToggle: this.leftToggle,
                rightToggle: this.rightToggle,
                leftToggleId: this.leftToggle?.id,
                rightToggleId: this.rightToggle?.id
            });

            if (this.leftToggle && this.rightToggle) {
                this.sidebarManager = new SidebarManager(this.leftToggle, this.rightToggle, this.analytics);
                console.log('SidebarManager created successfully:', this.sidebarManager);
            } else {
                console.error('Toggle buttons not found!');
            }
        }, 100);

        // Buttons
        this.newBtn = document.getElementById('newBtn');
        this.templateDropdownBtn = document.getElementById('templateDropdownBtn');
        this.newEntryDropdown = document.getElementById('newEntryDropdown');
        this.floatingNewBtn = document.getElementById('floatingNewBtn');
        
        // Debug: Check if template dropdown button exists
        if (!this.templateDropdownBtn) {
            console.error('Template dropdown button not found!');
        } else {
            console.log('Template dropdown button found:', this.templateDropdownBtn);
        }
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.aiChatBtn = document.getElementById('aiChatBtn');
        this.aiStatus = document.getElementById('aiStatus');
        this.aiCapabilities = document.getElementById('aiCapabilities');

        // Template filter elements
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.templateCount = document.getElementById('templateCount');

        // Template management elements
        this.templateManagement = document.getElementById('templateManagement');
        this.templateCountText = document.getElementById('templateCountText');
        this.templateListContainer = document.getElementById('templateListContainer');

        // Entry summary elements removed - no longer using summarization

        // Floating chat interface elements
        this.floatingAIChat = document.getElementById('floatingAIChat');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.chatSendBtn = document.getElementById('chatSendBtn');
        this.chatCloseBtn = document.getElementById('chatCloseBtn');
        this.chatActions = document.getElementById('chatActions');
        this.createReflectionBtn = document.getElementById('createReflectionBtn');

        // Test panel button
        this.testToggleBtn = document.getElementById('testToggleBtn');

        // Initialize theme UI
        this.themeManager.initializeUI();

        // Initialize AI model selector
        this.initializeModelSelector();

        // Initialize template dropdown
        this.initializeTemplateDropdown();
    }

    setupEventListeners() {
        // Welcome overlay removed - no longer needed

        // Focus textarea on main content click
        document.querySelector('.main-content').addEventListener('click', () => {
            this.textarea.focus();
        });

        // Sidebar toggles are now handled by SidebarManager

        // Textarea
        this.textarea.addEventListener('input', () => {
            this.updateWordCount();
            
            // Check if this is the first edit of template content
            if (this.isTemplateContent) {
                // User has started editing the template
                this.isTemplateContent = false;
                this.templateContentOriginal = null;
            }
            
            this.autoSave();

            // Add typing indicator
            this.writingContainer?.classList.add('typing');
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                this.writingContainer?.classList.remove('typing');
            }, 1000);
        });

        this.textarea.addEventListener('focus', () => {
            this.writingContainer?.classList.add('focused');
        });

        this.textarea.addEventListener('blur', () => {
            this.writingContainer?.classList.remove('focused');
            // No automatic welcome screen reappearing - less annoying UX
        });

        // Buttons
        this.newBtn.addEventListener('click', () => this.createBlankEntry());
        this.templateDropdownBtn.addEventListener('click', (e) => this.toggleTemplateDropdown(e));
        this.floatingNewBtn.addEventListener('click', () => this.createBlankEntry());
        this.exportBtn.addEventListener('click', () => this.exportEntries());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.handleImport(e));
        this.aiChatBtn.addEventListener('click', () => this.toggleAIChat());
        this.testToggleBtn.addEventListener('click', () => this.toggleTestPanel());


        // Chat interface
        this.chatSendBtn.addEventListener('click', () => this.sendChatMessage());
        this.chatCloseBtn.addEventListener('click', () => this.closeAIChat());
        this.createReflectionBtn.addEventListener('click', () => this.createReflectionEntry());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Search
        this.searchInput.addEventListener('input', () => this.filterEntries());

        // Template filter tabs
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchFilter(tab.dataset.filter));
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.new-entry-container')) {
                this.closeTemplateDropdown();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === '[') {
                e.preventDefault();
                this.sidebarManager.toggleSidebar('left');
            }
            if ((e.metaKey || e.ctrlKey) && e.key === ']') {
                e.preventDefault();
                this.sidebarManager.toggleSidebar('right');
            }
        });
    }

    updateWordCount() {
        const text = this.textarea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        this.wordCount.textContent = `${words} words`;
    }

    autoSave() {
        // Show saving status
        this.updateAutosaveStatus('saving');

        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveCurrentEntry();
        }, 1000);
    }

    saveCurrentEntry() {
        const content = this.textarea.value.trim();
        if (!content) {
            this.updateAutosaveStatus('saved');
            return;
        }

        const now = new Date();
        const entry = {
            id: this.currentEntryId || this.generateId(),
            content: content,
            date: now.toISOString(),
            wordCount: content.split(/\s+/).length,
            // summary field removed - focusing on chat-based AI interaction
            title: null // Short title for entry list
        };

        // Update or add entry
        const existingIndex = this.entries.findIndex(e => e.id === entry.id);
        if (existingIndex >= 0) {
            // Preserve existing title when updating content
            const existingEntry = this.entries[existingIndex];
            entry.title = existingEntry.title;
            this.entries[existingIndex] = entry;
        } else {
            this.entries.unshift(entry);
        }

        this.currentEntryId = entry.id;
        this.saveEntries();
        this.renderEntries();

        // Update autosave status
        this.updateAutosaveStatus('saved', now);
    }

    updateAutosaveStatus(status, timestamp = null) {
        if (!this.autosaveDot || !this.autosaveStatus || !this.lastSavedTime) return;

        if (status === 'saving') {
            this.autosaveDot.classList.add('saving');
            this.autosaveStatus.textContent = 'Saving...';
            this.lastSavedTime.textContent = '';
        } else if (status === 'saved') {
            this.autosaveDot.classList.remove('saving');
            this.autosaveStatus.textContent = 'Saved';

            if (timestamp) {
                this.lastSavedTimestamp = timestamp;
                this.updateSavedTimeDisplay();

                // Update the time display every minute
                if (this.timeUpdateInterval) {
                    clearInterval(this.timeUpdateInterval);
                }
                this.timeUpdateInterval = setInterval(() => {
                    this.updateSavedTimeDisplay();
                }, 60000); // Update every minute
            }
        }
    }

    updateSavedTimeDisplay() {
        if (!this.lastSavedTimestamp || !this.lastSavedTime) return;

        const now = new Date();
        const diffMs = now - this.lastSavedTimestamp;
        const diffMinutes = Math.floor(diffMs / 60000);

        if (diffMinutes < 1) {
            this.lastSavedTime.textContent = 'just now';
        } else if (diffMinutes < 60) {
            this.lastSavedTime.textContent = `${diffMinutes} min ago`;
        } else {
            const timeString = this.lastSavedTimestamp.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            this.lastSavedTime.textContent = `at ${timeString}`;
        }
    }

    newEntry() {
        this.textarea.value = '';
        this.currentEntryId = null;
        this.updateWordCount();
        this.textarea.focus();
        
        // Track new entry creation (no content tracked)
        this.analytics.trackFeatureUse('new_entry', 'created');
    }

    loadEntry(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (entry) {
            this.textarea.value = entry.content;
            this.currentEntryId = entry.id;
            this.isTemplateContent = false;
            this.templateContentOriginal = null;
            this.updateWordCount();
            this.textarea.focus();
        }
    }

    renderEntries() {
        const filteredEntries = this.getFilteredEntries();
        const emptyState = document.getElementById('emptyState');

        // Update template count
        this.updateTemplateCount();

        if (filteredEntries.length === 0) {
            if (this.entries.length === 0) {
                // No entries at all
                emptyState.innerHTML = `
                    <div class="empty-icon">📝</div>
                    <p>No entries yet</p>
                    <span>Start writing to see your entries here</span>
                `;
            } else if (this.currentFilter === 'templates') {
                // No templates
                emptyState.innerHTML = `
                    <div class="empty-icon">📌</div>
                    <p>No templates yet</p>
                    <span>Mark an entry as a template to see it here</span>
                `;
            } else {
                // No search results
                emptyState.innerHTML = `
                    <div class="empty-icon">🔍</div>
                    <p>No matching entries</p>
                    <span>Try a different search term</span>
                `;
            }
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Clear and rebuild entry list
        const entryContainer = this.entryList;
        const existingEntries = entryContainer.querySelectorAll('.entry-group, .entry-item');
        existingEntries.forEach(entry => entry.remove());

        // Group entries by date
        const groupedEntries = this.groupEntriesByDate(filteredEntries);

        Object.entries(groupedEntries).forEach(([dateKey, entries]) => {
            // Create date group header
            const dateGroup = document.createElement('div');
            dateGroup.className = 'entry-group';

            const dateHeader = document.createElement('div');
            dateHeader.className = 'entry-date-header';
            dateHeader.textContent = dateKey;
            dateGroup.appendChild(dateHeader);

            // Add entries for this date
            entries.forEach(entry => {
                const div = document.createElement('div');
                div.className = 'entry-item';

                // Show AI-generated title if available, otherwise show content preview
                const displayContent = entry.title ?
                    `<div class="entry-title">
                        ${entry.title}
                        <button class="entry-title-remove" data-entry-id="${entry.id}" title="Remove title">×</button>
                    </div>
                    <div class="entry-preview">${this.truncateText(entry.content, 60)}</div>` :
                    `<div class="entry-preview">${this.truncateText(entry.content, 100)}</div>`;

                // Template indicator
                const templateIndicator = entry.isTemplate ? 
                    `<span class="entry-template-indicator" title="Template">📌</span>` : '';

                div.innerHTML = `
                    <div class="entry-header">
                        ${templateIndicator}
                        <div class="entry-actions">
                            <button class="entry-template-toggle ${entry.isTemplate ? 'active' : ''}" 
                                    data-entry-id="${entry.id}" 
                                    title="${entry.isTemplate ? 'Remove from templates' : 'Mark as template'}"
                                    aria-label="${entry.isTemplate ? 'Remove from templates' : 'Mark as template'}"
                                    aria-pressed="${entry.isTemplate}">
                                📌
                            </button>
                            <button class="entry-delete-btn" data-entry-id="${entry.id}" title="Delete entry">×</button>
                        </div>
                    </div>
                    ${displayContent}
                `;

                // Add click handler for loading entry (but not on action buttons)
                div.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('entry-delete-btn') &&
                        !e.target.classList.contains('entry-title-remove') &&
                        !e.target.classList.contains('entry-template-toggle')) {
                        this.loadEntry(entry.id);
                    }
                });

                // Add template toggle handler
                const templateToggle = div.querySelector('.entry-template-toggle');
                templateToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleEntryTemplate(entry.id);
                });

                // Add delete handler
                const deleteBtn = div.querySelector('.entry-delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteEntry(entry.id);
                });



                // Add title remove handler
                const titleRemoveBtn = div.querySelector('.entry-title-remove');
                if (titleRemoveBtn) {
                    titleRemoveBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeEntryTitle(entry.id);
                    });
                }

                dateGroup.appendChild(div);
            });

            entryContainer.appendChild(dateGroup);
        });
    }

    groupEntriesByDate(entries) {
        const groups = {};
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            let dateKey;

            if (this.isSameDay(entryDate, today)) {
                dateKey = 'Today';
            } else if (this.isSameDay(entryDate, yesterday)) {
                dateKey = 'Yesterday';
            } else {
                dateKey = entryDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: entryDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                });
            }

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(entry);
        });

        return groups;
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    }

    getFilteredEntries() {
        let filtered = this.entries;

        // Apply template filter
        if (this.currentFilter === 'templates') {
            filtered = filtered.filter(entry => entry.isTemplate === true);
        }

        // Apply search filter
        const query = this.searchInput.value.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(entry =>
                entry.content.toLowerCase().includes(query) ||
                new Date(entry.date).toLocaleDateString().includes(query)
            );
        }

        return filtered;
    }

    filterEntries() {
        this.renderEntries();
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    exportEntries() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            entries: this.entries
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.entries && Array.isArray(data.entries)) {
                    // Merge entries
                    data.entries.forEach(entry => {
                        if (!this.entries.find(e => e.id === entry.id)) {
                            this.entries.push(entry);
                        }
                    });

                    // Sort by date
                    this.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

                    this.saveEntries();
                    this.renderEntries();
                    alert(`Imported ${data.entries.length} entries successfully!`);
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // generateAISummary method removed - focusing on chat-based AI interaction

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    loadEntries() {
        try {
            const stored = localStorage.getItem('simpleJournalEntries');
            const entries = stored ? JSON.parse(stored) : [];
            
            // Ensure backward compatibility - add template fields if missing
            return entries.map(entry => ({
                ...entry,
                isTemplate: entry.isTemplate || false,
                templateOrder: entry.templateOrder || null
            }));
        } catch (error) {
            console.error('Error loading entries:', error);
            return [];
        }
    }

    saveEntries() {
        try {
            localStorage.setItem('simpleJournalEntries', JSON.stringify(this.entries));
        } catch (error) {
            console.error('Error saving entries:', error);
        }
    }

    updateAIStatus(status) {
        const statusElement = this.aiStatus.querySelector('span');
        if (statusElement) {
            statusElement.textContent = `AI: ${status}`;
        }

        // Update CSS classes for styling
        this.aiStatus.classList.remove('connected', 'generating', 'disconnected');

        if (status.toLowerCase().includes('connected')) {
            this.aiStatus.classList.add('connected');
        } else if (status.toLowerCase().includes('generating')) {
            this.aiStatus.classList.add('generating');
        } else {
            this.aiStatus.classList.add('disconnected');
        }
    }

    // Welcome screen methods removed - no longer needed

    checkWelcomeScreenVisibility() {
        // Welcome screen is now disabled by default - no more interruptions
        // Users can always start writing immediately
        return;
    }

    // Delete entry functionality
    deleteEntry(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        const confirmDelete = confirm(`Delete this entry from ${new Date(entry.date).toLocaleDateString()}?\n\n"${this.truncateText(entry.content, 100)}"`);

        if (confirmDelete) {
            this.entries = this.entries.filter(e => e.id !== entryId);

            // If we're currently editing this entry, clear the textarea
            if (this.currentEntryId === entryId) {
                this.newEntry();
            }

            this.saveEntries();
            this.renderEntries();
        }
    }

    // AI Service initialization and methods
    initializeAIService() {
        this.aiService.onStatusChange((status) => {
            this.updateAIStatus(status);
        });

        // Check AI status immediately and then periodically
        this.aiService.checkOllamaStatus();

        // Check every 30 seconds
        setInterval(() => {
            this.aiService.checkOllamaStatus();
        }, 30000);
    }

    updateAIStatus(status) {
        const statusElement = this.aiStatus.querySelector('span');
        const indicator = this.aiStatus.querySelector('.status-indicator');

        // Update status text and styling
        this.aiStatus.classList.remove('connected', 'generating', 'disconnected', 'checking', 'busy');

        switch (status) {
            case 'connected':
                statusElement.textContent = 'AI: Ready';
                this.aiStatus.classList.add('connected');
                this.aiCapabilities.style.display = 'block';
                break;
            case 'busy':
                statusElement.textContent = 'AI: Working...';
                this.aiStatus.classList.add('busy');
                this.aiCapabilities.style.display = 'block';
                break;
            case 'generating':
                statusElement.textContent = 'AI: Generating...';
                this.aiStatus.classList.add('generating');
                this.aiCapabilities.style.display = 'block';
                break;
            case 'checking':
                statusElement.textContent = 'AI: Checking...';
                this.aiStatus.classList.add('checking');
                this.aiCapabilities.style.display = 'none';
                break;
            case 'model-missing':
                statusElement.textContent = 'AI: Model Missing';
                this.aiStatus.classList.add('disconnected');
                this.aiCapabilities.style.display = 'none';
                break;
            case 'timeout':
                statusElement.textContent = 'AI: Connection Timeout';
                this.aiStatus.classList.add('disconnected');
                this.aiCapabilities.style.display = 'none';
                break;
            case 'not-installed':
                statusElement.textContent = 'AI: Ollama Not Found';
                this.aiStatus.classList.add('disconnected');
                this.aiCapabilities.style.display = 'none';
                break;
            default:
                statusElement.textContent = 'AI: Unavailable';
                this.aiStatus.classList.add('disconnected');
                this.aiCapabilities.style.display = 'none';
        }
    }

    // AI Chat functionality
    toggleAIChat() {
        const isVisible = this.floatingAIChat.style.display !== 'none';

        if (isVisible) {
            this.closeAIChat();
        } else {
            this.openAIChat();
        }
    }

    openAIChat() {
        this.floatingAIChat.style.display = 'flex';
        // Use setTimeout to ensure display change is processed before adding show class
        setTimeout(() => {
            this.floatingAIChat.classList.add('show');
        }, 10);
        
        // Track AI chat opening (no content tracked)
        this.analytics.trackFeatureUse('ai_chat', 'opened');

        // Clear any existing messages since chat content isn't saved
        this.chatMessages.innerHTML = `
            <div class="chat-welcome">
                <p>I can help you explore your journal entries and identify patterns in your thinking.</p>
                <p>Ask me about specific entries, themes across your writing, or insights from your reflections.</p>
            </div>
        `;

        // Hide action button when opening
        this.chatActions.style.display = 'none';
        this.lastAIResponse = null;

        setTimeout(() => {
            this.chatInput.focus();
        }, 300); // Wait for animation to complete
    }

    closeAIChat() {
        this.floatingAIChat.classList.remove('show');
        // Wait for animation to complete before hiding
        setTimeout(() => {
            this.floatingAIChat.style.display = 'none';
        }, 300);

        // Clear messages when closing since they're not saved
        this.chatMessages.innerHTML = `
            <div class="chat-welcome">
                <p>I can help you explore your journal entries and identify patterns in your thinking.</p>
                <p>Ask me about specific entries, themes across your writing, or insights from your reflections.</p>
            </div>
        `;
    }

    async sendChatMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Clear welcome message if it exists
        const welcomeMsg = this.chatMessages.querySelector('.chat-welcome');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        // Add user message
        this.addChatMessage('user', message);
        this.chatInput.value = '';

        // Disable send button while processing
        this.chatSendBtn.disabled = true;
        this.chatSendBtn.textContent = 'Thinking...';

        // Show typing indicator
        const typingId = this.addChatMessage('ai', 'Thinking...', true);

        try {
            // Pass current entry context to AI
            const response = await this.aiService.chatWithEntries(message, this.entries, this.currentEntryId);

            // Remove typing indicator and add response
            document.getElementById(typingId).remove();
            this.addChatMessage('ai', response);

            // Store last AI response for reflection entry
            this.lastAIResponse = response;

            // Show action button after AI response
            this.chatActions.style.display = 'block';
        } catch (error) {
            document.getElementById(typingId).remove();
            const currentModel = this.aiService.getCurrentModel();
            this.addChatMessage('ai', `I'm having trouble connecting right now and can't respond to your question. 

To get me working again:
• Make sure Ollama is running on your computer
• Download the ${currentModel.name} model: ollama pull ${currentModel.id}

I'll be here when you get me connected!`);
        } finally {
            // Re-enable send button
            this.chatSendBtn.disabled = false;
            this.chatSendBtn.textContent = 'Send';
        }
    }

    addChatMessage(sender, content, isTyping = false) {
        const messageDiv = document.createElement('div');
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        messageDiv.id = messageId;
        messageDiv.className = `chat-message ${sender}-message ${isTyping ? 'typing' : ''}`;

        // Format content with better paragraph spacing for AI messages
        let formattedContent = content;
        if (sender === 'ai' && !isTyping) {
            // Split content into paragraphs and wrap each in a <p> tag for better spacing
            const paragraphs = content
                .split(/\n\s*\n/) // Split on double line breaks (with optional whitespace)
                .filter(p => p.trim()) // Remove empty paragraphs
                .map(p => p.replace(/\n/g, '<br>')) // Convert single line breaks to <br>
                .map(p => `<p>${p.trim()}</p>`) // Wrap each paragraph in <p> tags
                .join('');

            formattedContent = paragraphs;
        } else {
            // For user messages, just convert line breaks to <br>
            formattedContent = content.replace(/\n/g, '<br>');
        }

        messageDiv.innerHTML = `
            <div class="message-content">${formattedContent}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        return messageId;
    }

    createReflectionEntry() {
        if (!this.lastAIResponse) return;

        // Close the AI chat
        this.closeAIChat();

        // Create a new entry with the AI response as a starting point
        this.newEntry();

        // Add the AI response and reflection prompt to the textarea
        const reflectionPrompt = `💭 Reflection on AI Insights:

"${this.lastAIResponse}"

---

What do I think about these insights? How do they resonate with my experience? What actions might I take based on this reflection?

`;

        this.textarea.value = reflectionPrompt;
        this.textarea.focus();

        // Position cursor at the end
        this.textarea.setSelectionRange(reflectionPrompt.length, reflectionPrompt.length);

        // Trigger auto-save
        this.handleInput();
        
        // Track reflection entry creation (no content tracked)
        this.analytics.trackFeatureUse('reflection_entry', 'created');
    }

    // Test panel integration
    async toggleTestPanel() {
        const panel = document.getElementById('testPanel');
        const isVisible = panel.style.display !== 'none';

        if (isVisible) {
            panel.style.display = 'none';
        } else {
            panel.style.display = 'block';
            // Show loading state
            panel.innerHTML = '<div class="test-loading">🧪 Running tests...</div>';

            // Run tests when panel is opened
            if (window.testFramework) {
                await window.testFramework.runAllTests();
            }
        }
    }



    // Entry title generation removed - focusing on chat-based AI interaction

    removeEntryTitle(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        // Remove the title
        entry.title = null;
        this.saveEntries();
        this.renderEntries();
    }


    initializeModelSelector() {
        this.currentModelDisplay = document.getElementById('currentModel');
        this.modelDropdown = document.getElementById('modelDropdown');
        this.modelDropdownBtn = document.getElementById('modelDropdownBtn');

        if (!this.currentModelDisplay || !this.modelDropdown || !this.modelDropdownBtn) return;

        // Update current model display
        this.updateCurrentModelDisplay();

        // Create model options
        this.createModelOptions();

        // Setup event listeners
        this.setupModelSelectorEvents();
    }

    updateCurrentModelDisplay() {
        const currentModel = this.aiService.getCurrentModel();
        const modelInfo = this.currentModelDisplay.querySelector('.model-info');

        if (modelInfo) {
            const nameEl = modelInfo.querySelector('.model-name');
            const descEl = modelInfo.querySelector('.model-description');

            if (nameEl) nameEl.textContent = currentModel.name || 'Unknown Model';
            if (descEl) descEl.textContent = `${currentModel.size} • ${currentModel.speed}`;
        }
    }

    createModelOptions() {
        const models = this.aiService.getAvailableModels();
        const currentModelId = this.aiService.getCurrentModel().id;

        this.modelDropdown.innerHTML = '';

        // Group models by category
        const categories = {
            'Latest': [],
            'Thinking': [],
            'Reliable': []
        };

        Object.entries(models).forEach(([id, model]) => {
            const category = model.category || 'Reliable';
            categories[category].push({ id, ...model });
        });

        // Create options for each category
        Object.entries(categories).forEach(([category, categoryModels]) => {
            if (categoryModels.length === 0) return;

            // Add category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'model-category-header';
            categoryHeader.innerHTML = `
                <div style="padding: var(--space-2) var(--space-3); font-size: var(--text-xs); font-weight: 600; color: var(--theme-text-muted); text-transform: uppercase; letter-spacing: 0.05em; background: var(--theme-border-light);">
                    ${category} Models
                </div>
            `;
            this.modelDropdown.appendChild(categoryHeader);

            // Add models in this category
            categoryModels.forEach(model => {
                const option = document.createElement('div');
                option.className = `model-option ${model.id === currentModelId ? 'active' : ''}`;
                option.dataset.modelId = model.id;

                const speedColor = {
                    'Ultra Fast': '#10b981',
                    'Very Fast': '#059669',
                    'Fast': '#f59e0b',
                    'Medium': '#f97316',
                    'Slow': '#ef4444'
                }[model.speed] || '#6b7280';

                option.innerHTML = `
                    <div class="model-option-header">
                        <div class="model-option-name">${model.name}</div>
                        <div class="model-option-size" style="background: ${speedColor}; color: white;">${model.size}</div>
                    </div>
                    <div class="model-option-description">${model.description}</div>
                `;

                this.modelDropdown.appendChild(option);
            });
        });
    }

    setupModelSelectorEvents() {
        // Toggle dropdown
        this.currentModelDisplay.addEventListener('click', () => {
            const isVisible = this.modelDropdown.style.display !== 'none';
            this.modelDropdown.style.display = isVisible ? 'none' : 'block';
            this.modelDropdownBtn.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        // Model selection
        this.modelDropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.model-option');
            if (!option) return;

            const modelId = option.dataset.modelId;
            if (modelId) {
                // Update active state
                this.modelDropdown.querySelectorAll('.model-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');

                // Set new model (async)
                const model = this.aiService.getAvailableModels()[modelId];
                this.aiService.setModel(modelId);
                this.updateCurrentModelDisplay();

                // Hide dropdown
                this.modelDropdown.style.display = 'none';
                this.modelDropdownBtn.style.transform = 'rotate(0deg)';

                // Show toast notification
                this.themeManager.showToast(`Switching to ${model.name}...`, 'info', '🤖');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.model-selector')) {
                this.modelDropdown.style.display = 'none';
                this.modelDropdownBtn.style.transform = 'rotate(0deg)';
            }
        });
    }

    // Template dropdown methods
    initializeTemplateDropdown() {
        this.updateTemplateDropdown();
        this.updateTemplateCount();
    }

    updateTemplateDropdown() {
        if (!this.newEntryDropdown) return;

        const templates = this.templateManager.getAvailableTemplates();
        
        this.newEntryDropdown.innerHTML = templates.map(template => `
            <div class="template-option" data-template-id="${template.id}" role="menuitem" tabindex="0">
                <span class="template-option-icon">${template.icon}</span>
                <span class="template-option-label">${template.name}</span>
            </div>
        `).join('');

        // Add click handlers to options
        this.newEntryDropdown.querySelectorAll('.template-option').forEach(option => {
            option.addEventListener('click', () => {
                const templateId = option.dataset.templateId;
                this.templateManager.createEntryFromTemplate(templateId);
                this.closeTemplateDropdown();
            });
        });

        // Add keyboard navigation
        this.setupDropdownKeyboardNav();
    }

    setupDropdownKeyboardNav() {
        if (!this.newEntryDropdown) return;

        this.newEntryDropdown.addEventListener('keydown', (e) => {
            const options = Array.from(this.newEntryDropdown.querySelectorAll('.template-option'));
            const currentIndex = options.findIndex(opt => opt === document.activeElement);

            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % options.length;
                    options[nextIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
                    options[prevIndex].focus();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (currentIndex >= 0) {
                        options[currentIndex].click();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeTemplateDropdown();
                    this.newBtn.focus();
                    break;
            }
        });
    }

    toggleTemplateDropdown(e) {
        e.stopPropagation();
        const isVisible = this.newEntryDropdown.style.display !== 'none';
        
        if (isVisible) {
            this.closeTemplateDropdown();
        } else {
            this.openTemplateDropdown();
        }
    }

    openTemplateDropdown() {
        this.updateTemplateDropdown();
        this.newEntryDropdown.style.display = 'block';
        this.templateDropdownBtn.setAttribute('aria-expanded', 'true');
        this.templateDropdownBtn.classList.add('open');
        
        // Focus first option
        setTimeout(() => {
            const firstOption = this.newEntryDropdown.querySelector('.template-option');
            if (firstOption) {
                firstOption.focus();
            }
        }, 10);
    }

    closeTemplateDropdown() {
        if (this.newEntryDropdown) {
            this.newEntryDropdown.style.display = 'none';
            this.templateDropdownBtn.setAttribute('aria-expanded', 'false');
            this.templateDropdownBtn.classList.remove('open');
        }
    }

    createBlankEntry() {
        this.textarea.value = '';
        this.currentEntryId = null;
        this.isTemplateContent = false;
        this.templateContentOriginal = null;
        this.updateWordCount();
        this.textarea.focus();
        
        // Track new entry creation (no content tracked)
        this.analytics.trackFeatureUse('new_entry', 'created');
    }

    updateTemplateCount() {
        const count = this.templateManager.getTemplateEntries().length;
        
        if (this.templateCount) {
            this.templateCount.textContent = count;
        }
        
        if (this.templateCountText) {
            this.templateCountText.textContent = `${count} of 5 slots used`;
        }
        
        this.updateTemplateManagementList();
    }

    updateTemplateManagementList() {
        if (!this.templateListContainer) return;

        const customTemplates = this.templateManager.getTemplateEntries()
            .sort((a, b) => a.templateOrder - b.templateOrder);
        
        const availableTemplates = this.templateManager.getAvailableTemplates();
        const defaultTemplates = availableTemplates.filter(t => !t.isCustom);

        let html = '';

        if (customTemplates.length > 0) {
            html += '<div class="template-list-section"><div class="template-list-header">Custom Templates:</div><div class="template-list">';
            customTemplates.forEach(entry => {
                const name = entry.title || this.truncateText(entry.content, 30);
                html += `
                    <div class="template-list-item clickable" data-template-id="${entry.id}" title="Click to create new entry from this template">
                        <span class="template-list-name">📌 ${name}</span>
                        <button class="template-remove-btn" data-entry-id="${entry.id}" title="Remove template">×</button>
                    </div>
                `;
            });
            html += '</div></div>';
        }

        if (defaultTemplates.length > 0) {
            html += '<div class="template-list-section"><div class="template-list-header">Default Templates:</div><div class="template-list">';
            defaultTemplates.forEach(template => {
                html += `
                    <div class="template-list-item clickable" data-template-id="${template.id}" title="Click to create new entry from this template">
                        <span class="template-list-name">${template.icon} ${template.name}</span>
                    </div>
                `;
            });
            html += '</div></div>';
        }

        this.templateListContainer.innerHTML = html;

        // Add click handlers to template items
        this.templateListContainer.querySelectorAll('.template-list-item.clickable').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking the remove button
                if (e.target.classList.contains('template-remove-btn')) {
                    return;
                }
                const templateId = item.dataset.templateId;
                this.templateManager.createEntryFromTemplate(templateId);
            });
        });

        // Add event listeners to remove buttons
        this.templateListContainer.querySelectorAll('.template-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the item click
                const entryId = btn.dataset.entryId;
                this.templateManager.unmarkAsTemplate(entryId);
                this.updateTemplateCount();
                this.updateTemplateDropdown();
            });
        });
    }

    switchFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        this.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        
        // Re-render entries with filter
        this.renderEntries();
    }

    toggleEntryTemplate(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        if (entry.isTemplate) {
            // Unmark as template
            this.templateManager.unmarkAsTemplate(entryId);
        } else {
            // Mark as template
            this.templateManager.markAsTemplate(entryId);
        }

        // Update template count and dropdown
        this.updateTemplateCount();
        this.updateTemplateDropdown();
    }
}


// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.journal = new SimpleJournal();

    // Add debugging function to window for manual testing
    window.testSidebar = function () {
        console.log('=== SIDEBAR DEBUG TEST ===');
        console.log('Journal app:', window.journal);
        console.log('SidebarManager:', window.journal?.sidebarManager);
        console.log('Left toggle:', document.getElementById('leftToggle'));
        console.log('Right toggle:', document.getElementById('rightToggle'));
        console.log('Body classes:', document.body.className);

        // Try to manually toggle
        if (window.journal?.sidebarManager) {
            console.log('Attempting to open left sidebar...');
            window.journal.sidebarManager.openSidebar('left');
        } else {
            console.log('SidebarManager not available!');
        }
    };
});