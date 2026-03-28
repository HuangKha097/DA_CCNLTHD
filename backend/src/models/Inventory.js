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

}, {
    timestamps: true,
    collection: 'Inventories'
});

inventorySchema.index({ inven_productId: 1, inven_shopId: 1 });

export default mongoose.model("Inventory", inventorySchema);