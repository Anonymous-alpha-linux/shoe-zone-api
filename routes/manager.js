var express = require('express');
const { Category } = require('../models');
var router = express.Router();

/* GET home page. */
router.route('/')
    .get((req, res, next) => {
        let { view, page = 0, filter = filter_actions.DEFAULT,
            count = 2, id = 0, postid, commentid, accountid } = req.query;
        switch (view) {
            case 'category':
                return Category.find().then(data => res.status(200).json({ response: data }))
                    .catch(error => res.status(401).send('Get categories failed'));
            default:
                return res.status(500).send("Don't find query");
        }
    })
    .post(async (req, res) => {
        let { view, page = 0, filter = filter_actions.DEFAULT,
            count = 2, id = 0, postid, commentid, accountid } = req.query;
        switch (view) {
            case 'category':
                const { categoryName } = req.body;
                return Category.create({
                    name: categoryName
                }).then(data => res.status(201).json({ response: data, message: 'Created category successfully' }))
                    .catch(error => res.status(500).send("Created category failed"));
            default:
                break;
        }
    })

module.exports = router;