import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';
import { SocketService } from '../../../core/socketService';
import { ChatService } from './chatService';

interface GifImage {
    images: {
        fixed_height: {
            url: string;
        };
    };
    title?: string;
}

interface GifSearchResponse {
    data: GifImage[];
    meta: {
        status: number;
        msg: string;
        response_id: string;
    };
}

export class GifService {
    private container: HTMLElement;
    private isGifPickerOpen: boolean = false;
    private apiKey: string = 'xvALP5ayBaiAvATq6Sx8VpxhS30zCeD2';
    private chatService: ChatService;
    private currentRoomId: string = '';

    constructor(container: HTMLElement) {
        this.container = container;
        this.chatService = ChatService.getInstance();
        // Listen for room changes
        EventBus.subscribe(Constants.EVENTS.ROOM_CHANGED, (roomId: string) => {
            this.currentRoomId = roomId;
        });
    }

    public initialize(): void {
        this.setupGifPicker();
        this.injectStyles();
    }

    private async searchGifs(query: string): Promise<GifImage[]> {
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${this.apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
            );
            const data = await response.json() as GifSearchResponse;
            
            if (data.meta?.status === 401) {
                console.error('Giphy API authorization failed:', data.meta.msg);
                return [];
            }
            
            return data.data || [];
        } catch (error) {
            console.error('Error searching GIFs:', error);
            return [];
        }
    }
    
    private renderGifPicker(): HTMLElement {
        const gifPicker = document.createElement('div');
        gifPicker.className = 'gif-picker';
        gifPicker.innerHTML = `
            <div class="gif-picker-header">
                <input type="text" class="gif-search-input" placeholder="Search GIFs...">
                <button type="button" class="close-gif-picker">×</button>
            </div>
            <div class="gif-results"></div>
        `;
        return gifPicker;
    }

    private setupGifPicker(): void {
        const gifPickerContainer = this.container.querySelector('.gif-picker-container') as HTMLElement;
        const emojiButton = this.container.querySelector('.emoji-button') as HTMLElement;

        if (!gifPickerContainer || !emojiButton) return;

        emojiButton.addEventListener('click', () => {
            if (!this.isGifPickerOpen) {
                this.openGifPicker(gifPickerContainer);
            } else {
                this.closeGifPicker(gifPickerContainer);
            }
        });
    }

    private openGifPicker(container: HTMLElement): void {
        this.isGifPickerOpen = true;
        container.style.display = 'block';
        const gifPicker = this.renderGifPicker();
        container.appendChild(gifPicker);

        this.setupGifPickerEventListeners(container);
    }

    private closeGifPicker(container: HTMLElement): void {
        this.isGifPickerOpen = false;
        container.style.display = 'none';
        container.innerHTML = '';
    }

    private setupGifPickerEventListeners(container: HTMLElement): void {
        const searchInput = container.querySelector('.gif-search-input') as HTMLInputElement;
        const resultsContainer = container.querySelector('.gif-results') as HTMLElement;
        const closeButton = container.querySelector('.close-gif-picker') as HTMLElement;

        let searchTimeout: NodeJS.Timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const query = (e.target as HTMLInputElement).value.trim();
                if (query) {
                    const gifs = await this.searchGifs(query);
                    this.renderGifResults(gifs, resultsContainer);
                }
            }, 300);
        });

        resultsContainer.addEventListener('click', async (e) => {
            const gifItem = (e.target as HTMLElement).closest('.gif-item');
            if (gifItem) {
                const gifUrl = gifItem.getAttribute('data-gif-url');
                if (gifUrl && this.currentRoomId) {
                    const success = await this.chatService.handleMessageSend('', 'gif', gifUrl);
                    if (success) {
                        EventBus.publish(Constants.EVENTS.MESSAGE_SENT, {
                            messageType: 'gif',
                            gifUrl: gifUrl,
                            message: ''
                        });
                    }
                    this.closeGifPicker(container);
                }
            }
        });

        closeButton.addEventListener('click', () => this.closeGifPicker(container));
    }

    private renderGifResults(gifs: GifImage[], container: HTMLElement): void {
        container.innerHTML = gifs
            .filter(gif => gif?.images?.fixed_height?.url)
            .map(gif => {
                const imageUrl = gif.images.fixed_height.url;
                return `
                    <div class="gif-item" data-gif-url="${imageUrl}">
                        <img src="${imageUrl}" alt="${gif.title || 'GIF'}">
                    </div>
                `;
            })
            .join('');
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .gif-picker-container {
                position: absolute;
                bottom: 100%;
                left: 0;
                width: 320px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin-bottom: 8px;
            }
            .gif-picker {
                padding: 12px;
            }
            .gif-picker-header {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            .gif-search-input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .close-gif-picker {
                padding: 4px 8px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 20px;
            }
            .gif-results {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                max-height: 300px;
                overflow-y: auto;
            }
            .gif-item {
                cursor: pointer;
                border-radius: 4px;
                overflow: hidden;
            }
            .gif-item img {
                width: 100%;
                height: auto;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }
} 