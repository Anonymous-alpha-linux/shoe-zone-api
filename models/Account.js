// const mongo = require('mongodb');
// const { MongoContext } = require('../config');
const { Schema, model, SchemaTypes } = require('mongoose');

const accountSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    hashPassword: {
        type: String,
        required: true,
    },
    profileImage: {
        type: String,
        default: 'https://laptrinhcuocsong.com/images/anh-vui-lap-trinh-vien-7.png',
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        require: true,
    },
    workspace: {
        type: SchemaTypes.ObjectId,
        ref: 'Workspace',
        required: false,
        default: '61f7bc0f4116f253caf86586'
    },
    // notifications: [{
    //     isRead: {
    //         type: Boolean,
    //         default: false
    //     },
    //     notification: {
    //         type: SchemaTypes.ObjectId,
    //         ref: 'Notification',
    //         required: true
    //     }
    // }],
    newNotification: { type: Boolean, default: false },
    refreshToken: String,
}, {
    timestamps: true
});

module.exports = accountSchema;

