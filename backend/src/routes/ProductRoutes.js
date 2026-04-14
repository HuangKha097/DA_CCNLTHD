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
import { authenToken, isCurrentUser, checkShopNotBanned } from "../middlewares/AuthenToken.js";

const router = express.Router();

// PUBLIC ROUTES (User/Guest)
router.get('/all', getAllProducts);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/:productId', getProductDetail);
router.get('/related/:productId', getRelatedProducts);
router.get('/published/all/:shopId', getPublishedProducts); // Public access for shop page

//  PRIVATE ROUTES (Shop/Vendor)
router.post('/create/:shopId', authenToken, isCurrentUser, checkShopNotBanned, createProduct);
router.put('/:productId', authenToken, isCurrentUser, checkShopNotBanned, updateProduct);
router.delete('/:productId', authenToken, isCurrentUser, checkShopNotBanned, deleteProduct);

router.patch('/publish/:productId', authenToken, isCurrentUser, checkShopNotBanned, publishProduct);
router.patch('/unpublish/:productId', authenToken, isCurrentUser, checkShopNotBanned, unpublishProduct);

router.get('/drafts/:shopId', authenToken, isCurrentUser, getDraftProducts);
router.get('/published/:shopId', authenToken, isCurrentUser, getPublishedProducts);
router.get('/all-shop/:shopId', authenToken, isCurrentUser, getAllShopProducts);

export default router;
