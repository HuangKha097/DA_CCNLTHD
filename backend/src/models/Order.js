import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    order_userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_checkout: {
        type: Object,
        default: {}
        /*
            totalPrice,
            totalApplyDiscount,
            feeShip
        */
    },
    order_shipping: {
        type: Object,
        default: {}
        /*
            street, city, ward, country, detail,...
        */
    },
    order_payment: {
        type: Object,
        default: {}
        /*
            user_pay, method (credit/cod)
        */
    },
    order_products: {
        type: Array,
        required: true
        // Snapshot sản phẩm tại thời điểm mua
    },
    order_trackingNumber: { type: String, default: '#00001234' },
    order_status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'cancelled', 'delivered'],
        default: 'pending',
    }
}, {
    timestamps: true,
    collection: 'Orders'
});

export default mongoose.model("Order", orderSchema);