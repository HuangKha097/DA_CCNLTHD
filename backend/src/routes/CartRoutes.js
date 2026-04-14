import express from "express";

import { addToCart, getCart, updateCart, removeFromCart } from "../controllers/CartController.js";
import {authenToken, isCurrentUserProfile} from "../middlewares/AuthenToken.js";

const router = express.Router();

router.post('/add/:userId', authenToken,isCurrentUserProfile, addToCart);
router.get('/', authenToken, isCurrentUserProfile, getCart);
router.put('/', authenToken, isCurrentUserProfile, updateCart);
router.delete('/:productId', authenToken, isCurrentUserProfile, removeFromCart);
router.get('/:userId', authenToken,isCurrentUserProfile, getCart);

export default router;