const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    workTitle: {
        type: String,
        required: true,
        default: 'Anonymous'
    },
    expireTime: {
        type: Date,
        // default: new Date((new Date()).setDate(new Date(Date.now()).getDate() + 30))
    },
    eventTime: {
        type: Date,
        // default: new Date((new Date()).setDate(new Date(Date.now()).getDate() + 30))
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: false
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: false
    }],
    posts: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Post',
        required: false
    }]
});

module.exports = workspaceSchema;