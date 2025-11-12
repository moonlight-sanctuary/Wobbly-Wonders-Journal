// Centralized Testing Framework for Journal App
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.isRunning = false;
    }

    // Add a test case
    addTest(name, testFunction, category = 'general') {
        this.tests.push({
            name,
            testFunction,
            category,
            id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
    }

    // Run all tests
    async runAllTests() {
        if (this.isRunning) {
            console.warn('Tests are already running');
            return;
        }

        this.isRunning = true;
        this.results = [];
        
        console.log('🧪 Starting automated test suite...');
        
        for (const test of this.tests) {
            await this.runSingleTest(test);
        }
        
        this.displayResults();
        this.isRunning = false;
        
        return this.getTestSummary();
    }

    // Run a single test
    async runSingleTest(test) {
        try {
            const startTime = performance.now();
            const result = await test.testFunction();
            const endTime = performance.now();
            
            this.results.push({
                ...test,
                passed: result.passed,
                message: result.message,
                duration: endTime - startTime,
                error: null
            });
            
            console.log(`${result.passed ? '✅' : '❌'} ${test.name}: ${result.message}`);
        } catch (error) {
            this.results.push({
                ...test,
                passed: false,
                message: 'Test threw an error',
                duration: 0,
                error: error.message
            });
            
            console.error(`❌ ${test.name}: Error - ${error.message}`);
        }
    }

    // Display test results
    displayResults() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const failed = total - passed;
        
        console.log('\n📊 Test Results Summary:');
        console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`  - ${result.name}: ${result.message}`);
                if (result.error) {
                    console.log(`    Error: ${result.error}`);
                }
            });
        }
        
        // Show results in UI if test panel exists
        this.updateTestUI();
    }

    // Update test UI panel
    updateTestUI() {
        const testPanel = document.getElementById('testPanel');
        if (!testPanel) return;

        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        testPanel.innerHTML = `
            <div class="test-summary">
                <h4>Test Results</h4>
                <div class="test-stats">
                    <span class="stat passed">${passed} Passed</span>
                    <span class="stat failed">${total - passed} Failed</span>
                    <span class="stat total">${total} Total</span>
                </div>
            </div>
            <div class="test-details">
                ${this.results.map(result => `
                    <div class="test-result ${result.passed ? 'pass' : 'fail'}">
                        <span class="test-name">${result.name}</span>
                        <span class="test-message">${result.message}</span>
                        <span class="test-duration">${result.duration.toFixed(2)}ms</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Get test summary
    getTestSummary() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        return {
            total,
            passed,
            failed: total - passed,
            passRate: total > 0 ? (passed / total * 100).toFixed(1) : 0,
            results: this.results
        };
    }

    // Helper method to wait for element
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // Helper method to simulate user interaction
    simulateClick(element) {
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }

    // Helper method to simulate keyboard input
    simulateKeyboard(element, key, modifiers = {}) {
        const event = new KeyboardEvent('keydown', {
            key,
            ctrlKey: modifiers.ctrl || false,
            metaKey: modifiers.meta || false,
            shiftKey: modifiers.shift || false,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }

    // Helper method to wait for condition
    waitForCondition(condition, timeout = 5000, interval = 100) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (condition()) {
                    resolve(true);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    reject(new Error('Condition not met within timeout'));
                    return;
                }
                
                setTimeout(check, interval);
            };
            
            check();
        });
    }
}

// Initialize global test framework
window.testFramework = new TestFramework();

