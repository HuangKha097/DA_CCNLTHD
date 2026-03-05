import express from "express";

import {
    createProduct,
    updateProduct,
    publishProduct,
    unpublishProduct,
    getDraftProducts,
    getPublishedProducts,
    deleteProduct,
    getAllProducts,
    getProductDetail,
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

// --- PRIVATE ROUTES (Shop/Vendor) ---
router.post('/create', authenToken, createProduct);
router.put('/:productId', authenToken, updateProduct);
router.delete('/:productId', authenToken, deleteProduct);

router.patch('/publish/:productId', authenToken, publishProduct);
router.patch('/unpublish/:productId', authenToken, unpublishProduct);

router.get('/drafts/:shopId', authenToken, getDraftProducts);
router.get('/published/:shopId', authenToken, getPublishedProducts);

export default router;
