var express = require('express');
const { Role, Account } = require('../models');
var router = express.Router();

/* GET home page. */
router.route('/')
    .get(async function (req, res) {
        let { view, page = 0, count = 2, id = 0, postid, commentid, accountid } = req.query;
        switch (view) {
            case 'account':
                console.log('get account')
                return Account.find().select({
                    username: 1,
                    email: 1,
                    createdAt: 1,
                    role: 1
                })
                    .populate({ path: 'role', select: 'roleName' })
                    .then(data => res.status(200).json({ response: data, message: 'get the list of accounts successfully!' })).catch(error => res.status(500).send(error.message));
            case 'category':
                return Category.find().then(data => res.status(200).json({ response: data }))
                    .catch(error => res.status(401).send('Get categories failed'));
            default:
                return res.status(500).send("Don't find query");
        }
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