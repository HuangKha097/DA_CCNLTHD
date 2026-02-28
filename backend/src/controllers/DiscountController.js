import Discount from "../models/Discount.js";

// Tạo mã giảm giá (Dành cho Shop)
const createDiscountCode = async (req, res) => {
    try {
        const {
            shopId, name, code, start_date, end_date, is_active,
            users_used, value, type, max_uses, uses_per_user, min_order_value
        } = req.body;

        if (new Date(start_date) >= new Date(end_date)) {
            return res.status(400).json({ message: "Ngày bắt đầu phải trước ngày kết thúc" });
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
            metadata: newDiscount
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Tính toán số tiền được giảm (Checkout/Review đơn hàng)
const getDiscountAmount = async (req, res) => {
    try {
        const { code, shopId, userId, orderTotal } = req.body;

        // Tìm mã giảm giá theo code và shop
        const foundDiscount = await Discount.findOne({
            discount_code: code,
            discount_shopId: shopId
        });

        if (!foundDiscount) {
            return res.status(404).json({ message: "Mã giảm giá không tồn tại" });
        }

        if (!foundDiscount.is_active) {
            return res.status(400).json({ message: "Mã giảm giá đã hết hạn hoặc bị khóa" });
        }

        const now = new Date();
        if (now < foundDiscount.discount_start_date || now > foundDiscount.discount_end_date) {
            return res.status(400).json({ message: "Mã giảm giá không nằm trong thời gian áp dụng" });
        }

        if (orderTotal < foundDiscount.discount_min_order_value) {
            return res.status(400).json({
                message: `Đơn hàng chưa đạt mức tối thiểu ${foundDiscount.discount_min_order_value} để áp dụng mã`
            });
        }

        if (foundDiscount.discount_max_uses <= 0) {
            return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng" });
        }

        const userUseCount = foundDiscount.discount_users_used.filter(id => id.toString() === userId.toString()).length;
        if (userUseCount >= foundDiscount.discount_max_uses_per_user) {
            return res.status(400).json({ message: "Bạn đã hết lượt sử dụng mã này" });
        }

        let discountAmount = 0;
        if (foundDiscount.discount_type === 'fixed_amount') {
            discountAmount = foundDiscount.discount_value;
        } else if (foundDiscount.discount_type === 'percentage') {
            discountAmount = orderTotal * (foundDiscount.discount_value / 100);
        }

        return res.status(200).json({
            message: "Áp dụng mã thành công",
            metadata: {
                discountAmount,
                finalTotal: orderTotal - discountAmount > 0 ? orderTotal - discountAmount : 0
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export {
    createDiscountCode,
    getDiscountAmount
};