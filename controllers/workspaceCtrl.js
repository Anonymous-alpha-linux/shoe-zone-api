const { Workspace, Post } = require("../models");
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
module.exports.getWorkspaceListByPage = async function (req, res) {
    const { page, count } = req.query;
    const { workspace } = req.user;
    if ([roles.ADMIN, roles.QA_MANAGER].includes(req.user.role)) {
        if (!page || !count) return res.status(401).json({ error: "Please send your request information" });
        const documentAmount = await Workspace.where().count();
        return Workspace.find()
            .skip(Number(page) * Number(count))
            .limit(Number(count))
            .then(data => {
                return res.status(200).json({
                    response: data,
                    totalWorkspace: documentAmount,
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
        .skip(Number(page) * Number(count))
        .limit(Number(count))
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
module.exports.getAssignedWorkspace = async function (req, res) {
    const { afterDay = 15 } = req.query;
    const postNumber = await Post.where({ workspace: req.user.workspace }).countDocuments();
    const newestPostNumber = await Post.where({ createdAt: { $gte: new Date((new Date().getTime() - (afterDay * 24 * 60 * 60 * 1000))) }, workspace: req.user.workspace }).countDocuments();
    return Workspace.findById(req.user.workspace).select({
        workTitle: 1,
        manager: 1,
        members: 1,
        eventTime: 1,
        expireTime: 1,
        memberNumber: { $size: "$members" }
    })
        .then(data => {
            return res.status(200).json({ response: { ...data._doc, postNumber, newestPostNumber }, message: 'get single workspace successfully' })
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
module.exports.editWorkspace = async function (req, res) {
    const { workspaceid } = req.query;
    const { workTitle, closureTime, eventTime } = req.body;
    if (!workspaceid || !workTitle || !closureTime || !eventTime) return res.status(402).json({ error: "Please send your request information" });
    try {
        const updatedWorkspace = await Workspace.findOneAndUpdate({ _id: workspaceid }, {
            workTitle: workTitle,
            expireTime: new Date(closureTime),
            eventTime: new Date(eventTime)
        });
        return res.status(200).json({ message: 'Edited workspace successfully', response: updatedWorkspace });
    }
    catch (error) {
        return res.status(500).json({ error: error });
    }
    // return Workspace.findByIdAndUpdate(workspaceid, {
    //     workTitle: workTitle,
    //     expireTime: new Date(closureTime),
    //     eventTime: new Date(eventTime)
    // }, null, (error, result, res) => {
    //     if (error) return res.status(500).json({ error: error });
    //     return res.status(202).json({ message: 'Edited workspace successfully', response: result });
    // });

}