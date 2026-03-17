import Review from "../models/Review.js";
import Product from "../models/Product.js";

const createReview = async (req, res) => {
    try {
        const { productId, userId, content, rating, images = [] } = req.body;

        if (!productId || !userId || !content || !rating) {
            return res.status(400).json({
                status: 'error',
                message: "Missing required fields"
            });
        }

        const newReview = await Review.create({
            review_productId: productId,
            review_userId: userId,
            review_content: content,
            review_rating: rating,
            review_images: images
        });

        // Update product ratings average (Simplified for now)
        const reviews = await Review.find({ review_productId: productId });
        const avgRating = reviews.reduce((acc, curr) => acc + curr.review_rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(productId, {
            product_ratingsAverage: avgRating
        });

        return res.status(201).json({
            status: 'success',
            message: "Review created successfully",
            metadata: newReview
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ review_productId: productId })
            .populate('review_userId', 'name avatar')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            status: 'success',
            message: "Reviews fetched successfully",
            metadata: reviews
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export {
    createReview,
    getReviewsByProduct
};
