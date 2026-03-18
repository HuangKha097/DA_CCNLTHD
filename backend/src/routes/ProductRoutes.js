import express from "express";

import {
    createProduct,
    updateProduct,
    publishProduct,
    unpublishProduct,
    getDraftProducts,
    getPublishedProducts,
    deleteProduct,
    getAllShopProducts,
    getAllProducts,
    getProductDetail,
    getRelatedProducts,
    searchProducts,
    filterProducts
} from "../controllers/ProductController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();

// --- PUBLIC ROUTES (User/Guest) ---
router.get('/all', getAllProducts);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/:productId', getProductDetail);
router.get('/related/:productId', getRelatedProducts);
router.get('/published/all/:shopId', getPublishedProducts); // Public access for shop page

// --- PRIVATE ROUTES (Shop/Vendor) ---
router.post('/create', authenToken, createProduct);
router.put('/:productId', authenToken, updateProduct);
router.delete('/:productId', authenToken, deleteProduct);

router.patch('/publish/:productId', authenToken, publishProduct);
router.patch('/unpublish/:productId', authenToken, unpublishProduct);

router.get('/drafts/:shopId', authenToken, getDraftProducts);
router.get('/published/:shopId', authenToken, getPublishedProducts);
router.get('/all-shop/:shopId', authenToken, getAllShopProducts);

export default router;
