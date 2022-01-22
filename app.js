require('dotenv/config');
const express = require('express');
const { connectToMongo } = require('./config');
const server = express();
const routes = require('./routes');
const { isAuthentication, isAuthorization } = require('./utils');
const cors = require('cors');

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
server.use('/api/v1/admin', isAuthentication, isAuthorization("admin"), routes.admin);
// 2.3. staff
server.use('/api/v1/staff', isAuthentication, isAuthorization("staff"), routes.admin);
// 2.4. customer
server.use('/api/v1/customer', isAuthentication, isAuthorization("admin", "staff", "customer"), routes.users);
// 2.5. checkout
server.use('/api/v1/checkout', isAuthentication, routes.payment);

server.all('*', function (req, res, next) {
    var origin = cors.origin.indexOf(req.header('origin').toLowerCase()) > -1 ? req.headers.origin : cors.default;
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Catch page error with server routing
server.use((req, res) => {
    res.status(404).json({
        error: `Page not found !`
    })
})

// implementing our server
connectToMongo(client => {
    server.listen(process.env.PORT || 5000, () => {
        console.log("Server is running on", process.env.PORT);
    })
})

