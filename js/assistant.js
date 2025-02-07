class AssistantChat {
    constructor(container) {
        this.container = container;
        this.messages = [];
        this.initializeUI();
    }

    initializeUI() {
        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.className = 'assistant-chat';
        chatContainer.innerHTML = `
            <div class="chat-messages"></div>
            <div class="chat-input-container">
                <textarea class="chat-input" placeholder="Ask me anything about your code..."></textarea>
                <button class="chat-send-btn">Send</button>
            </div>
        `;
        
        this.container.getElement().append(chatContainer);
        
        // Initialize elements
        this.messagesEl = chatContainer.querySelector('.chat-messages');
        this.inputEl = chatContainer.querySelector('.chat-input');
        this.sendBtn = chatContainer.querySelector('.chat-send-btn');
        
        // Add event listeners
        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.sendBtn.addEventListener('click', () => this.sendMessage());
    }

    async sendMessage() {
        const message = this.inputEl.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage('user', message);
        this.inputEl.value = '';

        // Get current editor content
        const sourceCode = sourceEditor.getValue();
        const language = $selectLanguage.find(':selected').text();

        try {
            // Send to AI API
            const response = await this.callAIAPI({
                messages: [...this.messages, { role: 'user', content: message }],
                sourceCode,
                language
            });

            // Add AI response to chat
            this.addMessage('assistant', response);
        } catch (error) {
            console.error('AI API error:', error);
            this.addMessage('error', 'Sorry, there was an error processing your request.');
        }
    }

    addMessage(role, content) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${role}-message`;
        messageEl.innerHTML = `
            <div class="message-content">${this.formatMessage(content)}</div>
        `;
        
        this.messagesEl.appendChild(messageEl);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        
        // Store message history
        this.messages.push({ role, content });
    }

    formatMessage(content) {
        // Add markdown formatting if needed
        return content;
    }

    async callAIAPI(data) {
        // Implement your AI API call here
        // This is a placeholder - replace with your actual API endpoint
        const response = await fetch('YOUR_AI_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_API_KEY'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('AI API request failed');
        }

        const result = await response.json();
        return result.message;
    }
} 