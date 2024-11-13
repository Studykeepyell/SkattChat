// models/FriendRequest.js
const mongoose = require('mongoose');


const friendRequestSchema = new mongoose.Schema({
    senderId: String,
    recipientId: String,
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('FriendRequest', friendRequestSchema);