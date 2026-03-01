// ============================================================
// OrderController.js
// Xử lý: Checkout, Tạo đơn hàng, Xem đơn, Cập nhật trạng thái
// ============================================================

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import mongoose from "mongoose";

// ============================================================
// [1] CHECKOUT REVIEW - Kiểm tra tồn kho trước khi đặt hàng
// POST /api/order/checkout/review
// Theo diagram Sequence_MuaHang: bước 2 -> 7
// ============================================================
const checkoutReview = async (req, res) => {
  try {
    const userId = req.headers["x-client-id"];
    const { cartItems } = req.body;
    /*
            cartItems: [
                { productId, shopId, quantity, name, price },
                ...
            ]
        */

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // --- Bước 3-7: checkAvailability - Kiểm tra tồn kho từng sản phẩm ---
    const unavailableItems = [];
    const availableItems = [];

    for (const item of cartItems) {
      const inventory = await Inventory.findOne({
        inven_productId: item.productId,
        inven_shopId: item.shopId,
      });

      // [Hết hàng] - Stock < request quantity
      if (!inventory || inventory.inven_stock < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          name: item.name,
          requested: item.quantity,
          available: inventory ? inventory.inven_stock : 0,
        });
      } else {
        // [Còn hàng] - OK
        availableItems.push(item);
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        message: `Sản phẩm đã hết hàng hoặc không đủ số lượng`,
        unavailableItems,
      });
    }

    // --- Bước 8: Logic Tách Đơn (Splitting) - GroupBy shop_id ---
    const shopOrderMap = {};
    for (const item of availableItems) {
      const key = item.shopId.toString();
      if (!shopOrderMap[key]) {
        shopOrderMap[key] = {
          shopId: item.shopId,
          items: [],
          totalPrice: 0,
        };
      }
      shopOrderMap[key].items.push(item);
      shopOrderMap[key].totalPrice += item.price * item.quantity;
    }

    const shopOrders = Object.values(shopOrderMap);
    const grandTotal = shopOrders.reduce((sum, s) => sum + s.totalPrice, 0);

    return res.status(200).json({
      message: "Kiểm tra giỏ hàng thành công",
      metadata: {
        shopOrders, // Đơn đã được tách theo shop
        grandTotal,
        itemCount: availableItems.length,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ============================================================
// [2] CHECKOUT - Đặt hàng thật sự, tạo Order trong DB
// POST /api/order/checkout
// Theo diagram Sequence_MuaHang: bước 9 -> 16
// ============================================================
const checkout = async (req, res) => {
  // Dùng session để đảm bảo tính toàn vẹn dữ liệu (Transaction-like)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.headers["x-client-id"];
    const { cartItems, shipping, payment } = req.body;
    /*
            cartItems: [{ productId, shopId, quantity, name, price }]
            shipping: { street, city, country, ... }
            payment: { method: 'cod' | 'credit' }
        */

    if (!cartItems || cartItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // --- Kiểm tra lại tồn kho lần cuối (race condition prevention) ---
    for (const item of cartItems) {
      const inventory = await Inventory.findOne({
        inven_productId: item.productId,
        inven_shopId: item.shopId,
      }).session(session);

      if (!inventory || inventory.inven_stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Sản phẩm "${item.name}" vừa hết hàng. Vui lòng kiểm tra lại giỏ hàng.`,
        });
      }
    }

    // --- Bước 8: Tách đơn theo shop (GroupBy shop_id) ---
    const shopOrderMap = {};
    for (const item of cartItems) {
      const key = item.shopId.toString();
      if (!shopOrderMap[key]) {
        shopOrderMap[key] = { shopId: item.shopId, items: [], totalPrice: 0 };
      }
      shopOrderMap[key].items.push(item);
      shopOrderMap[key].totalPrice += item.price * item.quantity;
    }

    const shopOrders = Object.values(shopOrderMap);
    const createdOrderIds = [];

    // --- Bước 9-10: Tạo Order song song cho từng shop (par) ---
    for (const shopOrder of shopOrders) {
      const newOrder = await Order.create(
        [
          {
            order_userId: userId,
            order_checkout: {
              totalPrice: shopOrder.totalPrice,
              feeShip: 0, // Có thể mở rộng sau
              totalApplyDiscount: shopOrder.totalPrice,
            },
            order_shipping: shipping || {},
            order_payment: payment || { method: "cod" },
            order_products: shopOrder.items, // Snapshot sản phẩm
            order_status: "pending",
          },
        ],
        { session },
      );

      createdOrderIds.push(newOrder[0]._id);
    }

    // --- Bước 11-12: updateInventory(decrement) - $inc: { inven_stock: -1 } ---
    for (const item of cartItems) {
      await Inventory.findOneAndUpdate(
        { inven_productId: item.productId, inven_shopId: item.shopId },
        { $inc: { inven_stock: -item.quantity } },
        { session },
      );
    }

    // --- Bước 13-14: clearCart - Xóa các sản phẩm đã mua khỏi giỏ ---
    const purchasedProductIds = cartItems.map((i) => i.productId.toString());
    await Cart.findOneAndUpdate(
      { cart_userId: userId, cart_state: "active" },
      {
        $pull: {
          cart_products: { productId: { $in: purchasedProductIds } },
        },
        $inc: { cart_count_product: -purchasedProductIds.length },
      },
      { session },
    );

    await session.commitTransaction();

    // --- Bước 15-16: Trả về order_ids cho Frontend ---
    return res.status(201).json({
      message: "Đặt hàng thành công! Cảm ơn bạn đã mua hàng.",
      metadata: {
        order_ids: createdOrderIds,
        orderCount: createdOrderIds.length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};

// ============================================================
// [3] GET USER ORDERS - Lịch sử đơn hàng của người mua
// GET /api/order/my-orders?status=pending
// ============================================================
const getMyOrders = async (req, res) => {
  try {
    const userId = req.headers["x-client-id"];
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { order_userId: userId };
    if (status) filter.order_status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    return res.status(200).json({
      message: "Lấy danh sách đơn hàng thành công",
      metadata: {
        orders,
        pagination: { total, page: Number(page), limit: Number(limit) },
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ============================================================
// [4] GET SHOP ORDERS - Shop xem đơn hàng cần xử lý
// GET /api/order/shop/orders?status=pending
// Theo diagram Sequence_XuLyDonHangCuaShop: bước 2 -> 4
// ============================================================
const getShopOrders = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.headers["x-shop-id"];
    const { status = "pending", page = 1, limit = 10 } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: "Thiếu shopId" });
    }

    // Tìm Orders có chứa sản phẩm thuộc shop này
    // order_products là array snapshot: [{ shopId, productId, ... }]
    const filter = {
      "order_products.shopId": shopId,
      order_status: status,
    };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      message: `Lấy danh sách đơn hàng [${status}] thành công`,
      metadata: {
        orders,
        count: orders.length,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ============================================================
// [5] UPDATE ORDER STATUS - Shop xác nhận / cập nhật đơn hàng
// PATCH /api/order/status
// Theo diagram Sequence_XuLyDonHangCuaShop: bước 6 -> 8
// ============================================================
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Trạng thái hợp lệ và thứ tự chuyển đổi được phép
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipping", "cancelled"],
      shipping: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const allowedNext = validTransitions[order.order_status];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Không thể chuyển trạng thái từ [${order.order_status}] sang [${status}]`,
        allowedNext,
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { order_status: status },
      { new: true },
    );

    // (Tùy chọn) Gửi Noti cho User - có thể mở rộng tích hợp socket.io/email sau

    return res.status(200).json({
      message: `Cập nhật trạng thái đơn hàng thành công: ${status}`,
      metadata: updatedOrder,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ============================================================
// [6] CANCEL ORDER - User hủy đơn hàng
// PATCH /api/order/:orderId/cancel
// ============================================================
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.headers["x-client-id"];
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      order_userId: userId,
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Chỉ cho hủy khi đang ở trạng thái pending
    if (order.order_status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Không thể hủy đơn hàng đang ở trạng thái [${order.order_status}]`,
      });
    }

    // Cập nhật trạng thái đơn
    order.order_status = "cancelled";
    await order.save({ session });

    // Hoàn lại tồn kho (rollback inventory)
    for (const item of order.order_products) {
      await Inventory.findOneAndUpdate(
        { inven_productId: item.productId, inven_shopId: item.shopId },
        { $inc: { inven_stock: item.quantity } },
        { session },
      );
    }

    await session.commitTransaction();

    return res.status(200).json({
      message: "Hủy đơn hàng thành công",
      metadata: order,
    });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  } finally {
    session.endSession();
  }
};

export {
  checkoutReview,
  checkout,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
  cancelOrder,
};
