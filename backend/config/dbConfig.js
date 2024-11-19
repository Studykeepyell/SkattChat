const mongoose = require('mongoose');
const Room = require('../models/Room');

const connectDB = async () => {
   // MongoDB and Socket.IO Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('Connected to MongoDB');

  // Create default rooms after database connection
  createDefaultRooms().then(() => {
      console.log('Default rooms initialized.');
  }).catch(console.error);
})
.catch(error => {
  console.error('Error connecting to MongoDB:', error);
});
};


async function createDefaultRooms() {
    const defaultRooms = [
        { roomId: 'general', name: 'General' },
        { roomId: 'random', name: 'Random' },
        { roomId: 'gaming', name: 'Gaming' },
        { roomId: 'music', name: 'Music' }
    ];
  
    for (const room of defaultRooms) {
        try {
            const existingRoom = await Room.findOne({ roomId: room.roomId });
            if (!existingRoom) {
                await Room.create(room);
                console.log(`Default room created: ${room.name}`);
            } else {
                console.log(`Default room already exists: ${room.name}`);
            }
        } catch (error) {
            console.error(`Error creating room ${room.name}:`, error);
        }
    }
  }

module.exports = connectDB;
