import User from "../models/User.js";
import Discount from "../models/Discount.js";
import mongoose from "mongoose";

const checkIn = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'];
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        const now = new Date();
        const lastCheckIn = user.lastCheckIn;

        if (lastCheckIn && new Date(lastCheckIn).toDateString() === now.toDateString()) {
            return res.status(400).json({ 
                status: 'error', 
                message: "Bạn đã điểm danh hôm nay rồi. Hãy quay lại vào ngày mai!" 
            });
        }
        
        user.coins = (user.coins || 0) + 500;
        user.lastCheckIn = now;
        await user.save();

        return res.status(200).json({
            status: 'success',
            message: 'Điểm danh thành công! +500 xu',
            metadata: {
                coins: user.coins
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const exchangeCoins = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'];
        const { amount, discountValue, shopId } = req.body;

        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (user.coins < amount) {
            return res.status(400).json({ status: 'error', message: 'Không đủ xu để đổi' });
        }

        // Deduct coins
        user.coins -= amount;
        await user.save();

        // Create a unique discount code for this user
        const discountCode = `COIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const newDiscount = await Discount.create({
            discount_name: `Đổi xu nhận Voucher ${discountValue}k`,
            discount_shopId: shopId || "67d6a5d43899f835b3648dfd", // Mock Shop ID if not provided
            discount_user_id: userId,
            discount_code: discountCode,
            discount_value: discountValue,
            discount_type: 'fixed_amount',
            discount_start_date: new Date(),
            discount_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            discount_max_uses: 1,
            discount_max_uses_per_user: 1,
            discount_min_order_value: discountValue * 2,
            is_active: true
        });

        return res.status(200).json({
            status: 'success',
            message: 'Đổi xu thành công!',
            metadata: {
                discountCode: discountCode,
                remainingCoins: user.coins
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const getMyVouchers = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'];
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const vouchers = await Discount.find({ 
            discount_user_id: userId,
            is_active: true,
            discount_end_date: { $gte: new Date() }
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            status: 'success',
            metadata: vouchers
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const playGame = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'];
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        const now = new Date();
        const lastGame = user.lastGamePlay;

        if (lastGame && new Date(lastGame).toDateString() === now.toDateString()) {
            return res.status(400).json({ 
                status: 'error', 
                message: "Bạn đã mở rương hôm nay rồi. Hãy quay lại vào ngày mai!" 
            });
        }

        // Random reward between 50 and 150 coins
        const reward = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
        
        user.coins = (user.coins || 0) + reward;
        user.lastGamePlay = now;
        await user.save();

        return res.status(200).json({
            status: 'success',
            metadata: {
                reward,
                remainingCoins: user.coins
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const submitArcadeScore = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'];
        const { score } = req.body;

        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        if (typeof score !== 'number') return res.status(400).json({ status: 'error', message: 'Invalid score' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        const now = new Date();
        const lastArcade = user.lastArcadePlay;

        if (lastArcade && new Date(lastArcade).toDateString() === now.toDateString()) {
            return res.status(400).json({ 
                status: 'error', 
                message: "Bạn đã nhận thưởng Arcade hôm nay rồi. Hãy quay lại vào ngày mai!" 
            });
        }

        // Calculate reward: 1 coin per 10 points, max 200 coins
        let reward = Math.floor(score / 10);
        if (reward > 200) reward = 200;
        if (reward < 0) reward = 0;
        
        user.coins = (user.coins || 0) + reward;
        user.lastArcadePlay = now;
        await user.save();

        return res.status(200).json({
            status: 'success',
            message: `Chúc mừng! Bạn nhận được ${reward} xu.`,
            metadata: {
                reward,
                remainingCoins: user.coins
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export {
    checkIn,
    exchangeCoins,
    getMyVouchers,
    playGame,
    submitArcadeScore
};
