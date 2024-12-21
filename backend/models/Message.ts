import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    roomId: { type: String, required: true }, // Tag to identify the room
    userId: { type: String, required: true }, // User who sent the message
    username: { type: String, required: true }, // Display name of the sender
    message: { type: String, required: true }, // Message content
    timestamp: { type: Date, default: Date.now }, // Time the message was sent
});

export default mongoose.model('Message', messageSchema);
