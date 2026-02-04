import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    product_shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    product_name: {type: String, required: true},
    product_price: {type: Number, required: true},
    product_description: {type: String},
    product_quantity: {type: Number, required: true},
    product_type: {
        type: String,
        required: true,
        enum: [
            'Electronics',   // Điện tử (Điện thoại, Laptop...)
            'Clothing',      // Thời trang (Quần áo)
            'Furniture',     // Nội thất
            'Footwear',      // Giày dép
            'Accessories',   // Phụ kiện (Đồng hồ, Kính mắt, Trang sức)
            'Beauty',        // Làm đẹp (Mỹ phẩm, Skincare)
            'Health',        // Sức khỏe (Thực phẩm chức năng, Dụng cụ y tế)
            'Sports',        // Thể thao & Dã ngoại
            'Toys',          // Đồ chơi & Mẹ bé
            'Books',         // Sách & Văn phòng phẩm
            'Groceries',     // Bách hóa (Đồ ăn, Thức uống)
            'Automotive',    // Ô tô & Xe máy
            'Pet',           // Chăm sóc thú cưng
            'Appliances',    // Thiết bị gia dụng (Tủ lạnh, Máy giặt...)
            'Other'          // Khác
        ]
    },
    product_attributes: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    product_thumb: {type: String, required: true},
    product_images: {type: [String], default: []},
    product_ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be above 5.0'],
        set: (val) => Math.round(val * 10) / 10
    },
    isPublished: {type: Boolean, default: true}
}, {
    timestamps: true,
    collection: 'Products'
});

export default mongoose.model("Product", productSchema);