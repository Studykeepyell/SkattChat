import mongoose, { Document } from 'mongoose';

export interface IChatRoom extends Document {
    roomId: string;
    type: 'private' | 'public';
    name: string;
    description?: string;
    hostId?: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    memberProfiles: {
        userId: mongoose.Types.ObjectId;
        role: 'host' | 'moderator' | 'member';
        profileImage?: {
            data: string;
            contentType: string;
        };
    }[];
    messages: mongoose.Types.ObjectId[];
    unreadCounts: {
        userId: mongoose.Types.ObjectId;
        count: number;
    }[];
    lastMessage?: {
        content: string;
        sender: mongoose.Types.ObjectId;
        timestamp: Date;
    };
    settings: {
        allowNewMembers: boolean;
        maxMembers: number;
        isModerated: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const chatRoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['private', 'public'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function(this: any) { 
            return this.type === 'public'; 
        }
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    memberProfiles: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['host', 'moderator', 'member'],
            default: 'member'
        },
        profileImage: {
            data: String,
            contentType: String
        }
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    unreadCounts: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        count: {
            type: Number,
            default: 0
        }
    }],
    lastMessage: {
        content: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: Date
    },
    settings: {
        allowNewMembers: {
            type: Boolean,
            default: true
        },
        maxMembers: {
            type: Number,
            default: function(this: any) {
                return this.parent().type === 'private' ? 2 : 100;
            }
        },
        isModerated: {
            type: Boolean,
            default: function(this: any) {
                return this.parent().type === 'public';
            }
        }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
chatRoomSchema.index({ roomId: 1 });
chatRoomSchema.index({ type: 1 });
chatRoomSchema.index({ hostId: 1 }, { sparse: true });
chatRoomSchema.index({ members: 1 });
chatRoomSchema.index({ 'lastMessage.timestamp': -1 });

// Middleware to ensure private rooms have exactly 2 members
chatRoomSchema.pre('save', function(next) {
    if (this.type === 'private' && this.members.length !== 2) {
        next(new Error('Private rooms must have exactly 2 members'));
    } else {
        next();
    }
});

export default mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema); 