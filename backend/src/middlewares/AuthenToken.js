import jwt from "jsonwebtoken";
import KeyToken from "../models/KeyToken.js";
import Shop from "../models/Shop.js";

export const authenToken = async (req, res, next) => {
    try {
        const userId = req.headers['x-client-id'];
        if (!userId) {
            return res.status(401).json({
                error: 'Access denied. Missing x-client-id header.',
            });
        }
        const authorizationHeader = req.headers['authorization'];

        if (!authorizationHeader) {
            return res.status(401).json({
                error: 'Access denied. No token provided.',
            });
        }

        const token = authorizationHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: 'Invalid token format',
            });
        }

        const keyStore = await KeyToken.findOne({user: userId});
        if (!keyStore) {
            return res.status(401).json({
                error: 'User is logged out. Token is no longer valid.',
            });
        }
        jwt.verify(token, process.env.JWT_SECRET || 'secretKey', (err, userDecoded) => {
            if (err) {
                return res.status(403).json({
                    error: 'Token is not valid or expired',
                });
            }
            req.user = userDecoded;
            req.keyStore = keyStore;
            next();
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Server error during authentication',
            details: error.message
        });
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.roles || !user.roles.includes('admin')) {
            return res.status(403).json({
                error: 'Access denied. Require Admin Role.',
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Server error during admin verification',
            details: error.message
        });
    }
};
export const isCurrentUser = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.userId) {
            return res.status(401).json({
                error: 'Access denied. User not authenticated.',
            });
        }

        const shopId = req.body.shopId || req.params.shopId|| req.headers['shop_id'];
        if (!shopId) {
            return res.status(400).json({
                error: 'Thiếu shopId.',
            });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({
                error: 'Không tìm thấy gian hàng.',
            });
        }

        if (shop.owner.toString() !== user.userId.toString()) {
            return res.status(403).json({
                error: 'Bạn chỉ có thể sửa shop của mình.',
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Server error during shop verification',
            details: error.message
        });
    }
};

export const isCurrentUserProfile = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.userId) {
            return res.status(401).json({
                error: 'Access denied. User not authenticated.',
            });
        }

        const targetUserId = req.params.userId ;
        if (!targetUserId) {
            return res.status(400).json({
                error: 'Thiếu userId.',
            });
        }

        if (user.userId.toString() !== targetUserId.toString()) {
            return res.status(403).json({
                error: 'Bạn chỉ có thể sửa profile của mình.',
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Server error during user profile verification',
            details: error.message
        });
    }
};

export const checkShopNotBanned = async (req, res, next) => {
    try {
        const shopId = req.body.shopId || req.params.shopId || req.headers["x-shop-id"];

        if (!shopId) {
            return next();
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({
                error: 'Không tìm thấy gian hàng.',
            });
        }

        if (shop.status === 'banned') {
            return res.status(403).json({
                message: "Shop bị khoá, không thể thực hiện tác vụ này",
                status: "error",
                shopStatus: shop.status
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Server error during shop ban verification',
            details: error.message
        });
    }
};
