import express from "express";
import { banUser, unbanUser, banShop, unbanShop, getAllUsers, getAllShops, getShopProductsAdmin, getUserOrdersAdmin } from "../controllers/AdminController.js";
import { authenToken, isAdmin } from "../middlewares/AuthenToken.js";

const router = express.Router();

router.get('/user', authenToken, isAdmin, getAllUsers);
router.delete('/user/:userId', authenToken, isAdmin, banUser);
router.put('/user/:userId/unban', authenToken, isAdmin, unbanUser);

router.get('/shop', authenToken, isAdmin, getAllShops);
router.delete('/shop/:shopId', authenToken, isAdmin, banShop);
router.put('/shop/:shopId/unban', authenToken, isAdmin, unbanShop);

router.get('/shop/:shopId/products', authenToken, isAdmin, getShopProductsAdmin);
router.get('/user/:userId/orders', authenToken, isAdmin, getUserOrdersAdmin);

export default router;
