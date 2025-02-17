export class AssistantChat {
    constructor(container) {
        this.container = container;
        this.messages = [];
        this.loadingMessage = null;
        this.initializeUI();
        this.loadStoredValues();
    }

    initializeUI() {
        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.className = 'assistant-chat';
        chatContainer.innerHTML = `
            <div class="assistant-header">
                <span class="assistant-title">AI Assistant</span>
                <button class="settings-btn">
                    <i class="cog icon"></i>
                </button>
            </div>
            <div class="assistant-components" style="display: none;">
                <div class="choose-model">
                    <p><b>Choose Model:</b></p>
                    <select class="model-select">
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="claude-2">Claude 2</option>
                        <option value="openai/o3-mini-high">Open AI: o3 Mini High</option>
                        <option value="deepseek/deepseek-chat:free">Deepseek V3</option>
                    </select>
                </div>
                <p><b>OpenRouter API Key:</b></p>
                <div class='api-key'>
                    <input id="api-key" type="password" placeholder="Enter Key"></input>
                    <button class="save-key">Save</button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input-container">
                <textarea class="chat-input" placeholder="Ask me anything about your code..."></textarea>
                <button class="chat-send-btn">Send</button>
            </div>
        `;

        // TODO: ADD tab feature for assistant component
        // <!-- Tab links -->
        // <div class="tab">
        //   <button class="tablinks" onclick="openComponent(event, 'chooseModel')">Choose Model</button>
        //   <button class="tablinks" onclick="openComponent(event, 'apiKey')">Add API Key</button>
        // </div>

        // <!-- Tab content -->
        // <div id="chooseModel" class="tabcontent">
        //   <p><b>Choose Model:</b></p>
        //   <select class="model-select">
        //       <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        //       <option value="gpt-4">GPT-4</option>
        //       <option value="claude-2">Claude 2</option>
        //       <option value="openai/o3-mini-high">Open AI: o3 Mini High</option>
        //       <option value="deepseek/deepseek-chat:free">Deepseek V3</option>
        //   </select>
        // </div>
        // <div id="apiKey" class="tabcontent">
        //         <input id="api-key" type="password" placeholder="Enter Key"></input>
        //         <button class="save-key">Save</button>
        //     </div>

        this.container.getElement().append(chatContainer);

        // Initialize elements
        this.messagesEl = chatContainer.querySelector('.chat-messages');
        this.inputEl = chatContainer.querySelector('.chat-input');
        this.sendBtn = chatContainer.querySelector('.chat-send-btn');
        this.modelSelect = chatContainer.querySelector('.model-select');
        this.apiKeyInput = chatContainer.querySelector("#api-key");
        this.saveKeyBtn = chatContainer.querySelector(".save-key");
        this.tabLinks = chatContainer.querySelectorAll('.tablinks'); // Get tab links
        this.tabContent = chatContainer.querySelectorAll('.tabcontent'); // Get tab content

        // Add settings button handler
        this.settingsBtn = chatContainer.querySelector('.settings-btn');
        this.assistantComponents = chatContainer.querySelector('.assistant-components');
        
        this.settingsBtn.addEventListener('click', () => {
            const isHidden = this.assistantComponents.style.display === 'none';
            this.assistantComponents.style.display = isHidden ? 'block' : 'none';
            this.settingsBtn.classList.toggle('active');
        });

        // Add event listeners
        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.saveKeyBtn.addEventListener('click', () => this.saveAPIKey());
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Add event listeners to tab links
        this.tabLinks.forEach(tabLink => {
            tabLink.addEventListener('click', (event) => this.openComponent(event, tabLink.dataset.component));
        });

        // Add change event listener for model select to save selection
        this.modelSelect.addEventListener('change', () => {
            localStorage.setItem('selectedModel', this.modelSelect.value);
        });

        // Show the first tab by default
        this.openComponent(null, 'chooseModel');
    }

    loadStoredValues() {
        // Load stored API key
        const storedApiKey = localStorage.getItem('openRouterApiKey');
        if (storedApiKey) {
            this.apiKeyInput.value = storedApiKey;
        }

        // Load stored model selection
        const storedModel = localStorage.getItem('selectedModel');
        if (storedModel) {
            this.modelSelect.value = storedModel;
        } else {
            // Set default value if nothing stored (first option)
            this.modelSelect.value = this.modelSelect.options[0].value;
            localStorage.setItem('selectedModel', this.modelSelect.value);
        }
    }

    openComponent(evt, component) {
        // Hide all tab content
        this.tabContent.forEach(content => {
            content.style.display = 'none';
        });

        // Deactivate all tab links
        this.tabLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Show the current tab
        const tabContent = document.querySelector(`#${component}`);
        if (tabContent) {
            tabContent.style.display = 'block';
        }

        // Activate the current tab link
        if (evt) {
            evt.currentTarget.classList.add('active');
        } else {
            // If no event, find the tab link with the matching data-component and activate it
            this.tabLinks.forEach(link => {
                if (link.dataset.component === component) {
                    link.classList.add('active');
                }
            });
        }
    }

    saveAPIKey() {
        const apiKey = this.apiKeyInput.value;
        localStorage.setItem("openRouterApiKey", apiKey);
        alert('API Key Saved!');
    }

    showLoadingIndicator() {
        // Create loading message element if it doesn't exist
        const loadingEl = document.createElement('div');
        loadingEl.className = 'chat-message loading-message';
        loadingEl.innerHTML = `
            <div class="loading-dots">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        `;
        this.messagesEl.appendChild(loadingEl);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        this.loadingMessage = loadingEl;
    }

    hideLoadingIndicator() {
        if (this.loadingMessage) {
            this.loadingMessage.remove();
            this.loadingMessage = null;
        }
    }

    async sendMessage() {
        const message = this.inputEl.value.trim();
        if (!message) return;

        // Hide settings if they're open
        this.assistantComponents.style.display = 'none';
        this.settingsBtn.classList.remove('active');

        // Clear input immediately
        this.inputEl.value = '';

        // Get current editor content once
        const sourceCode = window.sourceEditor.getValue();
        const language = window.$selectLanguage.find(':selected').text();
        const stdout = window.stdout.getValue();
        const stdin = window.stdin.getValue();

        // Add user message immediately
        this.addMessageWithContent('user', message);
        
        // Show loading indicator
        this.showLoadingIndicator();

        try {
            // Send API request
            const response = await this.callAIAPI({
                messages: [...this.messages, { role: 'user', content: message }],
                sourceCode,
                stdin,
                stdout,
                language,
                modelSelect: this.modelSelect.value
            });

            this.hideLoadingIndicator();

            console.log('Response from API:', response);

            if (!response || typeof response !== 'string') {
                console.error('Invalid response type:', response);
                throw new Error("Invalid response from API");
            }

            const processedContent = this.formatMessage(response);
            const codeBlocks = this.extractCodeBlocks(response);

            // Update message and handle comparison visibility
            await this.addMessageWithContent('assistant', processedContent);

            if (codeBlocks.length > 0) {
                // Show comparison and update diff editor
                window.showComparison();
                window.updateDiffEditor(sourceCode, codeBlocks[0].code, language);
            } else {
                // Hide comparison if no code blocks
                window.hideComparison();
            }

        } catch (error) {
            // Hide loading indicator on error
            this.hideLoadingIndicator();
            console.error('Message handling error:', error);
            this.addMessageWithContent('error', `Error: ${error.message}`);
            window.hideComparison();
        }
    }

    // New method to add message with pre-processed content
    addMessageWithContent(role, processedContent) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${role}-message`;
        messageEl.innerHTML = `
            <div class="message-content">${processedContent}</div>
        `;

        this.messagesEl.appendChild(messageEl);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

        // Store original message content
        this.messages.push({ role, content: processedContent });
    }

    // Optimized code block extraction
    extractCodeBlocks(content) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const blocks = [];
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Only process if we find a code block
            if (match[2]) {
                blocks.push({
                    language: match[1] || '',
                    code: match[2].trim()
                });
                // Break after first code block since we only use the first one
                break;
            }
        }

        return blocks;
    }

    // Optimized message formatting
    formatMessage(content) {
        // Use a single pass through the content
        const formattedContent = content
            // Handle code blocks first
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => 
                `<div class="code-block-wrapper">
                    ${language ? `<div class="code-language">${language}</div>` : ''}
                    <pre><code class="${language || ''}">${code.trim()}</code></pre>
                </div>`
            )
            // Handle headers
            .replace(/#{1,6} (.+)/g, (match, text) => {
                const level = match.trim().split(' ')[0].length;
                return `<h${level} class="chat-heading">${text}</h${level}>`;
            })
            // Handle all other markdown elements in one pass
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/^- (.+)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)\n/g, '<ul>$1</ul>')
            .replace(/\n/g, '<br>');

        return formattedContent;
    }

    async callAIAPI(data) {
        // TODO: 2. ADD bug fix recommendation feature (ie if output produces an error advise developer how to fix the code to work accordingly)
        // TODO: 3. add color styling feature to show user code changes
        // TODO: 4. Demo video, post, and submission
        const systemMessage = {
            role: "system",
            content: `You are a helpful programming assistant and teacher. You have access to the following ${data.language} code:
            
            ${data.sourceCode}
            
            Inputs:
            ${data.stdin}

            Outputs: 
            ${data.stdout}
            Instructions for formatting your responses:
            - Use markdown formatting
            - Always wrap code snippets in triple backticks with the language specified
            - Use bullet points for lists
            - Use headings where appropriate
            - Format inline code with single backticks
            
            Your responses should be friendly and helpful.

            If there are errors in the output, provide step-by-step fix for user.
            `
        };

        const messages = [
            systemMessage,
            ...data.messages
        ];

        const apiKey = localStorage.getItem('openRouterApiKey');
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-chat:free',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2000
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            console.log('Raw API Response:', result);

            if (!result.choices?.[0]?.message?.content) {
                console.error('API Response Structure:', result);
                throw new Error('No content in API response');
            }

            return result.choices[0].message.content;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}