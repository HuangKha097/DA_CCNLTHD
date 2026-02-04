import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    cart_userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cart_state: {
        type: String,
        enum: ['active', 'completed', 'failed', 'pending'],
        default: 'active'
    },
    cart_products: {
        type: Array,
        required: true,
        default: []
        /*
        [
            {
                productId,
                shopId,
                quantity,
                name,
                price
            }
        ]
        */
    },
    cart_count_product: { type: Number, default: 0 }
}, {
    timestamps: true,
    collection: 'Carts'
});

export default mongoose.model("Cart", cartSchema);