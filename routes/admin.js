var express = require('express');
const { Role } = require('../models');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.send('this is admin bookmark');
});


router.post('/manage/createRole', async function (req, res, next) {
    const { roleName } = req.body;
    try {
        const duplicateRole = await Role.findOne({ roleName }).exec();

        if (!roleName) throw new Error('Please input role name');
        if (duplicateRole) throw new Error({
            status: 400,
            message: 'This name has been duplicated'
        })

        const newRole = await Role.create({
            roleName: roleName
        });

        res.send({
            message: "Created Role"
        })
    } catch (er) {
        res.send({
            error: er.message
        })
    }
})


router.post('/manage/')
module.exports = router;