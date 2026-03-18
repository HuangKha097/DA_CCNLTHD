import express from "express";
import { createReview, getReviewsByProduct } from "../controllers/ReviewController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();

router.get('/:productId', getReviewsByProduct);
router.post('/', authenToken, createReview);

export default router;
