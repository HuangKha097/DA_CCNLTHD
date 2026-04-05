import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import Discount from "../models/Discount.js";
import Shop from "../models/Shop.js";
import mongoose from "mongoose";

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
      return res
        .status(400)
        .json({ message: "Giỏ hàng trống", status: "error" });
    }

    const userShop = await Shop.findOne({ owner: userId }).lean();
    if (userShop) {
      const userShopId = userShop._id.toString();
      const hasOwnProduct = cartItems.some(
        (item) => item.shopId.toString() === userShopId,
      );
      if (hasOwnProduct) {
        return res.status(400).json({
          message: "Bạn không thể mua sản phẩm của chính shop mình",
          status: "error",
        });
      }
    }

    //   checkAvailability - Kiểm tra tồn kho từng sản phẩm
    const unavailableItems = [];
    const availableItems = [];

    for (const item of cartItems) {
      //   Tìm trong bảng Inventory (ưu tiên)
      let inventory = await Inventory.findOne({
        inven_productId: item.productId,
        inven_shopId: item.shopId,
      });

      let availableStock = inventory ? inventory.inven_stock : 0;

      //   Nếu không có bản ghi Inventory, kiểm tra trực tiếp trong Product model
      if (!inventory) {
        const product = await Product.findById(item.productId);
        if (product) {
          availableStock = product.product_quantity || 0;
        }
      }

      // [Hết hàng] - Stock < request quantity
      if (availableStock < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          name: item.name,
          requested: item.quantity,
          available: availableStock,
        });
      } else {
        availableItems.push(item);
      }
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        message: `Sản phẩm đã hết hàng hoặc không đủ số lượng`,
        status: "error",
        unavailableItems,
      });
    }

    //   Tách Đơn (Splitting) - GroupBy shop_id
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
      status: "success",
      metadata: {
        shopOrders, // Đơn đã được tách theo shop
        grandTotal,
        itemCount: availableItems.length,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

const checkout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.headers["x-client-id"];
    const { cartItems, shipping, payment, discounts } = req.body;
    /*
            cartItems: [{ productId, shopId, quantity, name, price }]
            shipping: { street, city, country, ... }
            payment: { method: 'cod' | 'credit' }
        */
    if (!cartItems || cartItems.length === 0) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Giỏ hàng trống", status: "error" });
    }

    const userShop = await Shop.findOne({ owner: userId })
      .session(session)
      .lean();
    if (userShop) {
      const userShopId = userShop._id.toString();
      const hasOwnProduct = cartItems.some(
        (item) => item.shopId.toString() === userShopId,
      );
      if (hasOwnProduct) {
        await session.abortTransaction();
        return res.status(400).json({
          message: "Bạn không thể mua sản phẩm của chính shop mình",
          status: "error",
        });
      }
    }

    // Kiểm tra lại tồn kho lần cuối
    for (const item of cartItems) {
      let inventory = await Inventory.findOne({
        inven_productId: item.productId,
        inven_shopId: item.shopId,
      }).session(session);

      let availableStock = inventory ? inventory.inven_stock : 0;

      if (!inventory) {
        const product = await Product.findById(item.productId).session(session);
        if (product) availableStock = product.product_quantity || 0;
      }

      if (availableStock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Sản phẩm "${item.name}" vừa hết hàng. Vui lòng kiểm tra lại giỏ hàng.`,
          status: "error",
        });
      }
    }

    //  Tách đơn theo shop (GroupBy shop_id)
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

    // Tạo Order song song cho từng shop (par)
    for (const shopOrder of shopOrders) {
      const shopId = shopOrder.shopId.toString();
      let discountAmount = 0;
      let appliedDiscountCode = null;

      // Áp dụng Discount (nếu có)
      if (discounts && discounts[shopId]) {
        const { code } = discounts[shopId];
        const foundDiscount = await Discount.findOne({
          discount_code: code,
          discount_shopId: shopId,
          is_active: true,
        }).session(session);

        if (foundDiscount) {
          const now = new Date();
          const isValid =
            now >= foundDiscount.discount_start_date &&
            now <= foundDiscount.discount_end_date &&
            shopOrder.totalPrice >= foundDiscount.discount_min_order_value &&
            foundDiscount.discount_max_uses > 0;

          if (isValid) {
            if (foundDiscount.discount_type === "fixed_amount") {
              discountAmount = foundDiscount.discount_value;
            } else if (foundDiscount.discount_type === "percentage") {
              discountAmount =
                shopOrder.totalPrice * (foundDiscount.discount_value / 100);
            }

            // Đảm bảo không giảm quá tổng đơn
            discountAmount = Math.min(discountAmount, shopOrder.totalPrice);
            appliedDiscountCode = code;

            // Cập nhật lượt dùng Discount
            await Discount.findByIdAndUpdate(foundDiscount._id, {
              $inc: { discount_max_uses: -1 },
              $push: { discount_users_used: userId },
            }).session(session);
          }
        }
      }

      const newOrder = await Order.create(
        [
          {
            order_userId: userId,
            order_checkout: {
              totalPrice: shopOrder.totalPrice,
              feeShip: 0,
              totalApplyDiscount: shopOrder.totalPrice - discountAmount,
              discountCode: appliedDiscountCode,
            },
            order_shipping: shipping || {},
            order_payment: payment || { method: "cod" },
            order_products: shopOrder.items,
            order_status: "pending",
          },
        ],
        { session },
      );

      createdOrderIds.push(newOrder[0]._id);
    }

    //  updateInventory(decrement) - $inc: { inven_stock: -1 }
    for (const item of cartItems) {
      const result = await Inventory.findOneAndUpdate(
        { inven_productId: item.productId, inven_shopId: item.shopId },
        { $inc: { inven_stock: -item.quantity } },
        { session, new: true },
      );

      // Nếu không có Inventory record,tạo mới với stock là (product_quantity - requested_quantity)
      if (!result) {
        const product = await Product.findById(item.productId).session(session);
        await Inventory.create(
          [
            {
              inven_productId: item.productId,
              inven_shopId: item.shopId,
              inven_stock: (product.product_quantity || 0) - item.quantity,
              inven_location: "unKnown",
            },
          ],
          { session },
        );
      }
    }

    //clearCart
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

    // Trả về order_ids cho Frontend
    return res.status(201).json({
      message: "Đặt hàng thành công! Cảm ơn bạn đã mua hàng.",
      status: "success",
      metadata: {
        order_ids: createdOrderIds,
        orderCount: createdOrderIds.length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  } finally {
    session.endSession();
  }
};

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
      status: "success",
      metadata: {
        orders,
        pagination: { total, page: Number(page), limit: Number(limit) },
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

const getShopOrders = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.headers["x-shop-id"];
    const { status = "pending", page = 1, limit = 10 } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: "Thiếu shopId", status: "error" });
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
      status: "success",
      metadata: {
        orders,
        count: orders.length,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipping", "cancelled"],
      shipping: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn hàng", status: "error" });
    }

    const allowedNext = validTransitions[order.order_status];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Không thể chuyển trạng thái từ [${order.order_status}] sang [${status}]`,
        status: "error",
        allowedNext,
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { order_status: status },
      { new: true },
    );

    return res.status(200).json({
      message: `Cập nhật trạng thái đơn hàng thành công: ${status}`,
      status: "success",
      metadata: updatedOrder,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

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
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn hàng", status: "error" });
    }

    // Chỉ cho hủy khi đang ở trạng thái pending
    if (order.order_status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Không thể hủy đơn hàng đang ở trạng thái [${order.order_status}]`,
        status: "error",
      });
    }

    order.order_status = "cancelled";
    await order.save({ session });

    // Hoàn lại tồn kho
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
      status: "success",
      metadata: order,
    });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  } finally {
    session.endSession();
  }
};

const getShopDashboardStats = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.headers["x-shop-id"];

    if (!shopId) {
      return res.status(400).json({ message: "Thiếu shopId", status: "error" });
    }

    const totalProducts = await Product.countDocuments({
      product_shop: shopId,
    });

    const pendingOrders = await Order.countDocuments({
      "order_products.shopId": shopId,
      order_status: "pending",
    });

    const deliveredOrders = await Order.find({
      "order_products.shopId": shopId,
      order_status: "delivered",
    });

    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      // If the order has products from MULTIPLE shops, we only want the share for THIS shop
      const shopItems = order.order_products.filter(
        (item) => item.shopId.toString() === shopId.toString(),
      );
      const shopItemTotal = shopItems.reduce(
        (s, i) => s + i.price * i.quantity,
        0,
      );

      // Calculate proportional discount if any
      const orderTotal = order.order_checkout.totalPrice || 1;
      const discountRatio =
        (order.order_checkout.totalApplyDiscount || orderTotal) / orderTotal;

      return sum + shopItemTotal * discountRatio;
    }, 0);

    return res.status(200).json({
      message: "Lấy thống kê dashboard thành công",
      status: "success",
      metadata: {
        totalProducts,
        pendingOrders,
        totalRevenue: Math.round(totalRevenue),
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

export {
  checkoutReview,
  checkout,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
  cancelOrder,
  getShopDashboardStats,
};
