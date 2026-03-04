import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import KeyToken from "../models/KeyToken.js";
import User from "../models/User.js";


// --- AUTHENTICATION ---
const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const holderUser = await User.findOne({ email }).lean();
        if (holderUser) {
            return res.status(400).json({
                message: "Lỗi: Email đã được sử dụng!",
                status: 'error'
            });
        }

        // hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // create new user
        const newUser = await User.create({
            name,
            email,
            password: passwordHash,
            roles: ['user']
        });

        if (newUser) {
            return res.status(201).json({
                message: "Đăng ký thành công!",
                status: 'success',
                metadata: {
                    user: {
                        _id: newUser._id,
                        name: newUser.name,
                        email: newUser.email
                    }
                }
            });
        }
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ message: "Vui lòng nhập email và password" });


        // check email
        const foundUser = await User.findOne({ email });
        if (!foundUser) return res.status(404).json({ message: "Người dùng không tồn tại" });

        //check password
        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) return res.status(401).json({ message: "Mật khẩu không đúng" });

        // check status
        if(foundUser.status === 'block') {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
        }

        // Create Tokens
        // Tạo private/public key random ( dùng simple secret )
        const privateKey = crypto.randomBytes(64).toString('hex');
        const publicKey = crypto.randomBytes(64).toString('hex');

        const tokens = await createTokenPair(
            { userId: foundUser._id, email: foundUser.email, roles: foundUser.roles },
            publicKey,
            privateKey
        );

        // Update KeyToken (Lưu refresh token vào DB để check sau này)
        await KeyToken.findOneAndUpdate(
            { user: foundUser._id },
            {
                publicKey,
                privateKey,
                refreshToken: tokens.refreshToken,
                refreshTokensUsed: []
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            message: "Đăng nhập thành công",
            status: 'success',
            metadata: {
                user: {
                    _id: foundUser._id,
                    name: foundUser.name,
                    email: foundUser.email,
                    roles: foundUser.roles,
                    avatar: foundUser.avatar
                },
                tokens
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.body.userId;
        if(!userId) return res.status(400).json({ message: "Thiếu UserId" });

        const delKey = await KeyToken.findOneAndDelete({ user: userId });
        return res.status(200).json({
            message: "Đăng xuất thành công",
            metadata: delKey
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- USER PROFILE & ADDRESS ---
const getUserInfoById = async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = await User.findById(userId).select("-password -__v");
        if (!data) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ status: "success", data });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { name, avatar } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, avatar },
            { new: true }
        ).select("-password");

        return res.status(200).json({
            message: "Cập nhật thông tin thành công",
            data: updatedUser
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- ADDRESS MANAGEMENT ---

const addAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const newAddress = req.body; // { street, city, country... }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        //  set default = true nếu đây là địa chỉ đầu tiên,
        if (user.address.length === 0) {
            newAddress.isDefault = true;
        }

        user.address.push(newAddress);
        await user.save();

        return res.status(200).json({
            message: "Thêm địa chỉ thành công",
            data: user.address
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const removeAddress = async (req, res) => {
    try {
        const { userId, addressIndex } = req.params;

        const user = await User.findById(userId);
        if(!user) return res.status(404).json({ message: "User not found" });

        // Xóa phần tử trong mảng
        user.address.splice(addressIndex, 1);
        await user.save();

        return res.status(200).json({
            message: "Xóa địa chỉ thành công",
            data: user.address
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- UTILS FUNCTION ---
// dùng tạo ra cùng lúc 2 loại token
const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secretKey', {
            expiresIn: '2 days'
        });

        const refreshToken = jwt.sign(payload, process.env.REFRESH_JWT_SECRET || 'refreshSecretKey', {
            expiresIn: '7 days'
        });

        return { accessToken, refreshToken };
    } catch (error) {
        throw error;
    }
};

export {
    login,
    signUp,
    logout,
    getUserInfoById,
    updateProfile,
    addAddress,
    removeAddress,
    refreshTokenService
}

