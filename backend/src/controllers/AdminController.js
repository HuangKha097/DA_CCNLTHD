import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import KeyToken from "../models/KeyToken.js";
import mongoose from "mongoose";

const banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const pendingOrders = await Order.find({ order_userId: userId, order_status: 'pending' });
        
        if (pendingOrders.length > 0) {
            await Order.updateMany({ order_userId: userId, order_status: 'pending' }, { order_status: 'cancelled' });
        }
        
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
        const { shopId } = req.params;
        
        const pendingOrdersCount = await Order.countDocuments({ 
            "order_products.shopId": shopId, 
            order_status: 'pending' 
        }).session(session);
        
        if (pendingOrdersCount > 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Shop còn đơn hàng chưa xử lý, không thể khoá!", status: "error" });
        }
        
        const shop = await Shop.findById(shopId).session(session);
        if (!shop) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Shop không tồn tại", status: "error" });
        }
        
        await Shop.findByIdAndUpdate(shopId, { status: 'banned', verified: false }, { session });
        await KeyToken.deleteMany({ user: shop.owner }).session(session);
        
        await session.commitTransaction();
        return res.status(200).json({ message: "Đã vô hiệu hóa Shop", status: "success" });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    } finally {
        session.endSession();
    }
};

const unbanShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        await Shop.findByIdAndUpdate(shopId, { status: 'active', verified: true });
        return res.status(200).json({ message: "Đã mở khóa Shop thành công", status: "success" });
    } catch (error) {
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
