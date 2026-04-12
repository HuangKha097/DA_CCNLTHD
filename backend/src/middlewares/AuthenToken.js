import jwt from "jsonwebtoken";
import KeyToken from "../models/KeyToken.js";
import Shop from "../models/Shop.js";


export const authenToken = async (req, res, next) => {
    try {
        //Client phải gửi ID của user lên
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
        // token từ chuỗi "Bearer [token]"
        const token = authorizationHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: 'Invalid token format',
            });
        }
        // check user có còn phiên đăng nhập không
        const keyStore = await KeyToken.findOne({user: userId});
        //không tìm thấy keyStore =->  user đã Logout
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
            console.log(userDecoded)
            req.user = userDecoded;
            req.keyStore = keyStore; // Lưu thêm để controller biết token thuộc về user nào
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

        // Get shopId from request body or params
        const shopId = req.body.shopId || req.params.shopId;
        if (!shopId) {
            return res.status(400).json({
                error: 'Thiếu shopId.',
            });
        }

        // Find shop and verify owner
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({
                error: 'Không tìm thấy gian hàng.',
            });
        }

        // Convert both to string for comparison
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