// Define core app tests
function setupCoreTests() {
    const tf = window.testFramework;

    // App Initialization Tests
    tf.addTest('App Loads Successfully', async () => {
        const app = window.journal;
        return {
            passed: app !== undefined && app.entries !== undefined,
            message: app ? 'App initialized correctly' : 'App failed to initialize'
        };
    }, 'initialization');

    tf.addTest('DOM Elements Present', async () => {
        const requiredElements = [
            '#journalEntry',
            '#wordCount',
            '#leftToggle',
            '#rightToggle',
            '#entryList',
            '#searchInput'
        ];
        
        const missingElements = requiredElements.filter(selector => !document.querySelector(selector));
        
        return {
            passed: missingElements.length === 0,
            message: missingElements.length === 0 ? 'All required elements present' : `Missing elements: ${missingElements.join(', ')}`
        };
    }, 'initialization');

    // Sidebar Tests
    tf.addTest('Sidebar Manager Initialized', async () => {
        const app = window.journal;
        return {
            passed: app.sidebarManager !== null && app.sidebarManager !== undefined,
            message: app.sidebarManager ? 'SidebarManager initialized' : 'SidebarManager not initialized'
        };
    }, 'sidebar');

    tf.addTest('Left Sidebar Toggle', async () => {
        const app = window.journal;
        const leftToggle = document.getElementById('leftToggle');
        
        // Ensure no sidebar is open initially
        app.sidebarManager.closeSidebar('left');
        app.sidebarManager.closeSidebar('right');
        
        // Click left toggle
        tf.simulateClick(leftToggle);
        
        return {
            passed: app.sidebarManager.isSidebarOpen('left'),
            message: app.sidebarManager.isSidebarOpen('left') ? 'Left sidebar opened' : 'Left sidebar failed to open'
        };
    }, 'sidebar');

    tf.addTest('Right Sidebar Toggle', async () => {
        const app = window.journal;
        const rightToggle = document.getElementById('rightToggle');
        
        // Ensure no sidebar is open initially
        app.sidebarManager.closeSidebar('left');
        app.sidebarManager.closeSidebar('right');
        
        // Click right toggle
        tf.simulateClick(rightToggle);
        
        return {
            passed: app.sidebarManager.isSidebarOpen('right'),
            message: app.sidebarManager.isSidebarOpen('right') ? 'Right sidebar opened' : 'Right sidebar failed to open'
        };
    }, 'sidebar');

    tf.addTest('Sidebar Mutual Exclusivity', async () => {
        const app = window.journal;
        const leftToggle = document.getElementById('leftToggle');
        const rightToggle = document.getElementById('rightToggle');
        
        // Open left sidebar
        tf.simulateClick(leftToggle);
        const leftOpen = app.sidebarManager.isSidebarOpen('left');
        
        // Open right sidebar (should close left)
        tf.simulateClick(rightToggle);
        const rightOpen = app.sidebarManager.isSidebarOpen('right');
        const leftClosed = !app.sidebarManager.isSidebarOpen('left');
        
        return {
            passed: leftOpen && rightOpen && leftClosed,
            message: (leftOpen && rightOpen && leftClosed) ? 'Mutual exclusivity working' : 'Mutual exclusivity failed'
        };
    }, 'sidebar');

    // Writing Tests
    tf.addTest('Textarea Input', async () => {
        const textarea = document.getElementById('journalEntry');
        const testText = 'Test entry content';
        
        textarea.value = testText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        return {
            passed: textarea.value === testText,
            message: textarea.value === testText ? 'Textarea input working' : 'Textarea input failed'
        };
    }, 'writing');

    tf.addTest('Word Count Update', async () => {
        const textarea = document.getElementById('journalEntry');
        const wordCount = document.getElementById('wordCount');
        const testText = 'one two three four five';
        
        textarea.value = testText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Wait for word count to update
        await tf.waitForCondition(() => wordCount.textContent.includes('5'), 1000);
        
        return {
            passed: wordCount.textContent.includes('5'),
            message: wordCount.textContent.includes('5') ? 'Word count updated correctly' : `Word count incorrect: ${wordCount.textContent}`
        };
    }, 'writing');

    // Search Tests
    tf.addTest('Search Input Present', async () => {
        const searchInput = document.getElementById('searchInput');
        return {
            passed: searchInput !== null,
            message: searchInput ? 'Search input present' : 'Search input missing'
        };
    }, 'search');

    // Keyboard Shortcut Tests
    tf.addTest('Keyboard Shortcut Left Sidebar', async () => {
        const app = window.journal;
        
        // Ensure no sidebar is open
        app.sidebarManager.closeSidebar('left');
        app.sidebarManager.closeSidebar('right');
        
        // Simulate Cmd+[
        tf.simulateKeyboard(document, '[', { meta: true });
        
        return {
            passed: app.sidebarManager.isSidebarOpen('left'),
            message: app.sidebarManager.isSidebarOpen('left') ? 'Left sidebar keyboard shortcut working' : 'Left sidebar keyboard shortcut failed'
        };
    }, 'keyboard');

    tf.addTest('Keyboard Shortcut Right Sidebar', async () => {
        const app = window.journal;
        
        // Ensure no sidebar is open
        app.sidebarManager.closeSidebar('left');
        app.sidebarManager.closeSidebar('right');
        
        // Simulate Cmd+]
        tf.simulateKeyboard(document, ']', { meta: true });
        
        return {
            passed: app.sidebarManager.isSidebarOpen('right'),
            message: app.sidebarManager.isSidebarOpen('right') ? 'Right sidebar keyboard shortcut working' : 'Right sidebar keyboard shortcut failed'
        };
    }, 'keyboard');

    // Welcome Screen Tests
    // Welcome screen tests removed - feature no longer exists

    // Welcome screen reappear test removed - feature no longer exists

    tf.addTest('Sidebar Toggle Functionality', async () => {
        const app = window.journal;
        const leftToggle = document.getElementById('leftToggle');
        
        // Test left sidebar toggle
        tf.simulateClick(leftToggle);
        const sidebarOpened = app.sidebarManager.isSidebarOpen('left');
        
        // Close sidebar
        tf.simulateClick(leftToggle);
        const sidebarClosed = !app.sidebarManager.isSidebarOpen('left');
        
        return {
            passed: sidebarOpened && sidebarClosed,
            message: `Sidebar toggle - Open: ${sidebarOpened ? 'PASS' : 'FAIL'}, Close: ${sidebarClosed ? 'PASS' : 'FAIL'}`
        };
    }, 'sidebar');

    // Floating New Entry Button Tests
    tf.addTest('Floating New Entry Button Present', async () => {
        const floatingBtn = document.getElementById('floatingNewBtn');
        return {
            passed: floatingBtn !== null,
            message: floatingBtn ? 'Floating new entry button present' : 'Floating new entry button missing'
        };
    }, 'floating-button');

    tf.addTest('Floating Button Creates New Entry', async () => {
        const app = window.journal;
        const floatingBtn = document.getElementById('floatingNewBtn');
        const textarea = document.getElementById('journalEntry');
        
        // Add some content first
        textarea.value = 'existing content';
        
        // Click floating button
        tf.simulateClick(floatingBtn);
        
        const isCleared = textarea.value === '';
        const isFocused = document.activeElement === textarea;
        
        return {
            passed: isCleared && isFocused,
            message: (isCleared && isFocused) ? 'Floating button creates new entry correctly' : 'Floating button failed to create new entry'
        };
    }, 'floating-button');

    tf.addTest('Floating Button Visible Across Interface States', async () => {
        const app = window.journal;
        const floatingBtn = document.getElementById('floatingNewBtn');
        
        // Test with no sidebars open
        app.sidebarManager.closeSidebar('left');
        app.sidebarManager.closeSidebar('right');
        const visibleNoSidebars = window.getComputedStyle(floatingBtn).display !== 'none';
        
        // Test with left sidebar open
        app.sidebarManager.openSidebar('left');
        const visibleLeftOpen = window.getComputedStyle(floatingBtn).display !== 'none';
        
        // Test with right sidebar open
        app.sidebarManager.openSidebar('right');
        const visibleRightOpen = window.getComputedStyle(floatingBtn).display !== 'none';
        
        const allVisible = visibleNoSidebars && visibleLeftOpen && visibleRightOpen;
        
        return {
            passed: allVisible,
            message: allVisible ? 'Floating button visible across all interface states' : 'Floating button visibility issues detected'
        };
    }, 'floating-button');

    // AI Service Tests
    tf.addTest('AI Service Initialized', async () => {
        const app = window.journal;
        return {
            passed: app.aiService !== null && app.aiService !== undefined,
            message: app.aiService ? 'AI service initialized' : 'AI service not initialized'
        };
    }, 'ai');

    tf.addTest('AI Chat Interface Present', async () => {
        const chatInterface = document.getElementById('aiChatInterface');
        const chatBtn = document.getElementById('aiChatBtn');
        return {
            passed: chatInterface !== null && chatBtn !== null,
            message: (chatInterface && chatBtn) ? 'AI chat interface elements present' : 'AI chat interface elements missing'
        };
    }, 'ai');

    tf.addTest('AI Status Updates', async () => {
        const app = window.journal;
        const statusElement = document.getElementById('aiStatus');
        
        // Test status update
        app.updateAIStatus('checking');
        const hasCheckingClass = statusElement.classList.contains('checking');
        
        return {
            passed: hasCheckingClass,
            message: hasCheckingClass ? 'AI status updates correctly' : 'AI status update failed'
        };
    }, 'ai');

    // Entry Management Tests
    tf.addTest('Entry Delete Buttons Present', async () => {
        const app = window.journal;
        
        // Add a test entry first
        const testEntry = {
            id: 'test-entry-123',
            content: 'Test entry for deletion',
            date: new Date().toISOString(),
            wordCount: 4
        };
        app.entries.unshift(testEntry);
        app.renderEntries();
        
        const deleteBtn = document.querySelector('.entry-delete-btn');
        
        return {
            passed: deleteBtn !== null,
            message: deleteBtn ? 'Entry delete buttons present' : 'Entry delete buttons missing'
        };
    }, 'entry-management');

    tf.addTest('Test Panel Integration', async () => {
        const testToggleBtn = document.getElementById('testToggleBtn');
        const testPanel = document.getElementById('testPanel');
        
        return {
            passed: testToggleBtn !== null && testPanel !== null,
            message: (testToggleBtn && testPanel) ? 'Test panel integrated in sidebar' : 'Test panel integration failed'
        };
    }, 'testing');

    // Enhanced AI Functionality Tests
    tf.addTest('AI Smart Context Creation', async () => {
        const app = window.journal;
        
        // Create test entries
        const testEntries = [
            { id: '1', content: 'Today I worked on a project about machine learning', date: new Date().toISOString(), wordCount: 10 },
            { id: '2', content: 'Had a great day at the beach with friends', date: new Date(Date.now() - 86400000).toISOString(), wordCount: 9 },
            { id: '3', content: 'Working on machine learning algorithms again', date: new Date(Date.now() - 172800000).toISOString(), wordCount: 8 }
        ];
        
        const context = app.aiService.createSmartContext('machine learning', testEntries);
        const hasRelevantSection = context.includes('MOST RELEVANT ENTRIES');
        const hasAllEntries = context.includes('COMPLETE JOURNAL HISTORY');
        
        return {
            passed: hasRelevantSection && hasAllEntries,
            message: (hasRelevantSection && hasAllEntries) ? 'Smart context creation working' : 'Smart context creation failed'
        };
    }, 'ai-enhanced');

    tf.addTest('AI Entry Relevance Detection', async () => {
        const app = window.journal;
        
        const relevant = app.aiService.isEntryRelevant('machine learning', 'today i worked on machine learning algorithms');
        const notRelevant = app.aiService.isEntryRelevant('machine learning', 'went to the store and bought groceries');
        
        return {
            passed: relevant && !notRelevant,
            message: (relevant && !notRelevant) ? 'Entry relevance detection working' : 'Entry relevance detection failed'
        };
    }, 'ai-enhanced');

    tf.addTest('AI Theme Extraction', async () => {
        const app = window.journal;
        
        const testEntries = [
            { content: 'work project deadline stress pressure' },
            { content: 'work meeting project planning' },
            { content: 'project completion work satisfaction' }
        ];
        
        const themes = app.aiService.extractThemes(testEntries);
        const hasWorkTheme = themes.includes('work') || themes.includes('project');
        
        return {
            passed: themes.length > 0 && hasWorkTheme,
            message: hasWorkTheme ? 'Theme extraction working' : `Theme extraction failed: ${themes.join(', ')}`
        };
    }, 'ai-enhanced');

    // Entry Summary Tests Removed - No longer using summarization functionality

    // Entry title generation and summary tests removed - no longer using these features

    // Comprehensive AI Chat Tests
    tf.addTest('AI Chat Toggle Functionality', async () => {
        const app = window.journal;
        const chatInterface = document.getElementById('aiChatInterface');
        
        // Test open
        app.openAIChat();
        const isOpen = chatInterface.style.display !== 'none';
        
        // Test close
        app.closeAIChat();
        const isClosed = chatInterface.style.display === 'none';
        
        return {
            passed: isOpen && isClosed,
            message: (isOpen && isClosed) ? 'AI chat toggle working' : 'AI chat toggle failed'
        };
    }, 'ai-chat');

    tf.addTest('AI Chat Message Addition', async () => {
        const app = window.journal;
        const chatMessages = document.getElementById('chatMessages');
        
        // Clear any existing messages
        chatMessages.innerHTML = '';
        
        // Add test message
        const messageId = app.addChatMessage('user', 'Test message');
        const messageElement = document.getElementById(messageId);
        
        return {
            passed: messageElement !== null && messageElement.textContent.includes('Test message'),
            message: messageElement ? 'Chat message addition working' : 'Chat message addition failed'
        };
    }, 'ai-chat');

    tf.addTest('AI Status Monitoring', async () => {
        const app = window.journal;
        const statusElement = document.getElementById('aiStatus');
        
        // Test different status updates
        app.updateAIStatus('connected');
        const hasConnected = statusElement.classList.contains('connected');
        
        app.updateAIStatus('checking');
        const hasChecking = statusElement.classList.contains('checking');
        
        app.updateAIStatus('disconnected');
        const hasDisconnected = statusElement.classList.contains('disconnected');
        
        return {
            passed: hasConnected && hasChecking && hasDisconnected,
            message: (hasConnected && hasChecking && hasDisconnected) ? 'AI status monitoring working' : 'AI status monitoring failed'
        };
    }, 'ai-status');

    tf.addTest('AI Capabilities Display', async () => {
        const app = window.journal;
        const capabilities = document.getElementById('aiCapabilities');
        
        // Test show capabilities
        app.updateAIStatus('connected');
        const isVisible = capabilities.style.display !== 'none';
        
        // Test hide capabilities
        app.updateAIStatus('disconnected');
        const isHidden = capabilities.style.display === 'none';
        
        return {
            passed: isVisible && isHidden,
            message: (isVisible && isHidden) ? 'AI capabilities display working' : 'AI capabilities display failed'
        };
    }, 'ai-capabilities');

    // Welcome Screen Responsiveness Tests
    // Welcome screen tests removed - feature no longer exists

    // Entry Management Comprehensive Tests
    tf.addTest('Entry Data Structure Enhancement', async () => {
        const app = window.journal;
        
        // Create test entry
        app.textarea.value = 'Test entry content for data structure';
        app.saveCurrentEntry();
        
        const latestEntry = app.entries[0];
        const hasRequiredFields = latestEntry.hasOwnProperty('summary') && 
                                 latestEntry.hasOwnProperty('title') &&
                                 latestEntry.hasOwnProperty('id') &&
                                 latestEntry.hasOwnProperty('content') &&
                                 latestEntry.hasOwnProperty('date') &&
                                 latestEntry.hasOwnProperty('wordCount');
        
        return {
            passed: hasRequiredFields,
            message: hasRequiredFields ? 'Entry data structure enhanced correctly' : 'Entry data structure missing fields'
        };
    }, 'entry-management');

    tf.addTest('Entry Actions Hover Behavior', async () => {
        const app = window.journal;
        
        // Ensure we have an entry
        if (app.entries.length === 0) {
            const testEntry = {
                id: 'test-hover-123',
                content: 'Test entry for hover behavior',
                date: new Date().toISOString(),
                wordCount: 5,
                summary: null,
                title: null
            };
            app.entries.unshift(testEntry);
            app.renderEntries();
        }
        
        const entryItem = document.querySelector('.entry-item');
        const deleteBtn = entryItem?.querySelector('.entry-delete-btn');
        
        return {
            passed: entryItem && deleteBtn,
            message: (entryItem && deleteBtn) ? 'Entry action buttons present' : 'Entry action buttons missing'
        };
    }, 'entry-management');

    // Floating Button Tests
    tf.addTest('Floating Button Responsive Design', async () => {
        const floatingBtn = document.getElementById('floatingNewBtn');
        const btnText = floatingBtn?.querySelector('.floating-btn-text');
        
        // Check if button has proper styling classes
        const hasProperStyling = floatingBtn && 
                                window.getComputedStyle(floatingBtn).position === 'fixed' &&
                                window.getComputedStyle(floatingBtn).bottom !== 'auto';
        
        return {
            passed: hasProperStyling && btnText,
            message: (hasProperStyling && btnText) ? 'Floating button responsive design working' : 'Floating button responsive design failed'
        };
    }, 'floating-button');

    // Comprehensive Integration Tests
    tf.addTest('Complete App Integration', async () => {
        const app = window.journal;
        
        // Test that all major components are initialized
        const hasCore = app.entries !== undefined && app.sidebarManager !== null;
        const hasAI = app.aiService !== null;
        const hasElements = document.getElementById('journalEntry') && 
                           document.getElementById('leftToggle') && 
                           document.getElementById('rightToggle');
        
        return {
            passed: hasCore && hasAI && hasElements,
            message: (hasCore && hasAI && hasElements) ? 'Complete app integration working' : 'App integration issues detected'
        };
    }, 'integration');

    tf.addTest('AI Service Methods Available', async () => {
        const app = window.journal;
        const aiService = app.aiService;
        
        const hasRequiredMethods = typeof aiService.checkOllamaStatus === 'function' &&
                                  typeof aiService.chatWithEntries === 'function' &&
                                  typeof aiService.createSmartContext === 'function';
        
        return {
            passed: hasRequiredMethods,
            message: hasRequiredMethods ? 'All AI service methods available' : 'AI service methods missing'
        };
    }, 'ai-service');

    tf.addTest('Smart Context Creation Available', async () => {
        const app = window.journal;
        const aiService = app.aiService;
        
        const hasSmartMethods = typeof aiService.createSmartContext === 'function' &&
                               typeof aiService.isEntryRelevant === 'function' &&
                               typeof aiService.extractThemes === 'function' &&
                               typeof aiService.groupEntriesByMonth === 'function';
        
        return {
            passed: hasSmartMethods,
            message: hasSmartMethods ? 'Smart context creation methods available' : 'Smart context methods missing'
        };
    }, 'ai-enhanced');

    // Entry Summary UI Integration test removed - no longer using summarization

    // Entry-Specific Summary Persistence Tests Removed - No longer using summarization

    // Floating AI Chat Tests
    tf.addTest('Floating AI Chat Elements Present', async () => {
        const floatingChat = document.getElementById('floatingAIChat');
        const chatMessages = document.getElementById('chatMessages');
        const chatInput = document.getElementById('chatInput');
        const chatSendBtn = document.getElementById('chatSendBtn');
        const chatCloseBtn = document.getElementById('chatCloseBtn');
        
        return {
            passed: floatingChat && chatMessages && chatInput && chatSendBtn && chatCloseBtn,
            message: (floatingChat && chatMessages && chatInput && chatSendBtn && chatCloseBtn) ? 'Floating AI chat elements present' : 'Floating AI chat elements missing'
        };
    }, 'ai-chat');

    tf.addTest('AI Chat Toggle Functionality', async () => {
        const app = window.journal;
        const floatingChat = document.getElementById('floatingAIChat');
        
        // Test open
        app.openAIChat();
        const isOpen = floatingChat.style.display === 'flex';
        
        // Test close
        app.closeAIChat();
        const isClosed = floatingChat.style.display === 'none';
        
        return {
            passed: isOpen && isClosed,
            message: (isOpen && isClosed) ? 'AI chat toggle working' : 'AI chat toggle failed'
        };
    }, 'ai-chat');

    tf.addTest('Reflection Entry Creation', async () => {
        const app = window.journal;
        const createReflectionBtn = document.getElementById('createReflectionBtn');
        const chatActions = document.getElementById('chatActions');
        
        // Set up test scenario
        app.lastAIResponse = 'Test AI response for reflection';
        
        // Test reflection entry creation
        const initialEntryCount = app.entries.length;
        app.createReflectionEntry();
        const newEntryCount = app.entries.length;
        
        // Check if new entry was created and contains reflection prompt
        const hasNewEntry = newEntryCount > initialEntryCount;
        const textareaContent = app.textarea.value;
        const hasReflectionContent = textareaContent.includes('💭 Reflection on AI Insights:') && 
                                   textareaContent.includes('Test AI response for reflection');
        
        return {
            passed: createReflectionBtn && chatActions && hasNewEntry && hasReflectionContent,
            message: (createReflectionBtn && chatActions && hasNewEntry && hasReflectionContent) ? 
                    'Reflection entry creation working' : 'Reflection entry creation failed'
        };
    }, 'ai-chat');

    tf.addTest('AI Message Paragraph Formatting', async () => {
        const app = window.journal;
        
        // Test AI message with multiple paragraphs
        const testContent = 'First paragraph with some text.\n\nSecond paragraph with more text.\n\nThird paragraph for testing.';
        const messageId = app.addChatMessage('ai', testContent);
        
        // Check if message was created and contains proper paragraph formatting
        const messageElement = document.getElementById(messageId);
        const messageContent = messageElement.querySelector('.message-content');
        const hasParagraphs = messageContent.querySelectorAll('p').length === 3;
        const hasProperSpacing = messageContent.innerHTML.includes('<p>First paragraph') && 
                                messageContent.innerHTML.includes('<p>Second paragraph') &&
                                messageContent.innerHTML.includes('<p>Third paragraph');
        
        return {
            passed: messageElement && hasParagraphs && hasProperSpacing,
            message: (messageElement && hasParagraphs && hasProperSpacing) ? 
                    'AI message paragraph formatting working' : 'AI message paragraph formatting failed'
        };
    }, 'ai-chat');

    tf.addTest('Privacy-Safe Analytics Integration', async () => {
        const app = window.journal;
        const analytics = app.analytics;
        
        // Check if analytics is properly initialized
        const analyticsExists = analytics !== undefined;
        const hasTrackingMethods = typeof analytics.trackFeatureUse === 'function' &&
                                  typeof analytics.trackUIInteraction === 'function' &&
                                  typeof analytics.trackThemeChange === 'function' &&
                                  typeof analytics.trackAIStatus === 'function';
        
        // Test that gtag is available (or analytics is disabled gracefully)
        const gtagAvailable = typeof gtag !== 'undefined' || !analytics.enabled;
        
        return {
            passed: analyticsExists && hasTrackingMethods && gtagAvailable,
            message: (analyticsExists && hasTrackingMethods && gtagAvailable) ? 
                    'Privacy-safe analytics properly integrated' : 'Analytics integration failed'
        };
    }, 'privacy-analytics');

    tf.addTest('Analytics Content Privacy Protection', async () => {
        const app = window.journal;
        
        // Mock gtag to capture what data is being sent
        const originalGtag = window.gtag;
        const capturedEvents = [];
        
        window.gtag = function(...args) {
            capturedEvents.push(args);
        };
        
        // Test various user actions that should NOT leak content
        const testContent = 'SENSITIVE_JOURNAL_CONTENT_SHOULD_NOT_BE_TRACKED';
        const testChatMessage = 'PRIVATE_CHAT_MESSAGE_SHOULD_NOT_BE_TRACKED';
        
        // Simulate user writing in journal
        app.textarea.value = testContent;
        app.handleInput();
        
        // Simulate new entry creation
        app.newEntry();
        
        // Simulate AI chat interaction
        app.openAIChat();
        app.lastAIResponse = testChatMessage;
        app.createReflectionEntry();
        
        // Simulate theme change
        app.themeManager.setTheme('cool', 'dark');
        
        // Check that no captured events contain sensitive content
        const hasContentLeakage = capturedEvents.some(event => {
            const eventString = JSON.stringify(event);
            return eventString.includes(testContent) || 
                   eventString.includes(testChatMessage) ||
                   eventString.includes('SENSITIVE') ||
                   eventString.includes('PRIVATE');
        });
        
        // Restore original gtag
        window.gtag = originalGtag;
        
        return {
            passed: !hasContentLeakage && capturedEvents.length > 0,
            message: hasContentLeakage ? 
                    'CRITICAL: Content leakage detected in analytics!' : 
                    `Content privacy protected - ${capturedEvents.length} safe events tracked`
        };
    }, 'privacy-analytics');

    tf.addTest('Analytics Event Structure Validation', async () => {
        const app = window.journal;
        
        // Mock gtag to validate event structure
        const originalGtag = window.gtag;
        const capturedEvents = [];
        
        window.gtag = function(...args) {
            capturedEvents.push(args);
        };
        
        // Test each analytics method
        app.analytics.trackFeatureUse('test_feature', 'test_action');
        app.analytics.trackUIInteraction('test_element', 'click');
        app.analytics.trackThemeChange('warm', 'light');
        app.analytics.trackAIStatus('connected');
        
        // Validate event structure
        const validEvents = capturedEvents.filter(event => {
            if (event[0] !== 'event') return false;
            
            const eventData = event[2];
            if (!eventData) return false;
            
            // Check for required safe fields only
            const hasRequiredFields = eventData.event_category && 
                                     eventData.event_label !== undefined;
            
            // Check for forbidden fields that could leak content
            const hasForbiddenFields = eventData.content || 
                                      eventData.text || 
                                      eventData.message || 
                                      eventData.entry_content ||
                                      eventData.chat_message;
            
            return hasRequiredFields && !hasForbiddenFields;
        });
        
        // Restore original gtag
        window.gtag = originalGtag;
        
        return {
            passed: validEvents.length === capturedEvents.length && capturedEvents.length > 0,
            message: validEvents.length === capturedEvents.length ? 
                    `All ${capturedEvents.length} events have safe structure` : 
                    `${capturedEvents.length - validEvents.length} events have unsafe structure`
        };
    }, 'privacy-analytics');

    tf.addTest('Analytics Graceful Degradation', async () => {
        const app = window.journal;
        
        // Test analytics behavior when gtag is unavailable
        const originalGtag = window.gtag;
        delete window.gtag;
        
        // Create new analytics instance without gtag
        const testAnalytics = new PrivacyAnalytics();
        
        // Test that methods don't throw errors
        let errorsThrown = 0;
        try {
            testAnalytics.trackFeatureUse('test_feature');
            testAnalytics.trackUIInteraction('test_element');
            testAnalytics.trackThemeChange('warm', 'light');
            testAnalytics.trackAIStatus('connected');
        } catch (error) {
            errorsThrown++;
        }
        
        // Restore gtag
        window.gtag = originalGtag;
        
        return {
            passed: errorsThrown === 0 && !testAnalytics.enabled,
            message: errorsThrown === 0 ? 
                    'Analytics gracefully handles missing gtag' : 
                    `${errorsThrown} errors thrown when gtag unavailable`
        };
    }, 'privacy-analytics');

    tf.addTest('Analytics Never Accesses Sensitive Data Sources', async () => {
        const app = window.journal;
        
        // Mock gtag to capture all data being sent
        const originalGtag = window.gtag;
        const capturedData = [];
        
        window.gtag = function(...args) {
            // Capture all arguments and stringify to check for sensitive data
            capturedData.push(JSON.stringify(args));
        };
        
        // Add sensitive data to various sources
        const sensitiveContent = 'TOP_SECRET_JOURNAL_ENTRY_CONTENT';
        const sensitiveChat = 'PRIVATE_AI_CONVERSATION_DATA';
        
        // Populate localStorage with sensitive data
        localStorage.setItem('journalEntries', JSON.stringify([{
            id: 'test',
            content: sensitiveContent,
            date: new Date().toISOString()
        }]));
        
        // Populate textarea with sensitive data
        app.textarea.value = sensitiveContent;
        
        // Populate chat with sensitive data
        app.lastAIResponse = sensitiveChat;
        
        // Trigger various analytics events
        app.analytics.trackFeatureUse('journal_write', 'started');
        app.analytics.trackUIInteraction('textarea', 'focus');
        app.analytics.trackFeatureUse('ai_chat', 'opened');
        app.analytics.trackFeatureUse('reflection_entry', 'created');
        
        // Check that no sensitive data was transmitted
        const allCapturedData = capturedData.join(' ');
        const hasSensitiveData = allCapturedData.includes(sensitiveContent) ||
                                allCapturedData.includes(sensitiveChat) ||
                                allCapturedData.includes('TOP_SECRET') ||
                                allCapturedData.includes('PRIVATE_AI');
        
        // Clean up
        localStorage.removeItem('journalEntries');
        app.textarea.value = '';
        app.lastAIResponse = null;
        window.gtag = originalGtag;
        
        return {
            passed: !hasSensitiveData && capturedData.length > 0,
            message: hasSensitiveData ? 
                    'CRITICAL: Analytics accessed sensitive data sources!' : 
                    `Privacy protected - ${capturedData.length} events sent without sensitive data`
        };
    }, 'privacy-analytics');

    tf.addTest('Analytics Configuration Privacy Settings', async () => {
        // This test validates that Google Analytics is configured with privacy-first settings
        // We can't directly test the gtag config, but we can verify our implementation
        
        const app = window.journal;
        const analytics = app.analytics;
        
        // Check that analytics class has privacy-conscious design
        const hasPrivacyMethods = typeof analytics.trackFeatureUse === 'function' &&
                                 typeof analytics.trackUIInteraction === 'function';
        
        // Verify analytics doesn't store references to sensitive data
        const hasNoSensitiveRefs = !analytics.hasOwnProperty('entries') &&
                                  !analytics.hasOwnProperty('textarea') &&
                                  !analytics.hasOwnProperty('chatMessages') &&
                                  !analytics.hasOwnProperty('localStorage');
        
        // Check that analytics methods don't accept content parameters
        let contentParameterFound = false;
        try {
            // These should work (safe parameters)
            analytics.trackFeatureUse('test');
            analytics.trackUIInteraction('button');
            
            // The methods should not have parameters for content
            const trackFeatureUseStr = analytics.trackFeatureUse.toString();
            const trackUIInteractionStr = analytics.trackUIInteraction.toString();
            
            // Look for any content-related parameters in method signatures
            contentParameterFound = trackFeatureUseStr.includes('content') ||
                                   trackFeatureUseStr.includes('text') ||
                                   trackUIInteractionStr.includes('content') ||
                                   trackUIInteractionStr.includes('text');
        } catch (error) {
            // Methods should not throw errors with safe parameters
        }
        
        return {
            passed: hasPrivacyMethods && hasNoSensitiveRefs && !contentParameterFound,
            message: (hasPrivacyMethods && hasNoSensitiveRefs && !contentParameterFound) ? 
                    'Analytics class designed with privacy-first principles' : 
                    'Analytics class may have privacy vulnerabilities'
        };
    }, 'privacy-analytics');

    tf.addTest('Mobile Responsiveness Check', async () => {
        const welcomeContent = document.querySelector('.welcome-content');
        const floatingBtn = document.getElementById('floatingNewBtn');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        
        // Check if elements have responsive CSS classes/properties
        const welcomeResponsive = welcomeContent && window.getComputedStyle(welcomeContent).maxWidth !== 'none';
        const btnResponsive = floatingBtn && window.getComputedStyle(floatingBtn).position === 'fixed';
        const toggleResponsive = sidebarToggle && window.getComputedStyle(sidebarToggle).position === 'fixed';
        
        return {
            passed: welcomeResponsive && btnResponsive && toggleResponsive,
            message: (welcomeResponsive && btnResponsive && toggleResponsive) ? 'Mobile responsiveness implemented' : 'Mobile responsiveness issues detected'
        };
    }, 'responsive');
}

