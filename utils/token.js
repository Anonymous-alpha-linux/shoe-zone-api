let jwt = require('jsonwebtoken');

class Token {
    constructor(payload) {
        this.payload = payload;
    }

    createToken() {
        return jwt.sign(this.payload, process.env.JSON_SECRETE_TOKEN, {
            expiresIn: 60 * 60 * 24,
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
        console.log('send token');
        return res.status(status).cookie('accessToken', accessToken, {
            httpOnly: true,
        });
    }
    static sendRefreshToken(req, res, next) { }
}

module.exports = Token;
