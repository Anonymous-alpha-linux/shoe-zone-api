const { Post } = require("../models");

module.exports.searchPost = async function (req, res) {
    const { query } = req.query;
    return Post.find({ content: { $regex: query, $options: 'i' } })
        .then(post => {
            console.log(post);
            return res.status(200).json({ response: post })
        })
        .catch(err => res.status(400).json({ error: err }))
}