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
import { authenToken, isCurrentShop, checkShopNotBanned } from "../middlewares/AuthenToken.js";

const router = express.Router();

// PUBLIC ROUTES (User/Guest)
router.get('/all', getAllProducts);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/:productId', getProductDetail);
router.get('/related/:productId', getRelatedProducts);
router.get('/published/all/:shopId', getPublishedProducts); // Public access for shop page

//  PRIVATE ROUTES (Shop/Vendor)
router.post('/create/:shopId', authenToken, isCurrentShop, checkShopNotBanned, createProduct);
router.put('/:productId', authenToken, isCurrentShop, checkShopNotBanned, updateProduct);
router.delete('/:productId', authenToken, isCurrentShop, checkShopNotBanned, deleteProduct);

router.patch('/publish/:productId', authenToken, isCurrentShop, checkShopNotBanned, publishProduct);
router.patch('/unpublish/:productId', authenToken, isCurrentShop, checkShopNotBanned, unpublishProduct);

router.get('/drafts/:shopId', authenToken, isCurrentShop, getDraftProducts);
router.get('/published/:shopId', authenToken, isCurrentShop, getPublishedProducts);
router.get('/all-shop/:shopId', authenToken, isCurrentShop, getAllShopProducts);

export default router;
