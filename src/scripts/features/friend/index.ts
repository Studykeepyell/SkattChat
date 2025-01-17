import { FriendService } from './friendService';
import { FriendSocketHandler } from './friendSocketHandler';
import { StorageService } from '../../core/storageService';
import { ErrorHandler } from '../../core/errorHandler';
import { Constants } from '../../core/constants';

export class FriendModule {
    private friendService: FriendService;
    private socketHandler: FriendSocketHandler;

    constructor() {
        this.friendService = new FriendService();
        this.socketHandler = new FriendSocketHandler();
    }

    initialize() {
        try {
            const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
            if (!token) {
                throw new Error('Authentication token not found');
            }
            
            this.socketHandler.initialize(token);
            this.setupEventListeners();
        } catch (error) {
            ErrorHandler.handle(error);
            throw error;
        }
    }

    async sendFriendRequest(receiverId: string) {
        return await this.friendService.sendFriendRequest(receiverId);
    }

    async loadFriendRequests() {
        return await this.friendService.loadFriendRequests();
    }

    async respondToFriendRequest(requestId: string, status: 'accepted' | 'declined') {
        return await this.friendService.respondToFriendRequest(requestId, status);
    }

    private setupEventListeners() {
        // Setup DOM event listeners here
    }
} 