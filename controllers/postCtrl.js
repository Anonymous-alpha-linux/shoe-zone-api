const mongoose = require('mongoose');
const { Post, Account } = require("../models");

module.exports.searchPost = async function (req, res) {
    const { query } = req.query;
    const { workspace } = req.user;

    const searchAuthorId = await Account.find({
        username: new RegExp(`^${query}`, 'i')
    }).select({ _id: 1 });
    // return Post.find()
    //     .populate({
    //         path: 'postAuthor',
    //         select: {
    //             username: 1,
    //             profileImage: 1
    //         },
    //         populate: [{
    //             path: 'role',
    //             select: { roleName: 1 },
    //         }]
    //     })
    //     .find({
    //         $or: [
    //             { content: { $regex: query, $options: 'i' }, workspace },
    //             { postAuthor: { username: { $regex: query, $option: 'i' } }, workspace }
    //         ]
    //     })
    // return Post.aggregate()
    //     .match({
    //         $or: [
    //             { content: { $regex: query, $options: "i" }, workspace },
    //             { postAuthor: searchAuthorId._id, workspace },
    //         ]
    //     })
    // .lookup({ from: 'accounts', as: 'postAuthor', localField: 'account', foreignField: 'postAuthor' }).unwind('postAuthor')
    return Post.find({
        $or: [
            {
                content: new RegExp(query, 'i'),
                workspace: workspace
            },
            {
                postAuthor: {
                    $in: searchAuthorId.map(author => author._id)
                },
                workspace: workspace
            },
        ]
    })
        .then(post => {
            return res.status(200).json({ response: post })
        })
        .catch(err => res.status(400).json({ error: err.message }))
}