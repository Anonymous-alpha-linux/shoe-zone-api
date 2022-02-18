const { Schema, model } = require('mongoose');

const roleSchema = new Schema({
    roleName: {
        type: String,
        required: true
    }
})

module.exports = roleSchema;