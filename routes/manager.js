var express = require('express');
const { workspaceCtrl, accountCtrl } = require('../controllers');
const { Category, Workspace, Account, Attachment, Post } = require('../models');
const { cloudinary } = require('../utils');
var router = express.Router();
let filter_actions = {
    DEFAULT: 0,
    MOST_LIKED: 1,
    MY_POST: 2,
    MY_BEST_POST: 3
}

/* GET home page. */
router.route('/')
    .get(async (req, res, next) => {
        let { view, page = 0, filter = filter_actions.DEFAULT,
            count = 2, id = 0 } = req.query;
        page = Number(page);
        count = Number(count);
        switch (view) {
            case 'workspace':
                const workspaceCount = await Workspace.count();
                return Workspace.find().skip(page * count).limit(count).then(data => res.status(200).json({ response: data, totalWorkspace: workspaceCount, message: 'Get all workspace' })).catch(error => res.status.json({ error: error.message }));
            case 'account':
                return Account.find().then(data => res.status(200).json({ response: data })).catch(error => res.status(500).send(error.message));
            case 'category':
                return Category.find().then(data => res.status(200).json({ response: data }))
                    .catch(error => res.status(401).send('Get categories failed'));
            case 'attachment':
                const attachmentCount = await Attachment.count();
                return Attachment.find().skip(page * count).limit(count)
                    .then(data => res.status(200).json({ response: data, message: 'get all attachments successfully', attachmentCount, pages: attachmentCount % count === 0 ? attachmentCount / count : Math.floor(attachmentCount / count) + 1 }))
                    .catch(error => res.status(500).json({ error: error.message }));
            case 'overview':
                try {
                    const totalWorkspace = await Workspace.count();
                    const totalPost = await Post.count();
                    const totalUser = await Account.count();
                    return res.status(200).json({
                        totalWorkspace,
                        totalPost,
                        totalUser
                    })
                } catch (error) {
                    return res.status(500).json({
                        error: error.message
                    })
                }
            case 'mostlikepost':
                return Post.aggregate()
                    .project({
                        title: 1,
                        content: 1,
                        categories: 1,
                        postAuthor: 1,
                        postOwners: 1,
                        likedAccounts: 1,
                        dislikedAccounts: 1,
                        like: { $size: "$likedAccounts" },
                        dislike: { $size: "$dislikedAccounts" },
                        createdAt: 1,
                        updatedAt: 1,
                        hideAuthor: 1,
                        comment: { $size: "$comments" },
                        attachments: 1,
                    })
                    .sort({ "like": -1, "createdAt": -1 })
                    .limit(3)
                    .lookup({ from: 'categories', as: 'categories', localField: 'categories', foreignField: '_id', })
                    .lookup({ from: 'accounts', as: 'postAuthor', localField: 'postAuthor', foreignField: '_id' })
                    .unwind('postAuthor')
                    .lookup({ from: 'accounts', as: 'postOwners', localField: 'postOwners', foreignField: '_id' })
                    .lookup({ from: 'attachments', as: 'attachments', localField: 'attachments', foreignField: '_id' })
                    .then(data => { return res.status(200).json({ response: data }) }).catch(error => res.status(500).json({ error: error.message }));
            case 'mostuser':
                return Post.aggregate()
                    .project({
                        title: 1,
                        content: 1,
                        categories: 1,
                        postAuthor: 1,
                        postOwners: 1,
                        likedAccounts: 1,
                        dislikedAccounts: 1,
                        like: { $size: "$likedAccounts" },
                        dislike: { $size: "$dislikedAccounts" },
                        createdAt: 1,
                        updatedAt: 1,
                        hideAuthor: 1,
                        comment: { $size: "$comments" },
                        attachments: 1,
                    })
                    .sort({ "like": -1, "createdAt": -1 })
                    .limit(3)
                    .lookup({ from: 'categories', as: 'categories', localField: 'categories', foreignField: '_id', })
                    .lookup({ from: 'accounts', as: 'postAuthor', localField: 'postAuthor', foreignField: '_id' })
                    .unwind('postAuthor')
                    .lookup({ from: 'accounts', as: 'postOwners', localField: 'postOwners', foreignField: '_id' })
                    .lookup({ from: 'attachments', as: 'attachments', localField: 'attachments', foreignField: '_id' })
                    .then(data => { console.log(data); return res.status(200).json({ response: data }) }).catch(error => res.status(500).json({ error: error.message }));
            case 'mostcategory':
                return Post.aggregate().unwind("categories").group({
                    _id: '$categories',
                    count: { $sum: 1 }
                })
                    .sort({ count: -1 })
                    .limit(5)
                    .lookup({ from: 'categories', as: 'categories', localField: '_id', foreignField: '_id' })
                    .unwind('categories')
                    .project({
                        count: 1,
                        name: "$categories.name"
                    })
                    .then(data => { return res.status(200).json({ response: data }) }).catch(error => res.status(500).json({ error: error.message }));
            default:
                return res.status(500).send("Don't find query");
        }
    })
    .post(async (req, res) => {
        const { view, page = 0, filter = filter_actions,
            count = 2, id = 0 } = req.query;
        let { accountId, roleId, workspace } = req.user;
        switch (view) {
            case 'workspace':
                const closureDate = new Date(Date.now());
                closureDate.setDate(closureDate.getDate() + 30);
                const eventDate = new Date(closureDate);
                eventDate.setDate(eventDate.getDate() + 7);
                const { workTitle, expireTime = closureDate, eventTime = eventDate, manager = accountId } = req.body;
                return Workspace.create({
                    workTitle,
                    expireTime,
                    eventTime,
                    manager,
                    members: accountId
                }).then(data => {
                    return res.status(200).json({
                        response: data
                    });
                }).catch(error => res.status(500).send(error.message));
            case 'category':
                const { categoryName } = req.body;
                return Category.create({
                    name: categoryName
                }).then(data => res.status(201).json({ response: data, message: 'Created category successfully' }))
                    .catch(error => res.status(500).send("Created category failed"));
            default:
                return res.status(500).send("Don't find query");
        }
    })
    .put(async (req, res) => {
        let { view, option, attachmentid } = req.query;
        const options = {
            ASSIGN_MEMBERS_TO_WORKSPACE: 0,
            SET_CLOSURE_TIME: 1,
            SET_EVENT_TIME: 2,
            GET_ALL_WORKSPACE: 3,
            ASSIGN_ROLE_TO_ACCOUNT: 6,
        }
        switch (view) {
            case 'workspace':
                if (option == options.ASSIGN_MEMBERS_TO_WORKSPACE) {
                    return workspaceCtrl.assignMembersToWorkspace(req, res);
                }
                return workspaceCtrl.assignMembersToWorkspace(req, res);
            case 'account':
                return accountCtrl.assignRoleToAccount(req, res);
            case 'attachment':
                async function clearAttachmentOnCloudinary() {
                    const { attachments } = await Post.findById(postid).exec();
                    return new Promise(resolve => {
                        Attachment.where({ _id: { $in: attachments } })
                            .then(result => {
                                return Promise.all(result.map(attach => {
                                    return new Promise((resolve) => {
                                        cloudinary.uploader.destroy(attach.fileName, { resource_type: attach.fileType.split('/')[0] }, function (error, result) {
                                            if (error) throw new Error(error);
                                            resolve(result);
                                        });
                                        removeAttachmentOnMongo(attach._id);
                                    })
                                }));
                            })
                            .then(data => {
                                resolve(data);
                            })
                            .catch(error => res.status(500).send("Cannot clear attachment from Cloudinary"));
                    })
                }
                return Attachment.findByIdAndRemove(attachmentid).then(data => res.status(200).json({
                    message: 'deleted attachment',
                })).catch(error => res.status(500).json({ error: 'This attachment cannot be deleted' }));
            default:
                return res.status(501).json({
                    error: "There are no service for this query"
                });
        }
    })
    .delete(async (req, res) => {
        const { view, page = 0, filter = filter_actions,
            count = 2, id = 0, postid, commentid, categoryid, accountid, attachmentid } = req.query;
        switch (view) {
            case 'category':
                if (!categoryid) return res.status(401).json({ error: 'Please send your categoryid' })
                return Category.findByIdAndRemove(categoryid).then(data => res.status(200).json({ response: categoryid, message: 'deleted category' })).catch(error => res.status(500).send("delete failed"));
            case 'attachment':
                // 1. Validate attachmentid parametter
                if (!attachmentid) return res.status(500).json({ error: 'Please send your attachmentid' });
                function removeAttachmentOnCloudinary(attach) {
                    return new Promise((resolve, reject) => {
                        cloudinary.uploader.destroy(attach.fileName, { resource_type: attach.fileType.split('/')[0] }, function (error, result) {
                            if (error) return res.status(500).json({ error: error.message });
                            resolve(result);
                        });
                    })
                }
                return Attachment.findByIdAndRemove(attachmentid).then(doc => {
                    removeAttachmentOnCloudinary(doc);
                    return Post.findOneAndUpdate({ attachments: { $in: attachmentid } }, { $pull: { attachments: attachmentid } });
                })
                    .catch(error => res.status(500).json({ error: "Cannot delete attachment" }))
                    .then(doc => res.status(202).json({ message: 'Deleted attachment successfully!' }))
                    .catch(err => res.status(500).json({ error: "Cannot pull attachment on post" }))
            default:
                return res.status(401).json({ error: "Not Find Your Query" })
        }
    })

module.exports = router;