import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import KeyToken from "../models/KeyToken.js";
import mongoose from "mongoose";

const banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        await Order.updateMany(
            { order_userId: userId, order_status: { $in: ['pending', 'confirmed'] } }, 
            { order_status: 'cancelled' }
        );
        
        await User.findByIdAndUpdate(userId, { status: 'block' });
        await KeyToken.deleteMany({ user: userId });
        
        return res.status(200).json({ message: "Đã khóa tài khoản người dùng thành công", status: "success" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const unbanUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await User.findByIdAndUpdate(userId, { status: 'active' });
        return res.status(200).json({ message: "Đã mở khóa tài khoản người dùng thành công", status: "success" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const banShop = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const shopId = req.body?.shopId || req.params?.shopId;
        const reason = req.body?.reason;
        
        const shop = await Shop.findById(shopId).session(session);
        if (!shop) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Shop không tồn tại", status: "error" });
        }
        
        const pendingOrders = await Order.find({
            "order_products.shopId": shopId,
            order_status: { $in: ["pending", "confirmed", "shipping"] }
        }).session(session);

        let cancelledOrderCount = 0;
        let ordersStillShipping = [];

        for (const order of pendingOrders) {
            if (order.order_status === "pending" || order.order_status === "confirmed") {
                await Order.findByIdAndUpdate(
                    order._id,
                    { order_status: "cancelled" },
                    { session }
                );
                cancelledOrderCount++;
            } else if (order.order_status === "shipping") {
                ordersStillShipping.push({
                    _id: order._id,
                    order_status: "shipping",
                    note: "Đơn đang vận chuyển, shop vẫn có quyền cập nhật status"
                });
            }
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            { status: 'banned', verified: false },
            { new: true, session }
        );
        
        await KeyToken.deleteMany({ user: shop.owner }).session(session);
        await session.commitTransaction();

        return res.status(200).json({
            message: "Ban shop thành công",
            status: "success",
            metadata: {
                shopId: updatedShop._id,
                shopName: updatedShop.name,
                newStatus: updatedShop.status,
                reason: reason || "Không có lý do",
                orderHandling: {
                    cancelledOrders: cancelledOrderCount,
                    ordersStillShipping: ordersStillShipping.length,
                    ordersStillShippingList: ordersStillShipping,
                    note: ordersStillShipping.length > 0 
                        ? "Shop bị ban nhưng vẫn có đơn đang vận chuyển. Shop chỉ có quyền cập nhật trạng thái đơn hàng." 
                        : "Tất cả đơn hàng pending/confirmed đã được hủy."
                }
            }
        });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    } finally {
        session.endSession();
    }
};

const unbanShop = async (req, res) => {
    try {
        const shopId = req.body?.shopId || req.params?.shopId;
        console.log("Received shopId:", shopId);
        console.log("From body:", req.body?.shopId);
        console.log("From params:", req.params?.shopId);

        const shop = await Shop.findById(shopId);
        console.log("Found shop:", shop);
        
        if (!shop) {
            return res.status(404).json({ 
                message: "Shop không tồn tại", 
                status: "error",
                debug: {
                    shopId: shopId,
                    searchedIn: "MongoDB"
                }
            });
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            { status: 'active', verified: true },
            { new: true }
        );

        return res.status(200).json({
            message: "Đã mở khóa Shop thành công",
            status: "success",
            metadata: {
                shopId: updatedShop._id,
                shopName: updatedShop.name,
                newStatus: updatedShop.status
            }
        });
    } catch (error) {
        console.error("Unban shop error:", error);
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
        return res.status(200).json({ status: 'success', metadata: { users } });
    } catch (error) {
         return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find().sort({ createdAt: -1 }).lean();
        return res.status(200).json({ status: 'success', metadata: { shops } });
    } catch (error) {
         return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const getShopProductsAdmin = async (req, res) => {
    try {
        const { shopId } = req.params;
        const products = await Product.find({ product_shop: shopId }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ status: 'success', metadata: { products } });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const getUserOrdersAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ order_userId: userId }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ status: 'success', metadata: { orders } });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

export { banUser, unbanUser, banShop, unbanShop, getAllUsers, getAllShops, getShopProductsAdmin, getUserOrdersAdmin };