// Auto-setup tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(setupCoreTests, 1000); // Wait for app to initialize
    });
} else {
    setTimeout(setupCoreTests, 1000);
}
// === COMPREHENSIVE FEATURE TESTS =====

// Theme System Tests
tf.addTest(() => {
    const app = window.journal;
    const themeManager = app.themeManager;
    
    // Test theme switching
    const originalTheme = themeManager.currentTheme;
    themeManager.setTheme('cool');
    const themeChanged = themeManager.currentTheme === 'cool';
    
    // Test mode switching
    const originalMode = themeManager.currentMode;
    themeManager.toggleMode();
    const modeChanged = themeManager.currentMode !== originalMode;
    
    // Restore original settings
    themeManager.setTheme(originalTheme);
    if (modeChanged) themeManager.toggleMode();
    
    return {
        passed: themeChanged && modeChanged,
        message: `Theme switching: ${themeChanged ? 'PASS' : 'FAIL'}, Mode switching: ${modeChanged ? 'PASS' : 'FAIL'}`
    };
}, 'theming');

tf.addTest(() => {
    const app = window.journal;
    const themeManager = app.themeManager;
    
    // Test theme persistence
    const testTheme = 'minimal';
    const testMode = 'dark';
    
    themeManager.setTheme(testTheme, testMode);
    
    // Check localStorage
    const saved = localStorage.getItem('themePreferences');
    const preferences = saved ? JSON.parse(saved) : null;
    
    const persistenceWorks = preferences && 
                           preferences.theme === testTheme && 
                           preferences.mode === testMode;
    
    return {
        passed: persistenceWorks,
        message: persistenceWorks ? 'Theme persistence working' : 'Theme persistence failed'
    };
}, 'theming');

