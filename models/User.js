const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    position: {
        type: String,
        required: false,
    },
    gender: {
        type: String,
        require: false,
    },
    brithDate: {
        type: String,
        require: false,
    },
    Department: {
        type: String,
        require: false,
    },
    Contribution: {
        type: Number,
        require: false,
    },

    updatedAt: {
        type: Date,
        default: () => Date.now(),
    },
})

module.exports = mongoose.model('UserProfile',userSchema);