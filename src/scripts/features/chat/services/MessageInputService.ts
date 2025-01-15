import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';

export class MessageInputService {
    private container: HTMLElement;
    private message: string = '';

    constructor(container: HTMLElement) {
        this.container = container;
        this.render();
        this.attachEventListeners();
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="message-input-wrapper">
                <form class="message-form">
                    <div class="input-row">
                        <div class="button-group">
                            <button type="button" class="emoji-button button-ghost" title="GIFs">
                                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                </svg>
                            </button>

                            <button type="button" class="file-button button-ghost" title="File">
                                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                    <polyline points="13 2 13 9 20 9"></polyline>
                                </svg>
                            </button>

                            <button type="button" class="scissors-button button-ghost" title="Scissors">
                                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="6" cy="6" r="3"></circle>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                                    <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                                    <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                                </svg>
                            </button>

                            <button type="button" class="chat-button button-ghost" title="Chat">
                                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                            </button>
                        </div>

                        <input
                            type="text"
                            class="message-input"
                            placeholder="Type a message..."
                        />

                        <div class="button-group">
                            <button type="button" class="video-call-button button-ghost" title="Video Call">
                                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 7l-7 5 7 5V7z"></path>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                </svg>
                            </button>

                            <button type="submit" class="send-button" disabled>
                                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                </form>
                <div class="gif-picker-container" style="display: none;"></div>
            </div>
        `;
    }

    private attachEventListeners(): void {
        const form = this.container.querySelector('form');
        const input = this.container.querySelector('.message-input') as HTMLInputElement;
        const sendButton = this.container.querySelector('.send-button') as HTMLButtonElement;

        input?.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            this.message = target.value;
            if (sendButton) {
                sendButton.disabled = !this.message.trim();
            }
        });

        form?.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            if (!this.message.trim()) return;
            
            EventBus.publish(Constants.EVENTS.SEND_MESSAGE, {
                message: this.message
            });
            
            this.message = '';
            if (input) {
                input.value = '';
            }
            if (sendButton) {
                sendButton.disabled = true;
            }
        });
    }
} 