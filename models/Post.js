const mongoose = require('mongoose');



const postSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        require: false,
        ref: "UserProfile",
    },

    title: {
        type: String,
        require: true,
    },

    content: {
        type: String,
        require: false,
        lowercase: true,
    },

    thumbUp: {
        type: Number,
        require: false,
    },

    thumDown: {
        type: Number,
        require: false,
    },

    comment: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: 'Comment',
    },
    
    postedDate: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    },
})

module.exports = mongoose.model('Post',postSchema);