// AI Model Selection Tests
tf.addTest(() => {
    const app = window.journal;
    const aiService = app.aiService;
    
    // Test model switching
    const originalModel = aiService.model;
    const availableModels = Object.keys(aiService.getAvailableModels());
    const testModel = availableModels.find(m => m !== originalModel);
    
    if (!testModel) {
        return {
            passed: true,
            message: 'Only one model available, skipping model switching test'
        };
    }
    
    aiService.setModel(testModel);
    const modelChanged = aiService.model === testModel;
    
    // Restore original model
    aiService.setModel(originalModel);
    
    return {
        passed: modelChanged,
        message: modelChanged ? 'AI model switching working' : 'AI model switching failed'
    };
}, 'ai');

tf.addTest(() => {
    const app = window.journal;
    const aiService = app.aiService;
    
    // Test model categories
    const models = aiService.getAvailableModels();
    const hasLatest = Object.values(models).some(m => m.category === 'Latest');
    const hasThinking = Object.values(models).some(m => m.category === 'Thinking');
    const hasReliable = Object.values(models).some(m => m.category === 'Reliable');
    
    return {
        passed: hasLatest && hasThinking && hasReliable,
        message: `Model categories - Latest: ${hasLatest}, Thinking: ${hasThinking}, Reliable: ${hasReliable}`
    };
}, 'ai');

