import express from "express";

import { addToCart, getCart } from "../controllers/CartController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();

// --- PRIVATE ROUTES ---
router.post('/add', authenToken, addToCart);

// Hỗ trợ cả req.params.userId và truyền qua header x-client-id
router.get('/', authenToken, getCart);
router.get('/:userId', authenToken, getCart);

export default router;