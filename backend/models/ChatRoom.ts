import mongoose, { Document } from 'mongoose';

export interface IChatRoom extends Document {
    type: 'private' | 'group';
    name?: string;
    members: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    lastMessage?: {
        content: string;
        sender: mongoose.Types.ObjectId;
        timestamp: Date;
    };
    profileImage?: {
        data: string;
        contentType: string;
    };
}

const chatRoomSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['private', 'group'],
        required: true
    },
    name: {
        type: String,
        required: false
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastMessage: {
        content: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: Date
    },
    profileImage: {
        data: String,
        contentType: String
    }
});

export default mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema); 