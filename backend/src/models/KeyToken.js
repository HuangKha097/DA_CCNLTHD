import mongoose from 'mongoose';

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
    },
    refreshToken: { type: String, required: true }
}, {
    timestamps: true,
    collection: 'KeyTokens'
});

export default mongoose.model("KeyToken", keyTokenSchema);