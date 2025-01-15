import { GifService } from './GifService';

export class EmojiService {
    private gifService: GifService | null = null;
    private messageInputRoot: HTMLElement | null = null;

    constructor() {
        this.messageInputRoot = document.getElementById('message-input-root');
    }

    public initialize(): void {
        if (this.messageInputRoot) {
            this.gifService = new GifService(this.messageInputRoot);
            this.gifService.initialize();
        }
    }
}