const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: 4,
        max: 20,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const UserModel = new mongoose.model('User', UserSchema);

module.exports = UserModel;