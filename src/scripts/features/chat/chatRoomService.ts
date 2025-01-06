import { API_CONFIG } from '../../core/api.config.js';
import { HttpService } from '../../core/httpService.js';
import { ErrorHandler } from '../../core/errorHandler.js';
import { EventBus } from '../../core/eventBus.js';
import { Constants } from '../../core/constants.js';

export interface ChatRoomData {
    name: string;
    roomId: string;
    lastMessageTime?: string;
    updatedAt: string;
}

export class ChatRoomService {
    static async create(roomName: string, userId: string) {
        try {
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.CHAT.ROOMS,
                { roomName, userId }
            );
            EventBus.publish(Constants.EVENTS.ROOM_CREATED, response.room);
            return response.room;
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    static async fetchRooms() {
        try {
            const response = await HttpService.get(API_CONFIG.ENDPOINTS.CHAT.ROOMS);
            return response.rooms;
        } catch (error) {
            ErrorHandler.handle(error);
            return [];
        }
    }

    static updateRoom(roomElement: HTMLElement, room: ChatRoomData) {
        const nameElement = roomElement.querySelector('.room-name');
        const timestampElement = roomElement.querySelector('.room-timestamp');
        
        if (nameElement) {
            nameElement.textContent = room.name;
        }
        
        if (timestampElement) {
            timestampElement.textContent = new Date(room.lastMessageTime || room.updatedAt).toLocaleString();
        }
    }
} 