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
    fileSize: {
        type: Number,
        required: true
    },
    downloadable: {
        type: Boolean,
        default: false
    }
})

module.exports = attachmentSchema;