const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    header: String,
    body: String,
    type: String,
    from: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account',
        required: true
    },
    to: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Account",
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now()         
    },
    message: {
        type: String
    },
    Url: {
        type: String
    }
})


module.exports = mongoose.model("Notification", notificationSchema);
