const mongoose = require('mongoose')

const cartSchema =new mongoose.Schema({
    cart_userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cart_state:{
        type: String,
    },
    cart_products:{
        type: Array
    }
})

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;