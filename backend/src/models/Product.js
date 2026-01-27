const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    product_shop:{

    },
    product_name:{
        type:String,
        required:true
    },
    product_price:{
        type:Number,
        required:true
    },
    product_description:{
        type:String,
        required:true
    },
    product_quantity:{
        type:Number,
        required:true
    },
    product_type: {
        type: String,
        required: true
    },
    product_attribute:{

    },
    product_thumb:{

    },
    product_images:{

    },
    product_ratingsAverage:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    }
})

const Product = mongoose.model("Product", productSchema);
module.exports = Product;