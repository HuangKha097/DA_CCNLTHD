import express from "express";

import {createDiscountCode, getDiscountAmount} from "../controllers/DiscountController.js";
import {authenToken} from "../middlewares/AuthenToken.js";

const router = express.Router();

router.post('/create', authenToken, createDiscountCode);
router.post('/apply', authenToken, getDiscountAmount);

export default router;