require('dotenv/config');
const routes = require('./routes');
const { connectToMongo } = require('./config');
const { isAuthentication, isAuthorization, EmailService } = require('./utils');
const { roles } = require('./fixtures');
const { Token, cloudinary, multer } = require('./utils');
const { UserNotify, Account, Workspace } = require('./models');


const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
// const sftpStorage = require('multer-sftp');


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
    const accessToken = socket.handshake.auth.accessToken;
    if (!accessToken) {
        return next(new Error("invalid username"))
    }
    socket.user = Token.Token.verifyToken(accessToken);
    next();
})
io.on('connection', async (socket) => {
    console.log('connected to the internet');
    const { id, roleId } = socket.user;

    await Account.find()
        .then(data => data.forEach(({ _id }) => {
            if (id !== _id) socket.join("staff page");
            return;
        }))
        .catch(error => { throw new Error(error.message, "Cannot get user list") });

    console.log(socket.rooms);
    // 1. Send event to client
    socket.emit('join', `connected to socket`);
    // 2. Take event from client 
    socket.on('start', (data) => {
    });
    socket.on('notify post', async (data) => {
        console.log('notify post');
        // return Notification.create({
        //     from: id,
        //     url: data.postURL,
        //     createdAt: new Date(Date.now()),
        //     message: msg,
        //     type: 'post',

        // }).then(data => {
        //     return Account
        //         .find()
        //         .updateMany(account => account._id !== id, {
        //             $push: {
        //                 notifications: {
        //                     isRead: false,
        //                     notification: data._id
        //                 }
        //             }
        //         }, {
        //             upsert: true, new: true, setDefaultsOnInsert: true
        //         })
        // }).then(data => {
        //     io.emit('notify post', data);
        // }).catch(err => {
        //     console.log(err.message);
        // });
    });
    socket.on('like', (data) => {
    })
    socket.on('dislike', (data) => {

    })
    socket.on('group message', () => {
    })
    socket.on('notify message', (data) => {

    })
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
