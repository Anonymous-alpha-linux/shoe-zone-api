const { Account, Workspace } = require("../models");

module.exports.getAccountListByWorkspaceId = async function (req, res) {
    const { workspaceid } = req.query;
    const { members } = await Workspace.findById(workspaceid).exec();
    return Account.aggregate().match({ _id: { $in: members } })
        .then(data => res.status(200).json({ response: data, message: `get account list by workspace id: ${workspaceid}` }))
        .catch(error => res.status(500).json({ error: error.message }));
}
module.exports.assignRoleToAccount = async function (req, res) {
    const { role } = req.body;
    return Account.findByIdAndUpdate(accountid, {
        role: role
    }).then(data => res.status(200).json({
        message: 'assign',
        response: data
    })).catch(error => res.status(500).json({
        error: error.message
    }))
}