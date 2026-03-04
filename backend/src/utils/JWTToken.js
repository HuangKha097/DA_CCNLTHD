import jwt from "jsonwebtoken";
// --- UTILS FUNCTION ---
// dùng tạo ra cùng lúc 2 loại token

const genneralAccesToken = async (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {expiresIn: "1m"}
    );
};

const genneralRefreshToken = async (payload) => {
    return jwt.sign(
        payload,
        process.env.REFRESH_JWT_SECRET,
        {expiresIn: "365d"}
    );
};

export {
    genneralAccesToken,
    genneralRefreshToken
};