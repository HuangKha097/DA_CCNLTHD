const mongoose = require('mongoose')

const inventorySchema = new mongoose.Schema({
    iven_productId:{

    },
    iven_shopId: {},
    iven_location: {
        type: String,
        required: true,
    },
    iven_stock: {
        type: Number,
        required: true,
    },
    iven_reservations:{
        type: Array,
        required: true,
    }
})

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;