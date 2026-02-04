import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    verified: {
        type: Boolean,
        default: false
    },
    logo: { type: String, default: '' },
    coverInfo: { type: String, default: '' }
}, {
    timestamps: true,
    collection: 'Shops'
});

export default mongoose.model("Shop", shopSchema);