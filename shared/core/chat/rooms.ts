export class ChatRoomManager {
  static validateRoomName(name: string): boolean {
    return name.length >= 3 && name.length <= 50;
  }

  static formatRoomData(room: ChatRoom): FormattedRoom {
    return {
      id: room.id,
      displayName: room.name,
      memberCount: room.members.length,
      lastActivity: new Date().toISOString()
    };
  }
} 