import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import bcrypt from "bcrypt";

const signUp = async (req, res) => {
  try {
    const { name, email, ownerId } = req.body;
    const checkOwner = await User.findById(ownerId);
    if (!checkOwner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    const holderShop = await Shop.findOne({ email }).lean();
    if (holderShop) {
      return res.status(400).json({
        message: "Lỗi: Email đã được sử dụng!",
        status: "error",
      });
    }
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
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { shopName, shopEmail, passwordOnwer } = req.body;
    const checkShopName = await Shop.findOne({ name: shopName }).lean();
    if (!checkShopName) {
      return res.status(404).json({ message: "Name's shop not found" });
    }
    const checkShopEmail = await Shop.findOne({ email: shopEmail }).lean();
    if (!checkShopEmail) {
      return res.status(404).json({ message: "Email's shop not found" });
    }
    const getPassOwner = await Shop.findOne({ email: shopEmail }).populate(
      "owner",
    );
    const checkPass = await bcrypt.compare(
      passwordOnwer,
      getPassOwner.owner.password,
    );
    if (!checkPass) {
      return res.status(401).json({ message: "Mật khẩu không chính xác", status: "error" });
    }
    return res.status(200).json({ 
        message: "Đăng nhập vào shop account thành công", 
        status: "success",
        metadata: {
            shop: {
                _id: checkShopEmail._id,
                name: checkShopEmail.name,
                email: checkShopEmail.email
            }
        } 
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

const updateShopInfor = async (req, res) => {
  try {
    const { shopId, shopName, shopLogo, shopCoverInfo } = req.body;
    const updateShop = await Shop.findByIdAndUpdate(
      shopId,
      { name: shopName, logo: shopLogo, coverInfo: shopCoverInfo },
      { new: true },
    );
    // console.log(updateShop);
    if (!updateShop) {
      return res.status(404).json({ message: "Shop not found", status: "error" });
    }
    return res.status(200).json({ message: "Cập nhật thông tin thành công", status: "success", metadata: updateShop });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

const showAllInfo = async (req, res) => {
  try {
    const shopId = req.body.shopId || req.query.shopId;
    const getInfo = await Shop.findById(shopId).lean();
    
    if (!getInfo) {
      return res.status(404).json({ message: "Không tìm thấy thông tin của shop", status: "error" });
    }

    // Calculate real stats
    const totalProducts = await Product.countDocuments({ product_shop: shopId, isPublished: true });
    
    // Get all product IDs for this shop to fetch reviews
    const shopProductIds = await Product.find({ product_shop: shopId }).distinct('_id');
    
    const reviews = await Review.find({ review_productId: { $in: shopProductIds } }).select('review_rating');
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? (reviews.reduce((acc, curr) => acc + curr.review_rating, 0) / totalReviews).toFixed(1)
      : 5.0;

    const metadata = {
      ...getInfo,
      stats: {
        totalProducts,
        totalReviews,
        avgRating: parseFloat(avgRating),
        joinDate: getInfo.createdAt,
        responseRate: "98%", // Mocking this since no message system yet
        followers: "1.2k" // Mocking this since no follow system yet
      }
    };

    return res.status(200).json({ message: "Lấy thông tin thành công", status: "success", metadata });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", status: "error", error: error.message });
  }
};

const searchShops = async (req, res) => {
  try {
    const { keyword = "", page = 1, limit = 20 } = req.query;
    if (!keyword.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm", status: "error" });
    }

    const searchRegex = new RegExp(keyword, 'i');
    const skip = (page - 1) * limit;

    const shops = await Shop.find({
      $or: [{ name: searchRegex }, { email: searchRegex }]
    })
      .select("-owner -createdAt -updatedAt -__v")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Shop.countDocuments({
      $or: [{ name: searchRegex }, { email: searchRegex }]
    });

    return res.status(200).json({
      message: "Tìm kiếm shop thành công",
      status: "success",
      metadata: {
        keyword,
        shops,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error", status: "error", error: error.message });
  }
};

export { signUp, login, updateShopInfor, showAllInfo, searchShops };
