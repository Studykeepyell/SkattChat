// Message.js
const mongoose = require('mongoose');

// Define the Message schema
const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    room: { type: String, required: true }, // New field for room ID or name
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;