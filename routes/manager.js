var express = require('express');
const { workspaceCtrl, accountCtrl } = require('../controllers');
const { Category, Workspace, Account, Attachment } = require('../models');
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
                return Workspace.find().skip(page * count).limit(count).then(data => res.status(200).json({ response: data, message: 'Get all workspace' })).catch(error => res.status.json({ error: error.message }));
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
        let { view, option } = req.query;
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
            default:
                return res.status(501).json({
                    error: "There are no service for this query"
                });
        }
    })
    .delete(async (req, res) => {
        const { view, page = 0, filter = filter_actions,
            count = 2, id = 0, postid, commentid, accountid } = req.query;
        switch (view) {
            case 'category':
                return Category.findByIdAndRemove(commentid).then(data => res.status(200).json({ response: commentid, message: 'deleted category' })).catch(error => res.status(500).send("delete failed"))

            default:
                break;
        }
    })

module.exports = router;