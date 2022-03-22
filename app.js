require('dotenv/config');
const routes = require('./routes');
const { connectToMongo } = require('./config');
const { isAuthentication, isAuthorization, EmailService, cloudinary } = require('./utils');
const { roles } = require('./fixtures');
const { Token, multer } = require('./utils');
const { Account, Workspace, Notification, Post, Attachment } = require('./models');
const { socketTargets } = require('./fixtures')
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const socketTarget = require('./fixtures/socket.target');
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
const corsList = ['http://localhost:3000', 'https://cms-fstaff.netlify.app'];
server.use(cors({
    origin: process.env.NODE_ENV === 'development' ? '*' : (origin, cb) => {
        if (corsList.indexOf(origin) !== -1) cb(null, true);
        else cb(new Error('Not allowed by CORS'))
    },
    // origin: (origin, cb) => {
    //     if (corsList.indexOf(origin) !== -1) cb(null, true);
    //     else cb(new Error('Not allowed by CORS'))
    // },
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
server.use('/api/v1/auth',
    multer.array('files'),
    routes.auth
);
// 2.2. admin
server.use('/api/v1/admin',
    isAuthentication,
    isAuthorization(roles.ADMIN, roles.QA_MANAGER),
    multer.array('files'),
    routes.admin);
// 2.3. staff
server.use('/api/v1/staff',
    isAuthentication,
    isAuthorization(roles.STAFF, roles.QA_COORDINATOR, roles.QA_MANAGER, roles.ADMIN),
    multer.array('files'),
    routes.staff);
// 2.5. manager
server.use('/api/v1/manager',
    isAuthentication,
    isAuthorization(roles.QA_COORDINATOR, roles.QA_MANAGER, roles.ADMIN),
    multer.array('files'),
    routes.QA_manager);
// 2.4. customer
server.use('/api/v1/customer',
    isAuthentication,
    isAuthorization(roles.ADMIN),
    multer.array('files'),
    routes.admin);
server.get("/api/v1/download",
    isAuthentication,
    isAuthorization(roles.ADMIN, roles.QA_COORDINATOR, roles.QA_MANAGER),
    async function (req, res) {
        const { postid } = req.query;
        try {
            if (!postid) return res.status.json({ error: 'Specify your postid' });
            const foundAttachments = await Attachment.where({ _id: { $in: attachments } });
            const { attachments } = await Post.findById(postid);
            const result = cloudinary.utils.download_zip_url({ resource_type: 'all', public_ids: foundAttachments.map(attach => attach.fileName) });
            res.status(200).json({ response: result, message: 'download item' });
        }
        catch (error) {
            res.status(500).send('Cannot download this item')
        }
    });
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

server.post('/upload', isAuthentication, multer.array("files"), (req, res) => {
    const files = req.files;
    return Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
            let fileExtension = /[^.]+$/.exec(file.originalname);
            cloudinary.uploader.upload(file.path, {
                folder: path,
                use_filename: true,
                filename_override: `${new Date(Date.now()).toLocaleString('en-uk', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
                unique_filename: true,
                discard_original_filename: true,
                resource_type: 'auto',
                format: fileExtension[0]
            }, function (error, result) {
                if (error) {
                    res.status(500).json({ error })
                }
                resolve(result);
            });
        });
    })).then(result => res.status(200).json({ files, result }))
})
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
const sessions = [];
async function sendSessionToClient(socket) {
    return socket.emit('session', socket.userid);
}
async function joinSession(socket) {
    const { id } = socket.user;
    const { username } = await Account.findById(id);
    sessions[id] = socket.id;
    console.log(username, 'has joined session');
}
async function leaveSession(socket) {
    const { id } = socket.user;
    const { username } = await Account.findById(id);
    socket.on('disconnect', () => {
        console.log(username, "have been off");
    });
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
            action === actions.COMMENT_POST && "commented to your post" ||
            action === actions.REPLY_COMMENT && "replied your comment" ||
            action === actions.EDIT_POST && "edited their post"
    }

    socket.on('notify', (data) => {
        const { id: userId } = socket.user;
        const { id, type, url, to: target } = data;
        return Promise.all([Notification.create({
            from: userId,
            createdAt: Date.now(),
            message: sendMessage(type),
            url: url,
            type: type
        }), target]).then(async data => {
            const [createdNotify, target] = data;
            const notify = await createdNotify.populate('from');
            return [notify, target];
        }).then(data => {
            const [notify, target] = data;
            sendNotifications(socket, target, notify);
        }).catch(error => {
            console.log(error.message);
        })
    });
}
async function sendNotifications(socket, to = socketTargets.ALL_USERS, data) {
    if (to == socketTargets.ALL_USERS) {
        socket.emit('notify', data);
        Account.updateMany({}, {
            newNotification: true
        })
    }
    else if (to == socketTarget.WITHOUT_BROADCAST) {
        socket.broadcast.emit('notify', data);
        Account.updateMany({ _id: { $ne: socket.user.id } }, {
            newNotification: true
        })
    }
    else {
        socket.to(sessions[to]).emit("notify", data);
    }
}
async function responseComment(socket) {
    socket.on('comment', data => {
        // const { postId, commentId } = data;
        socket.broadcast.emit('comment', data);
    });
}
async function responseCommentReply(socket) {
    socket.on('reply comment', data => {
        const { postId, commentId, replyId } = data;
        socket.broadcast.emit('reply comment', data);
    });
}
async function responseLikePost(socket) {
    socket.on('like post', data => {
        // const { userId, postId } = data;
        socket.broadcast.emit('like post', data);
    })
}
async function responseDislikePost(socket) {
    socket.on('dislike post', data => {
        const { userId, postId } = data;
        socket.broadcast.emit('dislike post', data);
    })
}
async function handleOfflineUsers(socket, onlineHandler, offlineHandler) {
    if (socket.connected) {
        onlineHandler();
    }
    else {
        OfflineHandler();
    }
}
async function receiveMessage(socket) {
    return socket.on('private message', data => {
        const { accountId, message } = data;
        console.log('listen message');
        if (sessions[accountId]) {
            socket.to(sessions[accountId]).emit('private message', message);
        }
    })
}

io.on('connection', async (socket) => {
    joinSession(socket);
    // 1. Active the event when user join to staff namespace
    sendSessionToClient(socket);
    // 2.1. create notification
    createNotification(socket);
    // 2.2. add notification
    receiveMessage(socket);
    // 3. comment real-time
    responseComment(socket);
    // 3.1 reply comment real-time
    responseCommentReply(socket);
    // 4. like real-time
    responseLikePost(socket);
    // 5. dislike real-time
    responseDislikePost(socket);
    // 4. 
    leaveSession(socket);
});

connectToMongo(client => {
    httpServer.listen(process.env.PORT || 5000, async () => {
        console.log("Server is running on", process.env.PORT || 5000);
    });

});

module.exports = {
    socket: socket,
};
