const { Workspace } = require("../models");
const { roles } = require("../fixtures");
const mongoose = require('mongoose');

module.exports.getAllWorkspace = function (req, res) {
    if ([roles.ADMIN, roles.QA_MANAGER].includes(req.user.role)) {
        return Workspace.find().then(data => res.status(200).json({
            response: data,
            message: 'get all workspace items'
        })).catch(error => res.status(400).json({
            error: error.message
        }));
    }
    else {
        return res.status(403).json({
            error: 'You\'re not authorized for this feature'
        })
    }
}
module.exports.getWorkspaceListByPage = function (req, res) {
    const { page, count } = req.query;
    if ([roles.ADMIN, roles.QA_MANAGER].includes(req.user.role)) {
        const documentAmount = Workspace.count();
        return Workspace.find()
            .skip(Number(page) * Number(count))
            .limit(Number(count))
            .then(data => {
                return res.status(200).json({
                    response: data,
                    pages: documentAmount / count,
                    message: 'get all workspace items',
                });
            })
            .catch(error => res.status(400).json({
                error: error.message
            }));
    }
    return Workspace.aggregate()
        .match({ members: { $in: [mongoose.Types.ObjectId(req.user.accountId)] } })
        .then(data => {
            return res.status(200).json({
                response: data
            });
        })
        .catch(error => res.status(400).json({ message: error.message }));
}
module.exports.getWorkspaceByMemberID = function (req, res, memberId) {
    return Workspace.where({ members: memberId }).then(data => res.status(200).json({
        response: data,
        message: `get all workspace by _id account: ${memberId}`
    })).catch(error => res.status(400).json({
        error: error.message
    }));
}
module.exports.getWorkspaceByDate = function (req, res) {
    return Workspace.findOne({}).then(data => res.status(200).json({
        message: 'get workspace list by date'
    })).catch(error => res.status(500).json({
        error: error.message
    }))
}
module.exports.getAssignedWorkspace = function (req, res) {
    return Workspace.findById(req.user.workspace)
        .then(data => {
            return res.status(200).json({ response: data, message: 'get single workspace successfully' })
        })
        .catch(error => res.status(500).json({ error: error.message }));
}
module.exports.assignWorkspaceManager = async function (req, res) {
    const { workspaceid } = req.query;
    const { accountid } = req.body;
    if (!workspaceid && !accountid) return res.status(401).json({ error: 'Please send your workspaceid' });
    const foundWorkspace = await Workspace.where(workspaceid).findOne({ members: { $in: req.user.accountId } }).exec();
    if (!foundWorkspace) return res.status(401).json({ error: "This workspaceid or your account cannot be included" });

    return Workspace.findByIdAndUpdate(workspaceid, { manager: accountid })
        .then(data => res.status(200).json({ message: "Update workspace manager successfully!", response: data }))
        .catch(error => res.status(500).json({ error: "Cannot get data" }));
}
module.exports.assignMembersToWorkspace = function (req, res) {
    const { accounts } = req.body;
    if (!Array.isArray(accounts)) {
        return res.status(406).json({
            error: "Your request payload \"accounts\" is not array",
        });
    }
    if (accounts.some(acc => typeof acc !== 'string')) {
        return res.status(406).json({
            error: "Your request payload \"accounts\" contains value isn't a valid value"
        });
    }

    return Workspace.findByIdAndUpdate({
        members: accounts
    }).then(data => res.status(200).json({
        response: data,
        message: `Added members to workspace ${data._id} successfully!`
    }));
}
module.exports.assignMemberToWorkspace = function (req, res) {
    const { workspaceid } = req.query;
    const { accountid } = req.body;
    if (!workspaceid || !accountid) return res.status(401).json({ error: 'Send your request information' });
    return Workspace.findByIdAndUpdate(workspaceid, {
        $addToSet: {
            members: accountid
        }
    }).then(data => {
        return res.status(201).json({ message: 'Assigned member to workspace successfully!', response: data });
    }).catch(error => {
        return res.status(500).json({
            error: error.message
        });
    })
}
module.exports.unassignMemberToWorkspace = function (req, res) {
    const { workspaceid } = req.query;
    const { accountid } = req.body;
    if (!workspaceid || !accountid) return res.status(401).json({ error: 'Send your request information' });
    return Workspace.findByIdAndUpdate(workspaceid, {
        $pull: {
            members: accountid
        }
    }).then(data => {
        return res.status(201).json({ message: 'Unassigned member from workspace successfully!', response: data });
    }).catch(error => {
        return res.status(500).json({
            error: error.message
        });
    })
}