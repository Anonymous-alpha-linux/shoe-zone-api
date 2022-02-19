require('dotenv/config');
const routes = require('./routes');
const { connectToMongo } = require('./config');
const { isAuthentication, isAuthorization, EmailService } = require('./utils');
const { roles } = require('./fixtures');
const Token = require('./utils');
const { UserNotify, Account } = require('./models');


const http = require('http');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');


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
const storage = multer.diskStorage({
    destination: function (req, res, cb) {
        const { accountId, account, role } = req.user,
            { view } = req.query,
            path = view === 'profile' ? `./public/images/${accountId}` : `./public/documents/${role}/${account + '-' + accountId}`;
        fs.mkdirSync(path, { recursive: true });
        cb(null, path)
    },
    filename: function (req, file, cb) {
        const { account, role } = req.user;
        cb(null, `[${role.toUpperCase()}]` + account + '-' + + Date.now() + '-' + file.originalname);
    }
}), upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    }
})

// 1. Using middleware
server.use(express.json()); // supporting the json body parser
server.use(express.urlencoded({ extended: true })); // supporting the encoded url parser 
server.use('/public', express.static(path.join(__dirname, 'public')))
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
// Function to serve all static files
// inside public directory.
// server.use(express.static('public'));
// server.use('/documents', express.static('documents'));
// server.use('/avatar', express.static('avatar'));
// 2. Authentication
// 2.1. authentications
server.use('/api/v1/auth', routes.auth);
// 2.2. admin
// server.use('/api/v1/admin', isAuthentication, isAuthorization(roles.ADMIN), routes.admin);
// 2.3. staff
server.use('/api/v1/staff',
    isAuthentication,
    isAuthorization(roles.STAFF, roles.ADMIN),
    upload.array('files'),
    routes.staff);
// 2.4. customer
server.use('/api/v1/customer',
    isAuthentication,
    isAuthorization(roles.ADMIN),
    upload.array('files'),
    routes.admin);
// 2.5. send email
// server.get('/send_email', auth, async (req, res) => {
//     try {
//         const email = new EmailService('pornhudpremium@gmail.com', process.env.NODEMAILER_SENDER);
//         await email.sendEmail();
//         res.status(200).send('send successfully');
//     } catch (error) {
//         res.send(error.message)
//     }
// });
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
    // 1. Send event to client
    socket.emit('join', `connected to socket`);
    // 2. Take event from client 
    socket.on('post', async (msg) => {
        return Notification.create({
            from: id,
            createdAt: Date.now(),
            message: msg,
            type: 'post'
        }).then(data => {
            return Account
                .find()
                .updateMany(account => account._id !== id, {
                    $push: {
                        notifications: {
                            isRead: false,
                            msg: data._id
                        }
                    }
                }, {
                    upsert: true, new: true, setDefaultsOnInsert: true
                })
        }).then(data => {
            io.emit('notify', data);
        })
            .catch(err => {
                console.log(err.message);
            });
    });

    socket.on('disconnect', () => {
        console.log("socket server have been off");
    });
});

connectToMongo(client => {
    httpServer.listen(process.env.PORT || 5000, async () => {
        console.log("Server is running on", process.env.PORT || 5000);
    });
});


module.exports = {
    upload: upload,
    socket: socket,
};
