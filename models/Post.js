const mongoose = require('mongoose');
const { } = require('.');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    categories: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Category'
    }],
    postAuthor: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    },
    postOwners: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    }],
    likedAccounts: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    }],
    dislikedAccounts: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    }],
    createdAt: {
        type: Date
    },
    updateAt: [{
        type: Date,
        default: Date.now()
    }],
    hideAuthor: {
        type: Boolean,
        default: false
    },
    comments: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Comment'
    }],
    attachments: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Attachment'
    }],
    workspace: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Workspace'
    }
})

module.exports = postSchema;