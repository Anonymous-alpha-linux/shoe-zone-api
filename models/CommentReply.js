const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
    body: {
        type: String,
        required: true,
    },
    account: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account',
        required: true
    },
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
    },
    comment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Comment',
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    hideAuthor: {
        type: Boolean
    },
    likedAccounts: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    }],
    dislikedAccounts: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    }]
});

module.exports = commentSchema;