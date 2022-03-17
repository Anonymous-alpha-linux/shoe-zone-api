const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileFormat: String,
    fileSize: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post'
    },
    online_url: String,
    api_key: String,
    signature: String,
    downloadable: {
        type: Boolean,
        default: false
    }
})

attachmentSchema.pre(['deleteOne', 'deleteMany'], function (next) {
    this.model('Post').findOneAndRemove({ attachments: { $in: this._id } }, next());
})

module.exports = attachmentSchema;