// Autosave and Timestamp Tests
tf.addTest(() => {
    const app = window.journal;
    const textarea = document.getElementById('journalEntry');
    const autosaveStatus = document.getElementById('autosaveStatus');
    const lastSavedTime = document.getElementById('lastSavedTime');
    
    // Clear textarea and add test content
    textarea.value = '';
    app.currentEntryId = null;
    
    const testContent = 'Test autosave functionality';
    textarea.value = testContent;
    
    // Trigger autosave
    app.autoSave();
    
    // Wait for autosave to complete
    return new Promise((resolve) => {
        setTimeout(() => {
            const statusShowing = autosaveStatus && autosaveStatus.textContent.includes('Saved');
            const timeShowing = lastSavedTime && lastSavedTime.textContent.length > 0;
            
            resolve({
                passed: statusShowing && timeShowing,
                message: `Autosave status: ${statusShowing ? 'PASS' : 'FAIL'}, Time display: ${timeShowing ? 'PASS' : 'FAIL'}`
            });
        }, 1500);
    });
}, 'autosave');

tf.addTest(() => {
    const app = window.journal;
    
    // Test continuous time updates
    const mockTimestamp = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    app.lastSavedTimestamp = mockTimestamp;
    app.updateSavedTimeDisplay();
    
    const timeText = document.getElementById('lastSavedTime').textContent;
    const showsMinutesAgo = timeText.includes('min ago');
    
    return {
        passed: showsMinutesAgo,
        message: showsMinutesAgo ? 'Continuous time updates working' : 'Time updates not working'
    };
}, 'autosave');

