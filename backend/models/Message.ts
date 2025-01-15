import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    roomId: { type: String, required: true }, // Tag to identify the room
    userId: { type: String, required: true }, // User who sent the message
    username: { type: String, required: true }, // Display name of the sender
    messageType: { 
        type: String, 
        required: true,
        enum: ['text', 'gif'],
        default: 'text'
    }, // Type of message
    message: { 
        type: String, 
        required: function(this: any) {
            return this.messageType === 'text';
        }
    }, // Text message content
    gifUrl: { 
        type: String, 
        required: function(this: any) {
            return this.messageType === 'gif';
        }
    }, // URL of the GIF if message is a GIF
    timestamp: { type: Date, default: Date.now }, // Time the message was sent
});

// Create indexes for better query performance
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ userId: 1 });

export default mongoose.model('Message', messageSchema);
