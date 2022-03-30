const { UserProfile, Workspace, Account } = require('../models');

module.exports.getManagerProfile = async function (req, res) {
    const { managerid } = req.query;
    const { workspace } = req.user;
    if (!managerid) return res.status(400).json({ error: 'Please send your request information' });
    const foundWorkspace = await Workspace.findById(workspace).exec();

    return UserProfile.findOne({ account: foundWorkspace._doc.manager }, '', {
        select: { _id: 0, address: 1, age: 7, firstName: 1, lastName: 1, phone: 1, gender: 1, introduction: 1 }
    }).then(data => {
        return res.status(200).json({ response: data });
    }).catch(error => res.status(402).send(error.message));
}
module.exports.getMyProfile = function (req, res) { }
module.exports.getProfileById = async function (req, res) {
    const { accountid } = req.query;
    if (!accountid) return res.status(400).json({ error: 'send your request information' });

    const foundAccount = await Account.findById(accountid, "", {
        select: { profileImage: 1, username: 1, email: 1, role: 1 },
        populate: { path: 'role', select: { _id: 0, roleName: 1 } }
    }).exec();
    const foundProfile = await UserProfile.findOne({ account: accountid }).exec();

    const promise = Promise.all([foundAccount, foundProfile]);

    return promise.then(data => {
        const [foundAccount, foundProfile] = data;
        return res.status(200).json({ message: 'get user profile successfully', response: { ...foundProfile._doc, ...foundAccount._doc } });
    }).catch(error => res.status(500).json({ error: 'Get profile failed!' }));
}