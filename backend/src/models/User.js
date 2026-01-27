const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    ward: String,
    isDefault: Boolean,
})

const userSchema = new mongoose.Schema(
    {
        name: { type:String},
        email: { type: String },
        password: {type: String, required:true },
        role: { type: String, enum: ['admin', 'user', "vendor"] },
        address:{
            type: addressSchema,
            required: true,
        },
        key_token: { type: String },
        status: { type: String, enum: ['active', 'inactive'] },
        avatar: { type: String },
    },
    {
        // se co thoi gian tao va update
        timestamps: true
    }
)

const User = mongoose.model("User", userSchema);
module.exports = User;