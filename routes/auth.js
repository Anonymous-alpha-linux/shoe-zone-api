const bcryptjs = require('bcryptjs');
var express = require('express');
const { Account, Role } = require('../models');
const { emailService, isAuthentication, isAuthorization, Token } = require('../utils');
// const { emailService } = require('../utils');
var router = express.Router();
/* GET home page. */
router.get('/', isAuthentication, (req, res) => {

    if (req.user) return res.status(200).json({
        isLoggedIn: true,
        success: true,
        ...req.user
    });

    return res.status(200).json({
        isLoggedIn: false,
        success: false,
        message: "Login First for authentication"
    });
});

router.route('/register')
    .post(async function (req, res) {
        const { email, username, password, role = "customer", profileImage } = req.body;
        try {
            // 1. Validate email and password input are empty
            if (!email) throw new Error("Fullfill your email");
            if (!password) throw new Error("Please input your password");


            const duplicateUser = await Account.findOne({ email: email }).exec();
            const assignedRole = await Role.findOne({ roleName: role }).exec();
            // 2. Validate user is duplicate and role is existed
            if (duplicateUser) throw new Error("User has been exist");
            if (!assignedRole) throw new Error("There are no capable role to authorize");

            // 3. Create and save new Account to database
            const newAccount = await Account.create({
                username: username,
                hashPassword: await bcryptjs.hash(password, 10),
                email: email,
                profileImage: profileImage || 'https://laptrinhcuocsong.com/images/anh-vui-lap-trinh-vien-7.png',
                role: assignedRole && assignedRole._id,
            });

            // 4. Send email for confirmation
            // const emailService = new emailService(email, 'Nodemailer Service Testing');

            // await emailService.send();

            // 5. Create a new Token and send to user for the further authentication
            let token = new Token({
                id: newAccount._id,
                roleId: newAccount.role._id
            });

            let accessToken = token.createToken();

            Token.sendToken(201, accessToken, res).json({
                isLoggedIn: true,
                success: true,
                message: 'User has been created',
                accessToken,
                account: newAccount.username,
                role: role
            })

        } catch (err) {
            res.send({
                isLoggedIn: false,
                success: false,
                error: err.message,
            })
        }
    });


router.route('/login')
    .get(function (req, res) {

        if (req.user) {

            return res.status(200).json({
                isLoggedIn: true,
                ...req.user,
            });
        }

        return res.json({
            message: "Login first",
        })
    })
    .post(async function (req, res, next) {
        const { email, password } = req.body;
        try {
            // 1. Validate email, username, password is empty 
            if (!email) throw new Error("Fullfill your email");
            if (!password) throw new Error("Please input your password");

            // 2. Validate user is existed
            const user = await Account.findOne({ email: email }).exec();
            const role = await Role.findOne({ id: user.role._id }).exec();
            if (!user) throw new Error("Maybe you forgot username or password");

            // 3. Validate the log user password is capable
            const isCapable = await bcryptjs.compare(password, user.hashPassword);
            if (!isCapable) throw new Error("your password is incorrect");
            // 4. Create a new token and send to user for the further authentication
            let token = new Token({
                id: user._id,
                roleId: user.role._id
            });

            let accessToken = token.createToken();



            return res.status(200).cookie('accessToken', accessToken, {
                httpOnly: true,
            }).json({
                isLoggedIn: true,
                success: true,
                message: "Login successfully",
                accessToken,
                account: user.username,
                role: role.roleName
            });
            // Token.sendToken(200, accessToken, res).json({
            //     isLoggedIn: true,
            //     success: true,
            //     message: "Login successfully",
            //     accessToken
            // });

        } catch (err) {
            res.send({
                isLoggedIn: false,
                success: false,
                error: err.message,
            })
        }
    })

router.route('/logout').get(async function (req, res, next) {

    res.clearCookie('accessToken', {
        httpOnly: true
    });

    res.status(200).json({
        isLoggedIn: false,
        success: true,
        message: 'Logout',
    })
})

router.post('/forgot', async function (req, res, next) {
    const { email, newPassword } = req.body;
    try {
        const user = await Account.findOne({ email: email }).exec();
        if (!user) throw new Error("Maybe you forgot username or password");

        const isCapable = await bcryptjs.compare(password, user.hashPassword);
        if (!isCapable) throw new Error("your password is incorrect");

        res.send({
            message: "Login successfully"
        })
    } catch (err) {
        res.send({
            error: err.message
        })
    }
})

// router.route('/protected').get(isAuthentication, isAuthorization('admin', 'staff'), async function (req, res, next) {
//     try {
//         res.send({
//             isLoggedIn: true,
//             success: true,
//             message: 'Access to route'
//         })
//     } catch (e) {
//         res.send({
//             success: false,
//             error: err.message,
//         })
//     }
// })
module.exports = router;
