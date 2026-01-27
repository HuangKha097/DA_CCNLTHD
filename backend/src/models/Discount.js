const mongoose = require('mongoose')

const discountSchema = new mongoose.Schema({
    discount_shop: {
        type: mongoose.Schema.Type.ObjectId,
        ref: 'Shop',
        required: true,
    },
    discount_code: {
        type: String,
        required: true,
    },
    discount_value: {
        type: Number,
        required: true,
    },
    discount_type: {
        type: String,
        required: true,
    },
    discount_start_date: {
        type: Date,
        required: true,
    },
    discount_end_date: {
        type: Date,
        required: true,
    },
    discount_max_users: {
        type: Number,
        required: true,
        default: 0,
    },
    discount_users_used: {
        type: Array,
        required: true,
        default: []
    }
})

const Discount = mongoose.model("Discount", discountSchema);
module.exports = Discount;