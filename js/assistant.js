import { config } from './config.js'


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
        // TODO: 1. Style model options and api key input
        chatContainer.innerHTML = `
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
            <div class='api-key'>
                <input id="api-key" type="text" placeholder="Enter Key"></input>
                <button class="save-key">Save</button>
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
        this.modelSelect = chatContainer.querySelector('.model-select');
        this.apiKeyInput = chatContainer.querySelector("#api-key");
        this.saveKeyBtn = chatContainer.querySelector(".save-key");
        
        // Add event listeners
        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.saveKeyBtn.addEventListener('click', () => this.saveAPIKey());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
    }

    saveAPIKey() {
        const apiKey = this.apiKeyInput.value;
        localStorage.setItem("openRouterApiKey", apiKey);
        alert('API Key Saved!');
    }

    async sendMessage() {
        const message = this.inputEl.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage('user', message);
        this.inputEl.value = '';

        // Get current editor content
        // TODO: getValue() is saying it does not exist (does this function exist)
        const sourceCode = window.sourceEditor.getValue();
        const language = window.$selectLanguage.find(':selected').text();
        const stdout = window.stdout.getValue();
        const stdin = window.stdin.getValue();

        // save selected model to localStorage
        localStorage.setItem('selectedModel', this.modelSelect.value)
        try {
            // Send to AI API
            const response = await this.callAIAPI({
                messages: [...this.messages, { role: 'user', content: message }],
                sourceCode,
                stdin,
                stdout,
                language,
                modelSelect: this.modelSelect.value
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
        // TODO: Add that the AI has access to code: {code}, input {input pulled from ...}, output {blah blah}, and user message

        // TODO: ADD bug fix recommendation feature (ie if output produces an error advise developer how to fix the code to work accordingly)
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
                  Authorization: `Bearer ${this.apiKeyInput}`,
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