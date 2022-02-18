const mongoose = require('mongoose');
const { } = require('.');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Category'
    }],
    account: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account'
    }],
    like: Number,
    dislike: Number,
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