import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    inven_productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    inven_shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    inven_location: {type: String, default: 'unKnown'},
    inven_stock: {type: Number, required: true},
    inven_reservations: {type: Array, default: []}
    /* reservations lưu: [{ quantity: 1, cartId: ..., createOn: ... }] để giữ hàng khi user thêm vào giỏ nhưng chưa thanh toán
    */
}, {
    timestamps: true,
    collection: 'Inventories'
});

export default mongoose.model("Inventory", inventorySchema);