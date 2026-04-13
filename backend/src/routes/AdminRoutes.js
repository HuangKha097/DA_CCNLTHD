import express from "express";
import { banUser, unbanUser, banShop, unbanShop, getAllUsers, getAllShops, getShopProductsAdmin, getUserOrdersAdmin } from "../controllers/AdminController.js";
import { authenToken, isAdmin } from "../middlewares/AuthenToken.js";

const router = express.Router();

router.get('/user', authenToken, isAdmin, getAllUsers);
router.patch('/user/:userId', authenToken, isAdmin, banUser);
router.put('/user/:userId/unban', authenToken, isAdmin, unbanUser);

router.get('/shop', authenToken, isAdmin, getAllShops);
router.patch('/shop/:shopId', authenToken, isAdmin, banShop);
router.post('/shop/ban', authenToken, isAdmin, banShop); // Alternative endpoint with body support
router.put('/shop/:shopId/unban', authenToken, isAdmin, unbanShop);
router.post('/shop/unban', authenToken, isAdmin, unbanShop); // Alternative endpoint with body support

router.get('/shop/:shopId/products', authenToken, isAdmin, getShopProductsAdmin);
router.get('/user/:userId/orders', authenToken, isAdmin, getUserOrdersAdmin);

export default router;
