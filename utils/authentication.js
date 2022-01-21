const Token = require('./token');
const { Account, Role } = require('../models');

module.exports = async function isAuthentication(req, res, next) {
    const authorization = req.headers.authorization;
    console.log('authorization', authorization);
    try {
        if (!authorization) throw new Error("Logined first!");

        const token = authorization.split(' ')[1];
        if (!token) throw new Error("Token is expired!");

        const tokenData = Token.verifyToken(token);

        console.log('token data:', tokenData);
        const account = await Account.findById(tokenData.id);
        const role = await Role.findById(tokenData.roleId);

        req.user = {
            account: account.username,
            role: role.roleName,
            accessToken: token
        }

        next();
    }
    catch (err) {
        res.json({
            isLoggedIn: false,
            success: false,
            error: 'Not Auth: ' + err.message,
        })
    }
}