import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import KeyToken from "../models/KeyToken.js";
import User from "../models/User.js";
const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Kiểm tra user tồn tại
        const holderUser = await User.findOne({ email }).lean();
        if (holderUser) {
            return res.status(400).json({
                message: "Lỗi: User đã tồn tại!",
                status: 'error'
            });
        }

        //Hash mật khẩu
        const passwordHash = await bcrypt.hash(password, 10);

        //Tạo user mới
        const newUser = await User.create({
            name,
            email,
            password: passwordHash,
            roles: ['user'] // Mặc định
        });

        if (newUser) {
            // trả về thông tin user (ẩn password)
            return res.status(201).json({
                message: "Sign up successfully!",
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
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra email
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return res.status(400).json({
                message: "User does not exist",
                status: 'error'
            });
        }

        //Kiểm tra password
        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) {
            return res.status(401).json({
                message: "Password incorrect",
                status: 'error'
            });
        }

        //Tạo PrivateKey và PublicKey
        // dùng key này để sign token.
        //tạo random key lưu DB để quản lý phiên.
        const privateKey = crypto.randomBytes(64).toString('hex');
        const publicKey = crypto.randomBytes(64).toString('hex');

        //tạo Tokens
        const payload = {
            userId: foundUser._id,
            email: foundUser.email,
            roles: foundUser.roles
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_JWT_SECRET || "refreshSecretDefault", { expiresIn: "7d" });

        //Update KeyToken vào Database
        const filter = { user: foundUser._id };
        const update = {
            publicKey,
            privateKey,
            refreshToken, // Token mới nhất
            refreshTokensUsed: [], // Reset lại danh sách khi login mới
        };
        const options = { upsert: true, new: true };

        await KeyToken.findOneAndUpdate(filter, update, options);

        return res.status(200).json({
            message: "Login successfully",
            status: 'success',
            metadata: {
                user: {
                    _id: foundUser._id,
                    name: foundUser.name,
                    email: foundUser.email,
                    roles: foundUser.roles
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}

export { login, signUp };