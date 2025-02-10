import { config } from './config.js'


class AssistantChat {
    constructor(container) {
        this.container = container;
        this.messages = [];
        // Get references to global elements
        this.sourceEditor = window.sourceEditor;
        this.$selectLanguage = window.$selectLanguage;
        this.initializeUI();
    }

    initializeUI() {
        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.className = 'assistant-chat';
        chatContainer.innerHTML = `
            <div class="choose-model">
                <select class="model-select">
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="claude-2">Claude 2</option>
                </select>
            </div>
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
        const sourceCode = this.sourceEditor.getValue();
        const language = this.$selectLanguage.find(':selected').text();
        // Get selected model
        const modelSelect = document.querySelector('.model-select').value;

        try {
            // Send to AI API
            const response = await this.callAIAPI({
                messages: [...this.messages, { role: 'user', content: message }],
                sourceCode,
                language,
                modelSelect
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
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    async callAIAPI(data) {
        const systemMessage = {
            role: "system",
            content: `You are a helpful programming assistant and teacher. You have access to the following ${data.language} code:
            
            ${data.sourceCode}
            
            Instructions for formatting your responses:
            - Use markdown formatting
            - Always wrap code snippets in triple backticks with the language specified
            - Use bullet points for lists
            - Use headings where appropriate
            - Format inline code with single backticks
            
            Your responses should be friendly and helpful.
            `
        };

        const messages = [
            systemMessage,
            ...data.messages
        ];

        try {
            fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: data.modelSelect,
                  messages: messages,
                }),
              });
            

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
} 

export {AssistantChat}