const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    order_userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_checkout:{

    },
    order_shipping:{

    },
    order_payment:{

    },
    order_products:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
        required: true
    },
    order_status:{
        type: String,
        enum: ['pending', 'cancel', "shipping", "complete"],
        default: 'pending',
    }

})

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;