const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    unreadMessages: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            count: { type: Number, default: 0 },
        },
    ],
    lastMessageTime: { type: Date, default: Date.now },
}, { timestamps: true });


module.exports = mongoose.model('Room', roomSchema);
