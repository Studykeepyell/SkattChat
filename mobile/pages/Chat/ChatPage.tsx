// ChatPage.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { io, Socket } from 'socket.io-client';

interface ChatPageProps {
  socket: Socket;
}

const ChatPage: React.FC<ChatPageProps> = ({ socket }) => {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  return (
    <div className="chat-container">
      <Sidebar 
        socket={socket} 
        onRoomSelect={setCurrentRoom} 
        currentRoom={currentRoom}
      />
      <ChatArea 
        socket={socket} 
        currentRoom={currentRoom} 
      />
    </div>
  );
};

export default ChatPage;