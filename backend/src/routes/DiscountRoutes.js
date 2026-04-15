import express from "express";

import {
    createDiscountCode, 
    getDiscountAmount, 
    getAllDiscountsByShop,
    deleteDiscount,
    toggleDiscountStatus
} from "../controllers/DiscountController.js";
import {authenToken, isCurrentShop} from "../middlewares/AuthenToken.js";

const router = express.Router();

router.post('/create', authenToken, isCurrentShop, createDiscountCode);
router.post('/amount', authenToken, getDiscountAmount);
router.post('/delete', authenToken, deleteDiscount);
router.post('/toggle', authenToken, toggleDiscountStatus);
router.get('/shop/:shopId', getAllDiscountsByShop);

export default router;