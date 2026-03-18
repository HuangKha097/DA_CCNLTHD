import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    review_productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    review_userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    review_content: {
        type: String,
        required: true
    },
    review_rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review_images: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
    collection: 'Reviews'
});

export default mongoose.model("Review", reviewSchema);