// Date Grouping Tests
tf.addTest(() => {
    const app = window.journal;
    
    // Create test entries with different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const testEntries = [
        { id: 'test1', content: 'Today entry', date: today.toISOString() },
        { id: 'test2', content: 'Yesterday entry', date: yesterday.toISOString() },
        { id: 'test3', content: 'Last week entry', date: lastWeek.toISOString() }
    ];
    
    const grouped = app.groupEntriesByDate(testEntries);
    const hasToday = grouped.hasOwnProperty('Today');
    const hasYesterday = grouped.hasOwnProperty('Yesterday');
    const hasOtherDate = Object.keys(grouped).some(key => key !== 'Today' && key !== 'Yesterday');
    
    return {
        passed: hasToday && hasYesterday && hasOtherDate,
        message: `Date grouping - Today: ${hasToday}, Yesterday: ${hasYesterday}, Other: ${hasOtherDate}`
    };
}, 'entries');

// Toast Notification Tests
tf.addTest(() => {
    const app = window.journal;
    const themeManager = app.themeManager;
    
    // Test toast creation
    themeManager.showToast('Test message', 'success', '✅');
    
    // Check if toast container exists and has toast
    const toastContainer = document.querySelector('.toast-container');
    const hasToast = toastContainer && toastContainer.children.length > 0;
    
    return {
        passed: hasToast,
        message: hasToast ? 'Toast notifications working' : 'Toast notifications failed'
    };
}, 'ui');

// Floating Button Responsive Tests
tf.addTest(() => {
    const app = window.journal;
    const floatingBtn = document.getElementById('floatingNewBtn');
    
    if (!floatingBtn) {
        return { passed: false, message: 'Floating button not found' };
    }
    
    // Test button positioning with sidebar open
    app.sidebarManager.openSidebar('right');
    const rightOpenStyle = window.getComputedStyle(floatingBtn);
    const movedWhenRightOpen = rightOpenStyle.right !== '24px'; // Should move left when right sidebar opens
    
    app.sidebarManager.closeSidebar('right');
    
    return {
        passed: movedWhenRightOpen,
        message: movedWhenRightOpen ? 'Floating button responsive positioning working' : 'Button positioning failed'
    };
}, 'ui');

// Entry Title Management Tests
tf.addTest(() => {
    const app = window.journal;
    
    // Create test entry with title
    const testEntry = {
        id: 'title-test',
        content: 'Test entry for title management',
        date: new Date().toISOString(),
        title: 'Test Title'
    };
    
    app.entries.unshift(testEntry);
    app.renderEntries();
    
    // Check if title remove button exists
    const titleRemoveBtn = document.querySelector('.entry-title-remove');
    const hasTitleRemoveBtn = titleRemoveBtn !== null;
    
    // Test title removal
    if (hasTitleRemoveBtn) {
        app.removeEntryTitle('title-test');
        const entryAfterRemoval = app.entries.find(e => e.id === 'title-test');
        const titleRemoved = !entryAfterRemoval || !entryAfterRemoval.title;
        
        // Clean up
        app.entries = app.entries.filter(e => e.id !== 'title-test');
        app.renderEntries();
        
        return {
            passed: titleRemoved,
            message: titleRemoved ? 'Entry title removal working' : 'Title removal failed'
        };
    }
    
    return {
        passed: false,
        message: 'Title remove button not found'
    };
}, 'entries');

// AI Status Indicator Tests
tf.addTest(() => {
    const app = window.journal;
    const aiStatus = document.getElementById('aiStatus');
    
    if (!aiStatus) {
        return { passed: false, message: 'AI status element not found' };
    }
    
    // Test different status states
    app.updateAIStatus('busy');
    const hasBusyClass = aiStatus.classList.contains('busy');
    
    app.updateAIStatus('connected');
    const hasConnectedClass = aiStatus.classList.contains('connected');
    
    return {
        passed: hasBusyClass && hasConnectedClass,
        message: `AI status indicators - Busy: ${hasBusyClass}, Connected: ${hasConnectedClass}`
    };
}, 'ai');

// Comprehensive Integration Test
tf.addTest(() => {
    const app = window.journal;
    
    // Test complete workflow
    const textarea = document.getElementById('journalEntry');
    const originalContent = textarea.value;
    
    // 1. Write content
    textarea.value = 'Integration test entry';
    app.autoSave();
    
    // 2. Switch theme
    const originalTheme = app.themeManager.currentTheme;
    app.themeManager.setTheme('cool');
    
    // 3. Open sidebar
    app.sidebarManager.openSidebar('left');
    const sidebarOpen = app.sidebarManager.isSidebarOpen('left');
    
    // 4. Close sidebar
    app.sidebarManager.closeSidebar('left');
    const sidebarClosed = !app.sidebarManager.isSidebarOpen('left');
    
    // 5. Create new entry
    app.newEntry();
    const textareaCleared = textarea.value === '';
    
    // Restore state
    textarea.value = originalContent;
    app.themeManager.setTheme(originalTheme);
    
    const allPassed = sidebarOpen && sidebarClosed && textareaCleared;
    
    return {
        passed: allPassed,
        message: `Integration test - Sidebar: ${sidebarOpen && sidebarClosed ? 'PASS' : 'FAIL'}, New entry: ${textareaCleared ? 'PASS' : 'FAIL'}`
    };
}, 'integration');

