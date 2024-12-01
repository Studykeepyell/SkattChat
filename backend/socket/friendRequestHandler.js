const Room = require('./models/Room'); // Adjust the path to your Room model

// Store user socket mappings globally or retrieve from your existing socket map logic
const userSocketMap = {}; // Example socket map: { userId: socketId }

/**
 * Handles friend requests and real-time private room creation.
 * @param {Object} io - The Socket.IO server instance.
 * @param {Object} socket - The Socket.IO socket instance.
 */
function handleFriendRequestEvents(io, socket) {
    // Event: Accept Friend Request
    socket.on('acceptFriendRequest', async (data) => {
        const { requesterId, accepterId } = data;

        try {
            // Create private room (or fetch an existing one)
            const roomId = `${requesterId}_${accepterId}`;
            let privateRoom = await Room.findOne({ roomId });
            if (!privateRoom) {
                privateRoom = await Room.create({
                    roomId,
                    name: `Private Chat: ${requesterId} and ${accepterId}`,
                    participants: [requesterId, accepterId],
                });
                console.log('Private room created:', privateRoom);
            }

            // Notify both users of the new private room
            [requesterId, accepterId].forEach((userId) => {
                const userSocketId = userSocketMap[userId];
                if (userSocketId) {
                    io.to(userSocketId).emit('newPrivateRoom', {
                        roomId: privateRoom.roomId,
                        name: privateRoom.name,
                    });
                }
            });
        } catch (error) {
            console.error('Error creating private room:', error);
        }
    });
}

module.exports = { handleFriendRequestEvents };
