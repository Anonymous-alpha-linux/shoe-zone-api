let jwt = require('jsonwebtoken');

module.exports = class Token {
    constructor(payload) {
        this.payload = payload;
    }

    createToken() {
        return jwt.sign(this.payload, process.env.JSON_SECRETE_TOKEN, {
            expiresIn: '6h',
        });
    }

    async createRefreshToken() {
        return jwt.sign(this.payload, process.env.JSON_REFRESH_TOKEN,
            {
                expiresIn: '2d'
            });
    }
    static verifyToken(token) {
        return jwt.verify(token, process.env.JSON_SECRETE_TOKEN);
    }
    static verifyRefreshToken(token) {
        return jwt.verify(token, process.env.JSON_REFRESH_TOKEN)
    }
    static sendToken(status, accessToken, res) {
        return res.status(status).cookie('accessToken', accessToken, {
            // httpOnly: true
        });
    }
}
