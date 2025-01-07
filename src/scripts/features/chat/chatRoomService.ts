import { API_CONFIG } from '../../core/api.config';
import { HttpService } from '../../core/httpService';
import { ErrorHandler } from '../../core/errorHandler';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { ChatService } from './chatService';

export interface ChatRoomData {
    name: string;
    roomId: string;
    lastMessageTime?: string;
    updatedAt: string;
}

export class ChatRoomService {
    private roomList: HTMLElement | null;
    private createRoomBtn: HTMLElement | null;
    private chatService: ChatService;

    constructor() {
        this.roomList = null;
        this.createRoomBtn = null;
        this.chatService = ChatService.getInstance();
    }

    initialize() {
        try {
            console.log('[CHAT_ROOM] Starting initialization...');
            this.setupElements();
            this.setupEventListeners();
            this.loadRooms();
            console.log('[CHAT_ROOM] Initialization complete');
        } catch (error) {
            console.error('[CHAT_ROOM] Error during initialization:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }

    private setupElements() {
        this.roomList = document.getElementById('roomList');
        this.createRoomBtn = document.getElementById('createRoomBtn');

        if (!this.roomList || !this.createRoomBtn) {
            throw new Error('Required chat room elements not found');
        }
    }

    private setupEventListeners() {
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', this.handleCreateRoom.bind(this));
        }

        EventBus.subscribe(Constants.EVENTS.ROOM_CREATED, (data: any) => this.handleRoomCreated(data));
        EventBus.subscribe(Constants.EVENTS.ROOMS_UPDATED, () => this.loadRooms());
    }

    private async loadRooms() {
        try {
            const response = await HttpService.get(API_CONFIG.ENDPOINTS.CHAT.ROOMS);
            console.log('[CHAT_ROOM] Loaded rooms response:', response);
            if (response.success) {
                this.displayRooms(response.rooms);
            }
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private displayRooms(rooms: any[]) {
        if (!this.roomList) return;
        console.log('[CHAT_ROOM] Displaying rooms:', rooms);

        this.roomList.innerHTML = '';
        rooms.forEach(room => {
            console.log('[CHAT_ROOM] Processing room:', room);
            const roomElement = this.createRoomElement(room);
            this.roomList?.appendChild(roomElement);
        });
    }

    private createRoomElement(room: any): HTMLElement {
        console.log('[CHAT_ROOM] Creating element for room:', room);
        
        if (!room) {
            console.error('[CHAT_ROOM] Invalid room object');
            return document.createElement('div');
        }

        const div = document.createElement('div');
        div.className = 'chat-room';
        
        // Get room ID without splitting
        const roomId = room._id || room.roomId;
        console.log('[CHAT_ROOM] Using room ID:', roomId);

        div.innerHTML = `
            <h4>${room.name || 'Unnamed Room'}</h4>
            <p>${room.participants?.length || 0} participants</p>
        `;

        if (!roomId) {
            console.error('[CHAT_ROOM] No room ID found in room object:', room);
            return div;
        }

        div.setAttribute('data-room-id', roomId);
        div.addEventListener('click', () => {
            console.log('[CHAT_ROOM] Room clicked, ID:', roomId);
            EventBus.publish(Constants.EVENTS.JOIN_ROOM, roomId);
        });

        return div;
    }

    private async handleCreateRoom() {
        try {
            const name = prompt('Enter room name:');
            if (!name) return;

            const response = await HttpService.post(API_CONFIG.ENDPOINTS.CHAT.ROOMS, { name });
            if (response.success) {
                EventBus.publish(Constants.EVENTS.ROOM_CREATED, response.room);
            }
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleRoomCreated(data: any) {
        this.loadRooms();
    }
} 