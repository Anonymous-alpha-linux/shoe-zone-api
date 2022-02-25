const mongoose = require('mongoose');
const { } = require('.');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    category: [{
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
    comment: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Comment'
    }],
    attachment: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Attachment'
    }]
})

module.exports = postSchema;