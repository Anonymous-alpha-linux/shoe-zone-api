const wrapMiddleware = require('./wrapMiddleware')

module.exports = {
    EmailService: require('./mail'),
    Token: require('./token'),
    isAuthentication: require('./authentication'),
    isAuthorization: require('./authorization'),
    wrapHttpToSocket: require('./wrapMiddleware'),
}