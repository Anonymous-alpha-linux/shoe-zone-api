var express = require('express');
const bcryptjs = require('bcryptjs');
const { roles } = require('../fixtures');
const { Role, Account, Attachment, Workspace } = require('../models');
const { isAuthorization, cloudinary, EmailService } = require('../utils');
const { accountCtrl } = require('../controllers');
var router = express.Router();

const options = {
    CHANGE_PASSWORD: 0,
    CHANGE_EMAIL: 1,
    CHANGE_USERNAME: 2,
    CHANGE_AVATAR: 3,
    CHANGE_ROLE: 4
}
/* GET home page. */
router.route('/')
    .get(async function (req, res) {
        let { view, page = 0, count = 2, id = 0, postid, commentid, accountid } = req.query;
        switch (view) {
            case 'account':
                return Account.find().select({
                    username: 1,
                    email: 1,
                    createdAt: 1,
                    role: 1,
                    profileImage: 1
                })
                    .populate({ path: 'role', select: 'roleName' })
                    .then(data => res.status(200).json({ response: data, message: 'get the list of accounts successfully!' })).catch(error => res.status(500).send(error.message));
            case 'role':
                return Role.find().select({
                    roleName: 1
                })
                    .then(data => res.status(200).json({ response: data, message: 'get the list of roles successfully!' })).catch(error => res.status(500).send(error.message));
            case 'category':
                return Category.find().then(data => res.status(200).json({ response: data }))
                    .catch(error => res.status(401).send('Get categories failed'));
            case 'workspace':
                page = Number(page);
                count = Number(count);
                return Workspace.find().skip(page * count).limit(count).then(data => res.status(200).json({ response: data, message: 'Get all workspace' })).catch(error => res.status.json({ error: error.message }));
            case 'member':
                return accountCtrl.getAccountListByWorkspaceId(req, res);
            default:
                return res.status(500).send("Don't find query");
        }
    })
    .post(async function (req, res) {
    })
    .put(async function (req, res) {
        const { view, accountid, option } = req.query;
        const files = req.files;
        switch (view) {
            case 'account':
                const { email, username, password, role = roles.STAFF, profileImage } = req.body;
                async function updateEmail(email) {
                    try {
                        // 1. Validation stage
                        if (!email)
                            return res.status(500).json({
                                error: "Please send your email"
                            });

                        const duplicateUser = await Account.findOne({ email: email }).exec();
                        if (duplicateUser)
                            return res.status(500).json({
                                error: "Email has been exist"
                            });

                        // 2. Verify Email account
                        const htmlContent = `<div>
                            <h1>VERIFY YOUR USERNAME</h1>
                            <h2>Dear ${email}!</h2><br/>
                            <p>Your account has changed its email possessors! This email using for verifying you're its owner</p>
                            <i>Any request you can call for investigate and supports by email: <b>tinhntgcd18753@fpt.edu.vn</b></i>
                        </div>`;
                        const emailServ = new EmailService(email, process.env.NODEMAILER_SENDER);
                        return emailServ.sendEmail(htmlContent).then(info => {
                            //  3. Update account by accountid got from request query
                            return Account.findByIdAndUpdate(accountid, {
                                email
                            }).then(data => res.status(202).json({
                                message: 'updated successfully!',
                                info,
                                response: data
                            })).catch(error => res.status(500).json({
                                error: error.message
                            }))
                        }).catch(error => res.status(501).send({ error: "Your email is not existed" }));
                    }
                    catch (error) {
                        res.status(501).json({ error: `Server Error: ${error.message}` })
                    }
                }
                async function updatePassword(password) {
                    // 1. Validate the password request body
                    if (!password) {
                        return res.status(200).json({ error: "Please send your password" });
                    }
                    const { email: accountEmail } = await Account.findById(accountid).exec();
                    //  2. Send email
                    const htmlContent = `<div>
                            <h1>VERIFY YOUR PASSWORD CHANGE</h1>
                            <h2>Dear ${accountEmail}!</h2><br/>
                            <p>Your account has changed its password! This email using for verifying you're its owner</p>
                            <i>Any request you can call for investigate and supports by email: <b>tinhntgcd18753@fpt.edu.vn</b></i>
                        </div>`;
                    const emailService = new EmailService(accountEmail, process.env.NODEMAILER_SENDER);
                    return emailService.sendEmail(htmlContent).then(async info => {
                        // 3. Update new password to account
                        return await Account.findByIdAndUpdate(accountid, {
                            hashPassword: await bcryptjs.hash(password, 10)
                        }).then(data => res.status(202).json({
                            message: 'Update account password successfully!',
                            info,
                            response: data
                        })).catch(error => res.status(500).json({
                            error: "Password has failed to change"
                        }));
                    }).catch(error => res.status(501).send({ error: "Your email is not existed" }));
                }
                async function updateUsername(username) {
                    // 1. Validate the password request body
                    if (!username) {
                        return res.status(200).json({ error: "Please send your username" });
                    }
                    const { email: accountEmail } = await Account.findById(accountid).exec();
                    //  2. Send email
                    const htmlContent = `<div>
                            <h1>VERIFY YOUR USERNAME CHANGE</h1>
                            <h2>Dear <b>${accountEmail}!</b></h2><br/>
                            <p>Your account has changed its username to <b>"${username}"</b>! This email using for verifying you're its owner</p>
                            <i>Any request you can call for investigate and supports by email: <b>tinhntgcd18753@fpt.edu.vn</b></i>
                        </div>`;
                    const emailService = new EmailService(accountEmail, process.env.NODEMAILER_SENDER);
                    return emailService.sendEmail(htmlContent).then(async info => {
                        // 3. Update new password to account
                        return Account.findByIdAndUpdate(accountid, {
                            username
                        }).then(data => res.status(202).json({
                            message: "Update account\'s username successfully!",
                            info,
                            response: data
                        })).catch(error => res.status(500).json({
                            error: "Username has failed to change"
                        }));
                    }).catch(error => res.status(501).send({ error: "Your username is not existed" }));
                }
                async function updateAvatar(image) {
                    function createFolderOnCloudinary() {
                        return new Promise((resolve, reject) => {
                            cloudinary.api.create_folder(`CMS_STAFF/[${role.toUpperCase()}]-${email}`, {
                            }, (error, result) => {
                                if (error) reject(error);
                                resolve(result);
                            })
                        })
                    }
                    function uploadImageToCloudinaryFolder(folder) {
                        const { path, name } = folder;

                        return new Promise((resolve, reject) => {
                            // let fileExtension = /[^.]+$/.exec(file.originalname);
                            cloudinary.uploader.upload(image.path, {
                                folder: path,
                                filename_override: `Avatar`,
                                use_filename: true,
                                unique_filename: false,
                                resource_type: 'auto',
                                // format: fileExtension[0]
                            }, function (error, result) {
                                if (error) {
                                    return reject(error);
                                }
                                resolve(result);
                            });
                        });
                    }
                    // 1. Validate the image request body
                    if (!image) {
                        return res.status(400).json({ error: "Please send your image" });
                    }
                    // 2. Create attachment for avatar resource 
                    return createFolderOnCloudinary().then(folder => uploadImageToCloudinaryFolder(folder)).then(image => {
                        // 3. Update new password to account
                        return Account.findByIdAndUpdate(accountid, {
                            profileImage: image.url || 'https://laptrinhcuocsong.com/images/anh-vui-lap-trinh-vien-7.png'
                        }).then(data => res.status(202).json({
                            message: "Update account\'s avatar successfully!",
                            response: data,
                            image
                        })).catch(error => res.status(500).json({
                            error: "Avatar has failed to change",
                            message: error.message
                        }));
                    }).catch(error => res.status(500).json({ error: `Server Error: ${error.message}` }))
                }
                async function updateRole(role) {
                    // 1. Validate the role request body
                    if (!role) {
                        throw new Error("Please send your role");
                    }
                    // 2. Check if request input is ObjectId or string role
                    const isAbsoluteRoleName = Object.entries(roles).some(([key, value]) => value === role);
                    let assignedRole;
                    if (isAbsoluteRoleName) {
                        assignedRole = await Role.findOne({ roleName: role }).exec();
                    }
                    else if (!isAbsoluteRoleName) {
                        assignedRole = await Role.findById(role).exec();
                    }
                    const { email: accountEmail, role: { roleName: accountRole } } = await Account.findById(accountid).populate({ path: 'role', select: { _id: 0, roleName: 1 } }).exec();
                    //  2. Send email
                    const htmlContent = `<div>
                            <h1>VERIFY YOUR ROLE CHANGE</h1>
                            <h2>Dear <b>${accountEmail}!</b></h2><br/>
                            <p>Your account has been upgraded from ${accountRole} to <b>"${assignedRole.roleName}"</b>! This email using for verifying you're its owner</p>
                            <i>Any request you can call for investigate and supports by email: <b>tinhntgcd18753@fpt.edu.vn</b></i>
                        </div>`;
                    const emailService = new EmailService(accountEmail, process.env.NODEMAILER_SENDER);
                    return emailService.sendEmail(htmlContent).then(async info => {
                        // 3. Update new password to account
                        return Account.findByIdAndUpdate(accountid, {
                            role: assignedRole._id
                        }).then(data => res.status(202).json({
                            message: "Update account\'s role successfully!",
                            info,
                            response: {
                                ...data,
                                role: assignedRole
                            }
                        })).catch(error => res.status(500).json({
                            error: "Role has failed to change"
                        }));
                    }).catch(error => res.status(501).send({ error: "Your specification is not existed" }));
                }
                try {
                    // 1. Validate email and password input are empty
                    if (option == options.CHANGE_USERNAME) {
                        return updateUsername(username);
                    }
                    else if (option == options.CHANGE_EMAIL) {
                        return updateEmail(email);
                    }
                    else if (option == options.CHANGE_PASSWORD) {
                        return updatePassword(password);
                    }
                    else if (option == options.CHANGE_AVATAR) {
                        return updateAvatar(files[0]);
                    }
                    else if (option == options.CHANGE_ROLE) {
                        return updateRole(role);
                    }
                } catch (error) {
                    return res.status(500).send("Server Error: " + error.message);
                }
            default:
                return res.status(501).send("There are no service for this query!");
        }
    })
    .delete(async function (req, res) {
        const { accountid } = req.query;

        return Workspace.findOneAndUpdate({ members: { $in: accountid }, manager: { $eq: accountid } }, {
        }, null, (error, doc) => {
            if (error) return res.status(500).json({ error: 'You cannot delete account from here!' });
            return Account.findByIdAndRemove(accountid).then(data => res.status(204).json({
                message: 'Deleted account successfully',
                ok: true,

            })).catch(error => res.status(500).json({
                error: error.message
            }));
        })
    });


// router.post('/manage/createRole', async function (req, res, next) {
//     const { roleName } = req.body;
//     try {
//         const duplicateRole = await Role.findOne({ roleName }).exec();

//         if (!roleName) throw new Error('Please input role name');
//         if (duplicateRole) throw new Error({
//             status: 400,
//             message: 'This name has been duplicated'
//         })

//         const newRole = await Role.create({
//             roleName: roleName
//         });

//         res.send({
//             message: "Created Role"
//         })
//     } catch (er) {
//         res.send({
//             error: er.message
//         })
//     }
// })

module.exports = router;