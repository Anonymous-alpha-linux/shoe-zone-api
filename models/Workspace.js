const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
    workTitle: {
        type: String,
        required: true,
        default: 'Anonymous'
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