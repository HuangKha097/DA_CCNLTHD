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
import { authenToken, isCurrentUser } from "../middlewares/AuthenToken.js";

const router = express.Router();

// PUBLIC ROUTES (User/Guest)
router.get('/all', getAllProducts);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/:productId', getProductDetail);
router.get('/related/:productId', getRelatedProducts);
router.get('/published/all/:shopId', getPublishedProducts); // Public access for shop page

//  PRIVATE ROUTES (Shop/Vendor)
router.post('/create', authenToken, isCurrentUser, createProduct);
router.put('/:productId', authenToken, isCurrentUser, updateProduct);
router.delete('/:productId', authenToken, isCurrentUser, deleteProduct);

router.patch('/publish/:productId', authenToken, isCurrentUser, publishProduct);
router.patch('/unpublish/:productId', authenToken, isCurrentUser, unpublishProduct);

router.get('/drafts/:shopId', authenToken, isCurrentUser, getDraftProducts);
router.get('/published/:shopId', authenToken, isCurrentUser, getPublishedProducts);
router.get('/all-shop/:shopId', authenToken, isCurrentUser, getAllShopProducts);

export default router;