console.log('✅ Added comprehensive feature tests for:');
console.log('   • Theme system (switching, persistence)');
console.log('   • AI model selection and categories');
console.log('   • Autosave with continuous timestamps');
console.log('   • Date grouping functionality');
console.log('   • Toast notifications');
console.log('   • Responsive floating button');
console.log('   • Entry title management');
console.log('   • AI status indicators');
console.log('   • Complete integration workflow');

//
 Template Manager Tests
tf.addTest('Template Manager Initialized', async () => {
    const app = window.journal;
    return {
        pass: app.templateManager !== null && app.templateManager !== undefined,
        message: app.templateManager ? 'Template manager initialized' : 'Template manager not found'
    };
}, 'template-manager');

tf.addTest('Default Templates Loaded', async () => {
    const app = window.journal;
    const defaultTemplates = app.templateManager.defaultTemplates;
    
    return {
        pass: defaultTemplates.length === 2 && 
              defaultTemplates[0].id === 'default-six-fs' &&
              defaultTemplates[1].id === 'default-checkin',
        message: `Found ${defaultTemplates.length} default templates`
    };
}, 'template-manager');

tf.addTest('Mark Entry as Template', async () => {
    const app = window.journal;
    
    // Create a test entry
    app.textarea.value = 'Test template content';
    app.saveCurrentEntry();
    await tf.waitForCondition(() => app.entries.length > 0, 1000);
    
    const entryId = app.entries[0].id;
    const result = app.templateManager.markAsTemplate(entryId);
    
    const entry = app.entries.find(e => e.id === entryId);
    
    return {
        pass: result === true && entry.isTemplate === true && entry.templateOrder !== null,
        message: result ? 'Entry marked as template successfully' : 'Failed to mark entry as template'
    };
}, 'template-manager');

tf.addTest('Unmark Entry as Template', async () => {
    const app = window.journal;
    
    // Find a template entry
    const templateEntry = app.entries.find(e => e.isTemplate === true);
    if (!templateEntry) {
        return { pass: false, message: 'No template entry found for test' };
    }
    
    const result = app.templateManager.unmarkAsTemplate(templateEntry.id);
    const entry = app.entries.find(e => e.id === templateEntry.id);
    
    return {
        pass: result === true && entry.isTemplate === false && entry.templateOrder === null,
        message: result ? 'Template unmarked successfully' : 'Failed to unmark template'
    };
}, 'template-manager');

tf.addTest('Template Limit Enforcement', async () => {
    const app = window.journal;
    
    // Clear existing templates
    app.entries.forEach(entry => {
        if (entry.isTemplate) {
            entry.isTemplate = false;
            entry.templateOrder = null;
        }
    });
    
    // Create 5 test entries and mark them as templates
    for (let i = 0; i < 5; i++) {
        app.textarea.value = `Template ${i + 1}`;
        app.saveCurrentEntry();
        await tf.waitForCondition(() => app.entries.length > i, 1000);
        app.templateManager.markAsTemplate(app.entries[i].id);
    }
    
    // Try to add a 6th template
    app.textarea.value = 'Template 6';
    app.saveCurrentEntry();
    await tf.waitForCondition(() => app.entries.length > 5, 1000);
    
    const canAddMore = app.templateManager.canAddMoreTemplates();
    const result = app.templateManager.markAsTemplate(app.entries[5].id);
    
    return {
        pass: canAddMore === false && result === false,
        message: canAddMore ? 'Limit not enforced' : 'Template limit enforced correctly'
    };
}, 'template-manager');

tf.addTest('Template Order Assignment', async () => {
    const app = window.journal;
    
    const templates = app.templateManager.getTemplateEntries();
    const orders = templates.map(t => t.templateOrder);
    const uniqueOrders = new Set(orders);
    
    return {
        pass: orders.length === uniqueOrders.size && orders.every(o => o >= 0 && o < 5),
        message: `Template orders: ${orders.join(', ')}`
    };
}, 'template-manager');

// Template Creation Tests
tf.addTest('Create Entry from Default Template', async () => {
    const app = window.journal;
    
    const initialContent = app.textarea.value;
    app.templateManager.createEntryFromTemplate('default-six-fs');
    
    await tf.waitForCondition(() => app.textarea.value !== initialContent, 1000);
    
    return {
        pass: app.textarea.value.includes('Six F\'s Reflection') && 
              app.textarea.value.includes('Facts') &&
              app.currentEntryId === null,
        message: 'Entry created from default template'
    };
}, 'template-creation');

tf.addTest('Create Entry from Custom Template', async () => {
    const app = window.journal;
    
    // Find a custom template
    const customTemplate = app.entries.find(e => e.isTemplate === true);
    if (!customTemplate) {
        return { pass: false, message: 'No custom template found for test' };
    }
    
    const templateContent = customTemplate.content;
    app.templateManager.createEntryFromTemplate(customTemplate.id);
    
    await tf.waitForCondition(() => app.textarea.value === templateContent, 1000);
    
    return {
        pass: app.textarea.value === templateContent && app.currentEntryId === null,
        message: 'Entry created from custom template'
    };
}, 'template-creation');

tf.addTest('Create Blank Entry', async () => {
    const app = window.journal;
    
    app.textarea.value = 'Some content';
    const newBtn = document.getElementById('newBtn');
    newBtn.click();
    
    return {
        pass: app.textarea.value === '' && app.currentEntryId === null,
        message: 'Blank entry created successfully via New Entry button'
    };
}, 'template-creation');

tf.addTest('Template Content Copied Correctly', async () => {
    const app = window.journal;
    
    const template = app.templateManager.defaultTemplates[0];
    app.templateManager.createEntryFromTemplate(template.id);
    
    await tf.waitForCondition(() => app.textarea.value === template.content, 1000);
    
    return {
        pass: app.textarea.value === template.content,
        message: 'Template content copied correctly'
    };
}, 'template-creation');

tf.addTest('New Entry Not Marked as Template', async () => {
    const app = window.journal;
    
    app.templateManager.createEntryFromTemplate('default-checkin');
    await tf.waitForCondition(() => app.textarea.value.includes('Daily Check-in'), 1000);
    
    app.saveCurrentEntry();
    await tf.waitForCondition(() => app.currentEntryId !== null, 1000);
    
    const newEntry = app.entries.find(e => e.id === app.currentEntryId);
    
    return {
        pass: newEntry && newEntry.isTemplate === false,
        message: newEntry ? 'New entry not marked as template' : 'Entry not found'
    };
}, 'template-creation');

// Template Filtering Tests
tf.addTest('Filter Shows Only Templates', async () => {
    const app = window.journal;
    
    app.switchFilter('templates');
    await tf.waitForCondition(() => app.currentFilter === 'templates', 500);
    
    const filteredEntries = app.getFilteredEntries();
    const allAreTemplates = filteredEntries.every(e => e.isTemplate === true);
    
    return {
        pass: allAreTemplates,
        message: `Filtered ${filteredEntries.length} entries, all templates: ${allAreTemplates}`
    };
}, 'template-filtering');

tf.addTest('Filter Shows All Entries', async () => {
    const app = window.journal;
    
    app.switchFilter('all');
    await tf.waitForCondition(() => app.currentFilter === 'all', 500);
    
    const filteredEntries = app.getFilteredEntries();
    
    return {
        pass: filteredEntries.length === app.entries.length,
        message: `Showing ${filteredEntries.length} of ${app.entries.length} entries`
    };
}, 'template-filtering');

