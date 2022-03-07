const mongoose = require('mongoose');

const userNotifySchema = new mongoose.Schema({
    account: {
        type: mongoose.SchemaTypes.ObjectId
    },
    notify: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Notification'
    },
    isRead: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('UserNotify', userNotifySchema);