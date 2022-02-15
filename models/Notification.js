const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    from: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Account',
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
    type: String,
})


module.exports = mongoose.model("Notification", notificationSchema);
