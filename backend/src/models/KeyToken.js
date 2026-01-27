const mongoose = require('mongoose');

const keyTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    publicKey: { type: String, required: true },
    privateKey: { type: String, required: true },
    refreshTokensUsed: {
        type: Array,
        default: []
    }, // Những token đã sử dụng
    refreshToken: { type: String, required: true } // Token hiện tại đang dùng
}, {
    timestamps: true,
    collection: 'KeyTokens'
});

module.exports = mongoose.model("KeyToken", keyTokenSchema);