const mongoose = require('mongoose');

// Sub-document cho Address
const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    country: String,
    ward: String,
    details: String,
    isDefault: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: {
        type: [String],
        enum: ['admin', 'user', 'vendor'],
        default: ['user']
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'block'],
        default: 'active'
    },
    address: {
        type: [addressSchema],
        default: []
    },
    avatar: { type: String },
}, {
    timestamps: true,
    collection: 'Users'
});

module.exports = mongoose.model("User", userSchema);