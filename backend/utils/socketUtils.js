const { userSocketMap } = require('../socket/index'); // Adjust based on your setup

exports.notifyUser = (userId, event, data) => {
    if (userSocketMap[userId]) {
        io.to(userSocketMap[userId]).emit(event, data);
    } else {
        console.log(`User ${userId} is offline or not registered in userSocketMap.`);
    }
};
