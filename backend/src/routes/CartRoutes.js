import express from "express";

import { addToCart, getCart, removeFromCart, updateCart, clearCart } from "../controllers/CartController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();

// --- CART ROUTES ---
router.post('/add', authenToken, addToCart);
router.get('/', authenToken, getCart);
router.get('/:userId', authenToken, getCart);
router.put('/update', authenToken, updateCart);
router.delete('/remove', authenToken, removeFromCart);
router.delete('/clear/:userId', authenToken, clearCart);

export default router;