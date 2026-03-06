import jwt from "jsonwebtoken";
import KeyToken from "../models/KeyToken.js";

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

        //  Xác thực signature và hạn sử dụng của token
        jwt.verify(token, process.env.JWT_SECRET || 'secretKey', (err, userDecoded) => {
            if (err) {
                return res.status(403).json({
                    error: 'Token is not valid or expired',
                });
            }

            // Lưu thông tin user và keyStore vào request để dùng ở các controller sau
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