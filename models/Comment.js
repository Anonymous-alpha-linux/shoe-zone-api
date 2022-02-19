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
    like: Number,
    dislike: Number
});

module.exports = mongoose.model('Comment', commentSchema);