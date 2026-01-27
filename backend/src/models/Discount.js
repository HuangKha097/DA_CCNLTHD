const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    discount_shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    discount_code: { type: String, required: true },
    discount_value: { type: Number, required: true }, // Giá trị giảm
    discount_type: {
        type: String,
        enum: ['fixed_amount', 'percentage'],
        default: 'fixed_amount'
    },
    discount_start_date: { type: Date, required: true },
    discount_end_date: { type: Date, required: true },
    discount_max_uses: { type: Number, required: true }, // Tổng số lần mã có thể dùng
    discount_users_used: { type: Array, default: [] }, // Ai đã dùng
    discount_max_uses_per_user: { type: Number, default: 1 }, // Mỗi người được dùng mấy lần
    discount_min_order_value: { type: Number, required: true },
    is_active: { type: Boolean, default: true }
}, {
    timestamps: true,
    collection: 'Discounts'
});

module.exports = mongoose.model("Discount", discountSchema);