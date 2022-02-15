const { UserNotify, Notification } = require('../models');

module.exports = (socket) => {
    console.log('socket connected to the internet');
    // 1. Send event to client
    socket.emit('test', 'Test socket successfully');
    // 2. Take event from client 

    socket.on('post', (header, body,) => {
        // Notification.create({
        //     header,
        //     body,
        //     type: 'post',
        //     from: 
        // })
    })

    socket.on('disconnect', () => {
        console.log("socket server have been off");
    })
}