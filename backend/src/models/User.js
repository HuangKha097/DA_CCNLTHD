import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    street: {type: String, required: true},
    city: {type: String, required: true},
    country:{type: String, required: true},
    ward:{type: String, required: true},
    details: String,
    phone: String,
    district: String,
    isDefault: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
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
    coins: { type: Number, default: 0 },
    lastCheckIn: { type: Date },
    lastGamePlay: { type: Date },
    lastArcadePlay: { type: Date },
}, {
    timestamps: true,
    collection: 'Users'
});

userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);