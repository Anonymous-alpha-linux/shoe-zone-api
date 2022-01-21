// const mongo = require('mongodb');
// const { MongoContext } = require('../config');
const { Schema, model } = require('mongoose');
// class Account {
//     constructor(username, email, password) {
//         this.username = username;
//         this.email = email;
//         this.hashPassword = password;
//     }
//     save() {
//         const db = MongoContext.getDb();
//         console.log(db.collection('accounts').)
//     }
// }

const accountSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
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
    refreshToken: String,
}, {
    timestamps: true
})

const Account = model('Account', accountSchema);
module.exports = Account;

