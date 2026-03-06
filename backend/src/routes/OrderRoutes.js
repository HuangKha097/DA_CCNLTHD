import express from "express";
import {
  checkoutReview,
  checkout,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/OrderController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();

router.post("/checkout/review", authenToken, checkoutReview);
router.post("/checkout", authenToken, checkout);
router.get("/my-orders", authenToken, getMyOrders);
router.patch("/:orderId/cancel", authenToken, cancelOrder);
router.get("/shop/orders", authenToken, getShopOrders);
router.patch("/status", authenToken, updateOrderStatus);

export default router;
