// Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    message: { type: String, required: true }, // Ensure `message` is required if using this field name
    room: { type: String, required: true },
    username: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;