const mongoose = require('mongoose')

const shopSchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
    },
    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    verified:{
        type: Boolean,
        default: false
    },
    logo:{

    },
    coverInfo:{

    }
})

const Shop = mongoose.model("Shop", shopSchema);
module.exports = Shop;