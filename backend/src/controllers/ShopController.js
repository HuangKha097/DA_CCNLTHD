import Shop from "../models/Shop.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

const signUp = async (req, res) => {
    
    try {
        const {name, email, ownerId} = req.body;
        const checkOwner = await User.findOne({ _id: ownerId });
        console.log(checkOwner);
        if (!checkOwner) {
            return res.status(404).json({message: "Owner not found"});
        }
        const holderShop = await Shop.findOne({email}).lean();
        if (holderShop) {
            return res.status(400).json({
                message: "Lỗi: Email đã được sử dụng cho shop khác !",
                status: "error",
            });
        }
        const shopNameCheck = await Shop.findOne({name}).lean()
        if (shopNameCheck) {
            return res.status(400).json({
                message: "Lỗi: Tên shop đã được sử dụng !",
                status: "error",
            })
        }
        ;
        const newShop = await Shop.create({
            owner: ownerId,
            name,
            email,
        });

        if (newShop) {
            return res.status(201).json({
                message: "Đăng ký thành công!",
                status: "success",
                metadata: {
                    shop: {
                        _id: newShop._id,
                        name: newShop.name,
                        email: newShop.email,
                    },
                },
            });
        }
        return res.status(200).send("thanh cong goi api");
    } catch (error) {
        return res
            .status(500)
            .json({message: "Server error", error: error.message});
    }
};

const login = async (req, res) => {
    try {
        const {shopName, shopEmail, passwordOwner} = req.body;
        const checkShopName = await Shop.findOne({name: shopName}).lean();
        if (!checkShopName) {
            return res.status(404).json({message: "Name's shop not found"});
        }
        const checkShopEmail = await Shop.findOne({email: shopEmail}).lean();
        if (!checkShopEmail) {
            return res.status(404).json({message: "Email's shop not found"});
        }
        const getPassOwner = await Shop.findOne({email: shopEmail}).populate(
            "owner",
        );
        const checkPass = await bcrypt.compare(
            passwordOwner,
            getPassOwner.owner.password,
        );
        if (!checkPass) {
            return res.send("Mat khau khong chinh xac");
        }
        return res.status(200).json({
            message:"Đăng nhập vào shop thành công !",
            status: "success",
            data: checkShopName
        });
    } catch (error) {
        return res
            .status(500)
            .json({message: "Server error", error: error.message});
    }
};

const updateShopInfor = async (req, res) => {
    try {
        const {shopId, shopName, shopLogo, shopCoverInfo} = req.body;
        const updateShop = await Shop.findByIdAndUpdate(
            shopId,
            {name: shopName, logo: shopLogo, coverInfo: shopCoverInfo},
            {new: true},
        );
        console.log(updateShop);
        if (!updateShop) {
            return res.status(404).json({message: "Shop not found"});
        }
        return res.status(200).json({
            message: "Cập nhật thông tin shop thành công!",
            status: "success",
            data: updateShop,
        });
    } catch (error) {
        return res
            .status(500)
            .json({message: "Server error", error: error.message});
    }
};

const showAllInfo = async (req, res) => {
    try {
        const {shopId} = req.body;
        const getInfo = await Shop.findById(shopId).select("-_id -owner -createdAt -updatedAt -__v");
        console.log(getInfo);
        if (!getInfo) {
            return res.status(404).send("khong tim thay thong tin cua shop");
        }
        return res.status(200).send(getInfo);
    } catch (error) {
        return res
            .status(500)
            .json({message: "Server error", error: error.message});
    }
};

export {signUp, login, updateShopInfor, showAllInfo};
