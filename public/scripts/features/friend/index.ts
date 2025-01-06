import { FriendService } from './friendService.js';
import { FriendSocketHandler } from './friendSocketHandler.js';

export class FriendModule {
    private friendService: FriendService;
    private socketHandler: FriendSocketHandler;

    constructor() {
        this.friendService = new FriendService();
        this.socketHandler = new FriendSocketHandler();
    }

    initialize() {
        this.socketHandler.initialize();
        this.setupEventListeners();
    }

    async sendFriendRequest(receiverId: string) {
        return await this.friendService.sendFriendRequest(receiverId);
    }

    private setupEventListeners() {
        // Setup DOM event listeners here
    }
} 