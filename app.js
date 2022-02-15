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


const server = express();
const httpServer = http.createServer(server);

const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:4000', 'https://cms-fstaff.netlify.app/'],
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
server.use(cors({
    origin: ['http://localhost:3000', 'https://shoe-shop-app.netlify.app'],
    optionsSuccessStatus: 200
}))

// 2. Authentication
// 2.1. authentications
server.use('/api/v1/auth', routes.auth);
// 2.2. admin
// server.use('/api/v1/admin', isAuthentication, isAuthorization(roles.ADMIN), routes.admin);
// 2.3. staff
server.use('/api/v1/staff',
    isAuthentication,
    isAuthorization(roles.STAFF),
    upload.array('files'),
    routes.staff);

// server.post('/api/v1/upload',
//     isAuthentication,
//     async (req, res) => {
//         try {
//             await req.files.map(async file => {
//                 Attachment.create({
//                     fileName: file.filename,
//                     filePath: file.path,
//                     downloadable: true,
//                     post: '62041c1dd2bfa7eb6c4f3879'
//                 })
//             })
//         } catch (error) {
//             res.status(500).json({
//                 files: req.files
//             })
//         }
//     })
// 2.4. customer
// server.use('/api/v1/customer', isAuthentication, isAuthorization(roles.ADMIN), routes.users);
// 2.5. checkout
// server.use('/api/v1/checkout', isAuthentication, routes.payment);
// 2.6. send email
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
    socket.emit('test', "Connected to socket");
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