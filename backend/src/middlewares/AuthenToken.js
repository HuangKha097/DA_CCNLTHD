import jwt from "jsonwebtoken";

export function authenToken(req, res, next) {
    const authorizationHeader = req.headers['authorization'];

    //Kiểm  header Authorization
    if (!authorizationHeader) {
        return res.status(401).json({
            error: 'Access denied. No token provided.',
        });
    }

    // Lấy token từ chuỗi "Bearer [token]"
    const token = authorizationHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            error: 'Invalid token format',
        });
    }

    // Xác thực token
    jwt.verify(token, process.env.JWT_SECRET, (err, userDecoded) => {
        if (err) {
            return res.status(403).json({
                error: 'Token is not valid or expired',
            });
        }
        // Lưu thông tin user vào request để dùng ở controller sau
        req.user = userDecoded;

        next();
    });
}