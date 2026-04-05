import Discount from "../models/Discount.js";

const createDiscountCode = async (req, res) => {
    try {
        const {
            shopId, name, code, start_date, end_date, is_active,
            users_used, value, type, max_uses, uses_per_user, min_order_value
        } = req.body;

        if (new Date(start_date) >= new Date(end_date)) {
            return res.status(400).json({ message: "Ngày bắt đầu phải trước ngày kết thúc", status: "error" });
        }

        // Duplicate code check Check
        const existingDiscount = await Discount.findOne({
            discount_code: code,
            discount_shopId: shopId
        });
        
        if (existingDiscount) {
            return res.status(409).json({ message: "Mã giảm giá này đã tồn tại trong shop", status: "error" });
        }

        const newDiscount = await Discount.create({
            discount_name: name,
            discount_shopId: shopId,
            discount_code: code,
            discount_value: value,
            discount_type: type,
            discount_start_date: new Date(start_date),
            discount_end_date: new Date(end_date),
            discount_max_uses: max_uses,
            discount_users_used: users_used || [],
            discount_max_uses_per_user: uses_per_user,
            discount_min_order_value: min_order_value || 0,
            is_active: is_active
        });

        return res.status(201).json({
            message: "Tạo mã giảm giá thành công",
            status: "success",
            metadata: newDiscount
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};


const getDiscountAmount = async (req, res) => {
    try {
        const { code, shopId, userId, orderTotal } = req.body;

        // Tìm mã giảm giá theo code và shop
        const foundDiscount = await Discount.findOne({
            discount_code: code,
            discount_shopId: shopId
        });

        if (!foundDiscount) {
            return res.status(404).json({ message: "Mã giảm giá không tồn tại", status: "error" });
        }

        if (!foundDiscount.is_active) {
            return res.status(400).json({ message: "Mã giảm giá đã hết hạn hoặc bị khóa", status: "error" });
        }

        const now = new Date();
        if (now < foundDiscount.discount_start_date || now > foundDiscount.discount_end_date) {
            return res.status(400).json({ message: "Mã giảm giá không nằm trong thời gian áp dụng", status: "error" });
        }

        if (orderTotal < foundDiscount.discount_min_order_value) {
            return res.status(400).json({
                message: `Đơn hàng chưa đạt mức tối thiểu ${foundDiscount.discount_min_order_value} để áp dụng mã`,
                status: "error"
            });
        }

        if (foundDiscount.discount_max_uses <= 0) {
            return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng", status: "error" });
        }

        const userUseCount = foundDiscount.discount_users_used.filter(id => id.toString() === userId.toString()).length;
        if (userUseCount >= foundDiscount.discount_max_uses_per_user) {
            return res.status(400).json({ message: "Bạn đã hết lượt sử dụng mã này", status: "error" });
        }

        let discountAmount = 0;
        if (foundDiscount.discount_type === 'fixed_amount') {
            discountAmount = foundDiscount.discount_value;
        } else if (foundDiscount.discount_type === 'percentage') {
            discountAmount = orderTotal * (foundDiscount.discount_value / 100);
        }

        return res.status(200).json({
            message: "Áp dụng mã thành công",
            status: "success",
            metadata: {
                discountAmount,
                finalTotal: orderTotal - discountAmount > 0 ? orderTotal - discountAmount : 0
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const getAllDiscountsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { all } = req.query;
        const now = new Date();
        
        const filter = { discount_shopId: shopId };
        if (all !== 'true') {
            filter.is_active = true;
            filter.discount_end_date = { $gt: now };
        }

        const discounts = await Discount.find(filter).lean();

        return res.status(200).json({
            message: "Lấy danh sách mã giảm giá thành công",
            status: "success",
            metadata: discounts
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};


const deleteDiscount = async (req, res) => {
    try {
        const { shopId, code } = req.body;
        const result = await Discount.findOneAndDelete({
            discount_code: code,
            discount_shopId: shopId
        });

        if (!result) {
            return res.status(404).json({ message: "Không tìm thấy mã giảm giá", status: "error" });
        }

        return res.status(200).json({
            message: "Xóa mã giảm giá thành công",
            status: "success"
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const toggleDiscountStatus = async (req, res) => {
    try {
        const { shopId, code, isActive } = req.body;
        const result = await Discount.findOneAndUpdate(
            { discount_code: code, discount_shopId: shopId },
            { is_active: isActive },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Không tìm thấy mã giảm giá", status: "error" });
        }

        return res.status(200).json({
            message: `Mã giảm giá đã ${isActive ? 'được kích hoạt' : 'bị tạm dừng'}`,
            status: "success",
            metadata: result
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

export {
    createDiscountCode,
    getDiscountAmount,
    getAllDiscountsByShop,
    deleteDiscount,
    toggleDiscountStatus
};