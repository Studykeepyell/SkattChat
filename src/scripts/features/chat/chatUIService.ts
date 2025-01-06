import { ErrorHandler } from '../../core/errorHandler.js';
import { EventBus } from '../../core/eventBus.js';
import { Constants } from '../../core/constants.js';

export class ChatUIService {
    private messageInput: HTMLTextAreaElement | null;
    private sendButton: HTMLButtonElement | null;

    constructor() {
        this.messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
        this.sendButton = document.getElementById('send-button') as HTMLButtonElement;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', this.handleKeyPress.bind(this));
            this.messageInput.addEventListener('input', this.adjustTextareaHeight.bind(this));
        }

        if (this.sendButton) {
            this.sendButton.addEventListener('click', this.handleSendClick.bind(this));
        }
    }

    private handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    private adjustTextareaHeight() {
        if (this.messageInput) {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = `${this.messageInput.scrollHeight}px`;
        }
    }

    private handleSendClick() {
        this.sendMessage();
    }

    private sendMessage() {
        if (!this.messageInput) return;

        const message = this.messageInput.value.trim();
        if (message) {
            EventBus.publish(Constants.EVENTS.SEND_MESSAGE, message);
            this.messageInput.value = '';
            this.adjustTextareaHeight();
        }
    }

    clearChat() {
        const messagesList = document.getElementById('messages');
        if (messagesList) {
            messagesList.innerHTML = '';
        }
    }
} 