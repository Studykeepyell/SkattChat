export interface Message {
  id: string;
  content: string;
  username: string;
  timestamp: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  members: string[];
} 