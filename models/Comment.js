const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        require: false,
        ref: "UserProfile",
    },
    content: {
        type: String,
        required: true,
    }
})

module.exports = mongoose.model('Comment', commentSchema);