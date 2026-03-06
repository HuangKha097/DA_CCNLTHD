import express from "express";

import { addToCart, getCart } from "../controllers/CartController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();

router.post('/add', authenToken, addToCart);
router.get('/', authenToken, getCart);
router.get('/:userId', authenToken, getCart);

export default router;