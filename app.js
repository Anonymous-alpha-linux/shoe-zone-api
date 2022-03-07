require('dotenv/config');
const routes = require('./routes');
const { connectToMongo } = require('./config');
const { isAuthentication, isAuthorization, EmailService } = require('./utils');
const { roles } = require('./fixtures');
const { Token, cloudinary, multer } = require('./utils');
const { UserNotify, Account, Workspace, Notification } = require('./models');


const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
// const sftpStorage = require('multer-sftp');
const { v4: uuidv4 } = require('uuid');

const server = express();
const httpServer = http.createServer(server);

const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:3000',
            'https://cms-fstaff.netlify.app'
        ]
    },
}), socket = null;

// 1. Using middleware
server.use(express.json()); // supporting the json body parser
server.use(express.urlencoded({ extended: true })); // supporting the encoded url parser 
const corsList = [
    'http://localhost:3000',
    'https://cms-fstaff.netlify.app',
];
server.use(cors({
    origin: process.env.NODE_ENV === 'development' ? '*' : (origin, cb) => {
        if (corsList.indexOf(origin) !== -1) cb(null, true);
        else cb(new Error('Not allowed by CORS'))
    },
    optionsSuccessStatus: 200
}));
server.use('/public', express.static(path.join(__dirname, 'public')))

// Function to serve all static files
// inside public directory.
// server.use(express.static('public'));
// server.use('/documents', express.static('documents'));
// server.use('/avatar', express.static('avatar'));
// 2. Authentication
// 2.1. authentications
server.use('/api/v1/auth', routes.auth);
// 2.2. admin
server.use('/api/v1/admin',
    isAuthentication,
    isAuthorization(roles.ADMIN),
    multer.array('files'),
    routes.admin);
// 2.3. staff
server.use('/api/v1/staff',
    isAuthentication,
    isAuthorization(roles.STAFF, roles.QA_COORDINATOR, roles.QA_MANAGER, roles.ADMIN),
    multer.array('files'),
    routes.staff);
// 2.4. customer
server.use('/api/v1/customer',
    isAuthentication,
    isAuthorization(roles.ADMIN),
    multer.array('files'),
    routes.admin);
// 2.5. send email
server.get('/send_email', isAuthentication, async (req, res) => {
    try {
        const email = new EmailService('pornhudpremium@gmail.com', process.env.NODEMAILER_SENDER);
        await email.sendEmail();
        res.status(200).send('send successfully');
    } catch (error) {
        res.send(error.message)
    }
});
// Catch page error with server routing
server.use((req, res) => {
    res.status(404).json({
        error: `Page not found !`
    })
});


io.use((socket, next) => {
    const { accessToken } = socket.handshake.auth;

    if (!accessToken) {
        return next(new Error("invalid username"))
    }
    socket.user = Token.verifyToken(accessToken);
    socket.userid = uuidv4();
    if (!socket.user) {
        next(new Error('Invalid user'));
    }
    next();
})
async function createSession(socket) {
    const { id, roleId } = socket.user;
    const account = await Account.findById(id);
    return socket.emit('session', { userId: socket.userid, user: account })
}
async function sendNotification(socket) {
    return;
}
async function createNotification(socket) {
    const actions = {
        CREATE_POST: 0,
        LIKE_POST: 1,
        DISLIKE_POST: 2,
        COMMENT_POST: 3,
        REPLY_COMMENT: 4,
        EDIT_POST: 5,
    }

    const sendMessage = function (action) {
        return action === actions.CREATE_POST && "created a new post" ||
            action === actions.LIKE_POST && "like your post" ||
            action === actions.DISLIKE_POST && "disliked your post" ||
            action === actions.COMMENT_POST && "have a comment to your post" ||
            action === actions.REPLY_COMMENT && "replied your comment" ||
            action === actions.EDIT_POST && "edited their post"
    }

    return socket.on('notify', (data) => {
        const { id, roleId } = socket.user;
        return Notification.create({
            from: id,
            createdAt: Date.now(),
            message: sendMessage(data.type),
            url: data.postURL,
            type: data.type
        })
            .then(data => socket.broadcast.emit('notify', data))
            .catch(error => {
                throw new Error(error.message);
            })
    });
}
// async function sendNotifications(socket, to = [], data) {
//     if (to === targets)
//         return socket.emit('notify', data);
//     else if (to === WITH_BROADCAST)
//         return socket.broadcast.emit('notify', data);
//     return socket.to(to).emit("notify", data);
// }
async function connectToSocket(socket) {
    return;
}
async function likePost(socket) {
    return;
}
async function dislikePost(socket) {
    return;
}

io.on('connection', async (socket) => {
    console.log(socket.userid, 'connected to the internet');

    // 1. Active the event when user join to staff namespace
    socket.emit('join', `${socket.userid} connected to rooms`);
    createSession(socket);
    // 2.Notification
    // 2.1. create notification
    createNotification(socket);
    // socket.on("notify", data => {
    //     console.log(data);
    //     socket.broadcast.emit('notify', {
    //         message: 'I have created notification, now your time to display'
    //     });
    // });
    // sendNotifications(socket, socket)
    // 2.2. add notification

    // 3. 
    socket.on('disconnect', () => {
        console.log("socket server have been off");
    });
});

connectToMongo(client => {
    httpServer.listen(process.env.PORT || 5000, async () => {
        console.log("Server is running on", process.env.PORT || 5000);
        // Workspace.aggregate()
        //     .match({
        //         _id: '61f7bc0f4116f253caf86586'
        //     })
        //     .project({ posts: 1, _id: 0 })
        //     .lookup({ from: 'posts', as: 'posts', localField: 'posts', foreignField: '_id' })
        //     .limit(3)
        //     .then(data => console.log(data));
    });

});

module.exports = {
    socket: socket,
};
