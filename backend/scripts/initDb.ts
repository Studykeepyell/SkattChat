import mongoose from 'mongoose';
import ChatRoom from '../models/chatroom/ChatRoom.js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });

async function initializeDefaultRoom() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Check if default room already exists
        const existingRoom = await ChatRoom.findOne({ roomId: 'default_global_chat' });
        if (existingRoom) {
            console.log('Default room already exists');
            process.exit(0);
            return;
        }

        // Create default room
        const defaultRoom = await ChatRoom.create({
            roomId: 'default_global_chat',
            type: 'public',
            name: 'Skattchat',
            description: 'Welcome to the Global Chat Room!',
            members: [],
            memberProfiles: [],
            messages: [],
            hostId: new mongoose.Types.ObjectId(),
            settings: {
                allowNewMembers: true,
                maxMembers: 1000,
                isModerated: true
            }
        });

        console.log('Default room created:', defaultRoom);
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDefaultRoom(); 