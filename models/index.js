const { model } = require('mongoose');
module.exports = {
    Account: model('Account', require('./Account')),
    UserProfile: model('UserProfile', require('./User')),
    Role: model('Role', require('./Role')),
    Workspace: model("Workspace", require('./Workspace')),
    Post: model('Post', require('./Post')),
    Attachment: model('Attachment', require('./Attachment')),
    Category: model("Category", require('./Category')),
    Notification: model("Notification", require('./Notification')),
    UserNotify: require('./UserNoti')
}