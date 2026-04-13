import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import KeyToken from "../models/KeyToken.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import * as JWT from "../utils/JWTToken.js"


// AUTHENTICATION
const signUp = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        const holderUser = await User.findOne({email}).lean();
        if (holderUser) {
            return res.status(400).json({
                message: "Lỗi: Email đã được sử dụng!",
                status: 'error'
            });
        }

        // hash password
        const passwordHash = await bcrypt.hash(password, 10);// 10 = 2^10 (saltRounds)

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
        return res.status(500).json({message: "Server error", error: error.message});
    }
};

const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) return res.status(400).json({message: "Vui lòng nhập email và password", status: "error"});

        const foundUser = await User.findOne({email});
        if (!foundUser) return res.status(404).json({message: "Người dùng không tồn tại", status: "error"});

        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) return res.status(401).json({message: "Mật khẩu không đúng", status: "error"});

        if (foundUser.status === 'block') {
            return res.status(403).json({message: "Tài khoản của bạn đã bị khóa", status: "error"});
        }


        // Tạo private/public key random ( dùng simple secret )
        const privateKey = crypto.randomBytes(64).toString('hex');
        const publicKey = crypto.randomBytes(64).toString('hex');

        const tokens = await JWT.genneralAccesToken(
            {userId: foundUser._id, email: foundUser.email, roles: foundUser.roles},
            publicKey,
            privateKey
        );

        // Update KeyToken
        await KeyToken.findOneAndUpdate(
            {user: foundUser._id},
            {
                publicKey,
                privateKey,
                refreshToken: tokens.refreshToken,
                refreshTokensUsed: []
            },
            {upsert: true, new: true}
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
        return res.status(500).json({message: "Server error", error: error.message});
    }
};

const logout = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.body.userId;
        if (!userId) return res.status(400).json({message: "Thiếu UserId", status: "error"});

        const delKey = await KeyToken.findOneAndDelete({user: userId});
        return res.status(200).json({
            message: "Đăng xuất thành công",
            status: "success",
            metadata: delKey
        });
    } catch (error) {
        return res.status(500).json({message: "Server error", error: error.message});
    }
};

// USER PROFILE & ADDRESS
const getUserInfoById = async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = await User.findById(userId).select("-password -__v");
        if (!data) return res.status(404).json({message: "User not found", status: "error"});

        // Find if the user owns a shop
        const userShop = await Shop.findOne({ owner: userId }).select("-owner -createdAt -updatedAt -__v");

        return res.status(200).json({
            status: "success", 
            data: {
                ...data.toObject(),
                shop: userShop
            }
        });
    } catch (error) {
        return res.status(500).json({message: "Server error", error: error.message});
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const {name, avatar, phone} = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {name, avatar, phone},
            {new: true}
        ).select("-password");

        return res.status(200).json({
            message: "Cập nhật thông tin thành công",
            status: "success",
            data: updatedUser
        });
    } catch (error) {
        return res.status(500).json({message: "Server error", status: "error", error: error.message});
    }
};

const changePassword = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới", status: "error" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found", status: "error" });

        // Check if old password matches
        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) {
            return res.status(401).json({ message: "Mật khẩu cũ không chính xác!", status: "error" });
        }

        // Hash new password and save
        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.password = passwordHash;
        await user.save();

        return res.status(200).json({
            message: "Đổi mật khẩu thành công!",
            status: "success"
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

//  ADDRESS MANAGEMENT

const addAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const newAddress = req.body; // { street, city, country... }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({message: "User not found", status: "error"});

        //  set default = true nếu đây là địa chỉ đầu tiên,
        if (user.address.length === 0) {
            newAddress.isDefault = true;
        }

        user.address.push(newAddress);
        await user.save();

        return res.status(200).json({
            message: "Thêm địa chỉ thành công",
            status: "success",
            data: user.address
        });
    } catch (error) {
        return res.status(500).json({message: "Server error", status: "error", error: error.message});
    }
};

const removeAddress = async (req, res) => {
    try {
        const {userId, addressIndex} = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({message: "User not found", status: "error"});

        // Xóa phần tử trong mảng
        user.address.splice(addressIndex, 1);
        await user.save();

        return res.status(200).json({
            message: "Xóa địa chỉ thành công",
            status: "success",
            data: user.address
        });
    } catch (error) {
        return res.status(500).json({message: "Server error", status: "error", error: error.message});
    }
};
const refreshTokenService = async (req, res) => {
    try {
        const {userId} = req.params;
        const authHeader = req.headers.token;
        if (!authHeader) {
            return res.status(401).json({ status: "error", message: "Missing token" });
        }
        
        const token = authHeader.split(" ")[1];

        jwt.verify(token, process.env.REFRESH_JWT_SECRET, async (err, user) => {
            if (err) {
                return res.status(403).json({
                    status: "error",
                    message: "Invalid refresh token"
                });
            }


            const checkUser = await User.findById(userId);
            if (!checkUser) {
                return res.status(404).json({
                    status: "error",
                    message: "User not found"
                });
            }

            // Nếu hợp lệ, tạo access_token mới
            const access_token = await JWT.genneralAccesToken({
                id: user.id,
                isAdmin: user.isAdmin
            });

            return res.status(200).json({
                status: "success",
                message: "Refresh token thành công",
                metadata: { access_token }
            });
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Server error", error: error.message });
    }
};


export {
    login,
    signUp,
    logout,
    getUserInfoById,
    updateProfile,
    changePassword,
    addAddress,
    removeAddress,
    refreshTokenService
}

