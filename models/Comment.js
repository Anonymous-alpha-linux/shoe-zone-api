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
    createdAt: {
        type: Date,
        default: Date.now()
    },
    hideAuthor: {
        type: Boolean
    },
    like: Number,
    dislike: Number,
    likedAccounts: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    }],
    dislikedAccounts: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    }],
    replies: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Comment'
    }]
});

module.exports = commentSchema;