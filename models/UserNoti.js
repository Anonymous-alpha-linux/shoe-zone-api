const mongoose = require('mongoose');

const userNotifySchema = new mongoose.Schema({
    account: {
        type: mongoose.SchemaTypes.ObjectId
    },
   
})

module.exports = mongoose.model('UserNotify', userNotifySchema);