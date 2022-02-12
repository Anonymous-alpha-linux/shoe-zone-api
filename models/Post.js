const mongoose = require('mongoose');

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
    attachment: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Attachment'
    }]
})

module.exports = mongoose.model('Post', postSchema);