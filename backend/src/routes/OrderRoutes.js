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

// --- TẤT CẢ ROUTES ĐỀU CẦN ĐĂNG NHẬP ---

// [Người mua] Preview đơn hàng (kiểm tra tồn kho)
router.post("/checkout/review", authenToken, checkoutReview);

// [Người mua] Đặt hàng thật sự
router.post("/checkout", authenToken, checkout);

// [Người mua] Xem lịch sử đơn hàng của mình
// GET /api/order/my-orders?status=pending
router.get("/my-orders", authenToken, getMyOrders);

// [Người mua] Hủy đơn hàng (chỉ được hủy khi status = pending)
router.patch("/:orderId/cancel", authenToken, cancelOrder);

// [Shop Owner] Xem đơn hàng của shop
// GET /api/order/shop/orders?shopId=xxx&status=pending
router.get("/shop/orders", authenToken, getShopOrders);

// [Shop Owner] Cập nhật trạng thái đơn (pending -> confirmed -> shipping -> delivered)
router.patch("/status", authenToken, updateOrderStatus);

export default router;
