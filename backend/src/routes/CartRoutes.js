import express from "express";

import { addToCart, getCart, updateCart, removeFromCart } from "../controllers/CartController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();

router.post('/add', authenToken, addToCart);
router.get('/', authenToken, getCart);
router.put('/', authenToken, updateCart);
router.delete('/:productId', authenToken, removeFromCart);
router.get('/:userId', authenToken, getCart);

export default router;