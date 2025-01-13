import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    isPrivate: {
        type: Boolean,
        default: false
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    participantProfiles: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        profileImage: {
            data: String,
            contentType: String
        }
    }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    unreadMessages: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            count: { type: Number, default: 0 },
        },
    ],
    lastMessageTime: { type: Date, default: Date.now },
}, { timestamps: true });


export default mongoose.model('Room', roomSchema);