tf.addTest('Template Count Display', async () => {
    const app = window.journal;
    
    const templateCount = app.templateManager.getTemplateEntries().length;
    const displayElement = document.getElementById('templateCount');
    
    return {
        pass: displayElement && displayElement.textContent === String(templateCount),
        message: `Template count: ${templateCount}, Display: ${displayElement?.textContent}`
    };
}, 'template-filtering');

tf.addTest('Empty State with Filters', async () => {
    const app = window.journal;
    
    // Clear all templates
    app.entries.forEach(entry => {
        if (entry.isTemplate) {
            entry.isTemplate = false;
            entry.templateOrder = null;
        }
    });
    
    app.switchFilter('templates');
    app.renderEntries();
    
    const emptyState = document.getElementById('emptyState');
    const isVisible = emptyState && emptyState.style.display !== 'none';
    const hasCorrectMessage = emptyState && emptyState.textContent.includes('No templates yet');
    
    return {
        pass: isVisible && hasCorrectMessage,
        message: isVisible ? 'Empty state shown correctly' : 'Empty state not shown'
    };
}, 'template-filtering');

// Integration Tests
tf.addTest('End-to-End Template Workflow', async () => {
    const app = window.journal;
    
    // Create entry
    app.createBlankEntry();
    app.textarea.value = 'My custom template content';
    app.saveCurrentEntry();
    await tf.waitForCondition(() => app.currentEntryId !== null, 1000);
    
    const entryId = app.currentEntryId;
    
    // Mark as template
    app.templateManager.markAsTemplate(entryId);
    await tf.waitForCondition(() => {
        const entry = app.entries.find(e => e.id === entryId);
        return entry && entry.isTemplate === true;
    }, 1000);
    
    // Create new entry from template
    app.templateManager.createEntryFromTemplate(entryId);
    await tf.waitForCondition(() => app.textarea.value === 'My custom template content', 1000);
    
    return {
        pass: app.textarea.value === 'My custom template content' && app.currentEntryId === null,
        message: 'End-to-end workflow completed successfully'
    };
}, 'template-integration');

tf.addTest('Template Limit Workflow', async () => {
    const app = window.journal;
    
    // Clear existing templates
    app.entries.forEach(entry => {
        if (entry.isTemplate) {
            entry.isTemplate = false;
            entry.templateOrder = null;
        }
    });
    
    // Mark 5 entries as templates
    let markedCount = 0;
    for (let i = 0; i < Math.min(5, app.entries.length); i++) {
        if (app.templateManager.markAsTemplate(app.entries[i].id)) {
            markedCount++;
        }
    }
    
    // Try to mark a 6th
    const canAddMore = app.templateManager.canAddMoreTemplates();
    
    return {
        pass: markedCount === 5 && canAddMore === false,
        message: `Marked ${markedCount} templates, can add more: ${canAddMore}`
    };
}, 'template-integration');

tf.addTest('Default Template Fallback', async () => {
    const app = window.journal;
    
    // Test with 0 custom templates
    app.entries.forEach(entry => {
        if (entry.isTemplate) {
            entry.isTemplate = false;
            entry.templateOrder = null;
        }
    });
    
    let available = app.templateManager.getAvailableTemplates();
    const with0Custom = available.length === 5 && available.filter(t => !t.isCustom).length === 2;
    
    // Test with 3 custom templates
    for (let i = 0; i < 3 && i < app.entries.length; i++) {
        app.templateManager.markAsTemplate(app.entries[i].id);
    }
    
    available = app.templateManager.getAvailableTemplates();
    const with3Custom = available.length === 5 && available.filter(t => t.isCustom).length === 3;
    
    return {
        pass: with0Custom && with3Custom,
        message: `0 custom: ${with0Custom}, 3 custom: ${with3Custom}`
    };
}, 'template-integration');

tf.addTest('Backward Compatibility with Existing Entries', async () => {
    const app = window.journal;
    
    // Simulate old entry without template fields
    const oldEntry = {
        id: 'test-old-entry',
        content: 'Old entry content',
        date: new Date().toISOString(),
        wordCount: 3
    };
    
    app.entries.push(oldEntry);
    app.saveEntries();
    
    // Reload entries
    const reloadedEntries = app.loadEntries();
    const reloadedEntry = reloadedEntries.find(e => e.id === 'test-old-entry');
    
    return {
        pass: reloadedEntry && 
              reloadedEntry.isTemplate === false && 
              reloadedEntry.templateOrder === null,
        message: reloadedEntry ? 'Backward compatibility maintained' : 'Entry not found'
    };
}, 'template-integration');

// UI Interaction Tests
tf.addTest('Dropdown Open/Close Behavior', async () => {
    const app = window.journal;
    
    const dropdown = document.getElementById('newEntryDropdown');
    const newBtn = document.getElementById('newBtn');
    
    // Open dropdown
    newBtn.click();
    await tf.waitForCondition(() => dropdown.style.display === 'block', 500);
    const opened = dropdown.style.display === 'block';
    
    // Close dropdown
    app.closeTemplateDropdown();
    await tf.waitForCondition(() => dropdown.style.display === 'none', 500);
    const closed = dropdown.style.display === 'none';
    
    return {
        pass: opened && closed,
        message: `Opened: ${opened}, Closed: ${closed}`
    };
}, 'template-ui');

tf.addTest('Keyboard Navigation in Dropdown', async () => {
    const app = window.journal;
    
    const dropdown = document.getElementById('newEntryDropdown');
    app.openTemplateDropdown();
    await tf.waitForCondition(() => dropdown.style.display === 'block', 500);
    
    const options = dropdown.querySelectorAll('.template-option');
    const hasOptions = options.length > 0;
    const firstOptionFocusable = options[0] && typeof options[0].focus === 'function';
    
    app.closeTemplateDropdown();
    
    return {
        pass: hasOptions && firstOptionFocusable,
        message: `Options: ${options.length}, Focusable: ${firstOptionFocusable}`
    };
}, 'template-ui');

tf.addTest('Template Toggle on Hover', async () => {
    const app = window.journal;
    
    app.renderEntries();
    await tf.waitForCondition(() => document.querySelector('.entry-item'), 500);
    
    const entryItem = document.querySelector('.entry-item');
    const toggleBtn = entryItem?.querySelector('.entry-template-toggle');
    
    return {
        pass: toggleBtn !== null && toggleBtn !== undefined,
        message: toggleBtn ? 'Template toggle button present' : 'Toggle button not found'
    };
}, 'template-ui');

tf.addTest('Filter Tab Switching', async () => {
    const app = window.journal;
    
    const filterTabs = document.querySelectorAll('.filter-tab');
    const allTab = Array.from(filterTabs).find(tab => tab.dataset.filter === 'all');
    const templatesTab = Array.from(filterTabs).find(tab => tab.dataset.filter === 'templates');
    
    // Switch to templates
    templatesTab?.click();
    await tf.waitForCondition(() => app.currentFilter === 'templates', 500);
    const switchedToTemplates = app.currentFilter === 'templates';
    
    // Switch back to all
    allTab?.click();
    await tf.waitForCondition(() => app.currentFilter === 'all', 500);
    const switchedToAll = app.currentFilter === 'all';
    
    return {
        pass: switchedToTemplates && switchedToAll,
        message: `Switched to templates: ${switchedToTemplates}, Switched to all: ${switchedToAll}`
    };
}, 'template-ui');

tf.addTest('Template Management Section', async () => {
    const app = window.journal;
    
    const managementSection = document.getElementById('templateManagement');
    const countDisplay = document.getElementById('templateCountText');
    const listContainer = document.getElementById('templateListContainer');
    
    return {
        pass: managementSection && countDisplay && listContainer,
        message: 'Template management section elements present'
    };
}, 'template-ui');
