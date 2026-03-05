import Product from "../models/Product.js";
import Shop from "../models/Shop.js";

// --- SHOP/VENDOR FUNCTIONS ---

// Create Product: Tạo sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const {
            product_shop,
            product_name,
            product_price,
            product_description,
            product_quantity,
            product_type,
            product_attributes,
            product_thumb,
            product_images,
            isPublished
        } = req.body;

        // Validate shop exists
        const shop = await Shop.findById(product_shop);
        if (!shop) {
            return res.status(404).json({
                message: "Shop không tồn tại",
                status: 'error'
            });
        }

        // Create new product
        const newProduct = await Product.create({
            product_shop,
            product_name,
            product_price,
            product_description,
            product_quantity,
            product_type,
            product_attributes,
            product_thumb,
            product_images: product_images || [],
            isPublished: isPublished !== undefined ? isPublished : false // Default là draft
        });

        return res.status(201).json({
            message: "Tạo sản phẩm thành công",
            status: 'success',
            metadata: newProduct
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Product: Chỉnh sửa thông tin sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;

        // Không cho phép update product_shop
        delete updateData.product_shop;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        return res.status(200).json({
            message: "Cập nhật sản phẩm thành công",
            status: 'success',
            metadata: updatedProduct
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Publish Product: Hiển thị sản phẩm lên sàn
const publishProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findByIdAndUpdate(
            productId,
            { isPublished: true },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        return res.status(200).json({
            message: "Đã public sản phẩm",
            status: 'success',
            metadata: product
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Unpublish Product: Ẩn sản phẩm (lưu nháp)
const unpublishProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findByIdAndUpdate(
            productId,
            { isPublished: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        return res.status(200).json({
            message: "Đã chuyển sản phẩm về draft",
            status: 'success',
            metadata: product
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Draft Products: Danh sách sản phẩm đang nháp của shop
const getDraftProducts = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const products = await Product.find({
            product_shop: shopId,
            isPublished: false
        })
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();

        const total = await Product.countDocuments({
            product_shop: shopId,
            isPublished: false
        });

        return res.status(200).json({
            message: "Lấy danh sách draft thành công",
            status: 'success',
            metadata: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Published Products: Danh sách sản phẩm đang bán của shop
const getPublishedProducts = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const products = await Product.find({
            product_shop: shopId,
            isPublished: true
        })
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();

        const total = await Product.countDocuments({
            product_shop: shopId,
            isPublished: true
        });

        return res.status(200).json({
            message: "Lấy danh sách sản phẩm đang bán thành công",
            status: 'success',
            metadata: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete Product: Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        return res.status(200).json({
            message: "Xóa sản phẩm thành công",
            status: 'success',
            metadata: deletedProduct
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- USER/PUBLIC FUNCTIONS ---

// Get All Products: Lấy tất cả sản phẩm đã publish (cho trang chủ)
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const products = await Product.find({ isPublished: true })
            .populate('product_shop', 'name logo')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .select('-__v')
            .lean();

        const total = await Product.countDocuments({ isPublished: true });

        return res.status(200).json({
            message: "Lấy danh sách sản phẩm thành công",
            status: 'success',
            metadata: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Product Detail: Xem chi tiết sản phẩm
const getProductDetail = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate('product_shop', 'name email logo verified')
            .select('-__v')
            .lean();

        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        // Chỉ cho xem sản phẩm đã publish (trừ khi là shop owner)
        if (!product.isPublished) {
            return res.status(403).json({
                message: "Sản phẩm chưa được public",
                status: 'error'
            });
        }

        return res.status(200).json({
            message: "Lấy chi tiết sản phẩm thành công",
            status: 'success',
            metadata: product
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Search Products: Tìm kiếm sản phẩm theo từ khóa
const searchProducts = async (req, res) => {
    try {
        const { keyword, page = 1, limit = 20 } = req.query;

        if (!keyword) {
            return res.status(400).json({
                message: "Vui lòng nhập từ khóa tìm kiếm",
                status: 'error'
            });
        }

        const skip = (page - 1) * limit;

        // Search trong product_name và product_description
        const searchRegex = new RegExp(keyword, 'i');
        
        const products = await Product.find({
            isPublished: true,
            $or: [
                { product_name: searchRegex },
                { product_description: searchRegex }
            ]
        })
            .populate('product_shop', 'name logo')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .select('-__v')
            .lean();

        const total = await Product.countDocuments({
            isPublished: true,
            $or: [
                { product_name: searchRegex },
                { product_description: searchRegex }
            ]
        });

        return res.status(200).json({
            message: "Tìm kiếm thành công",
            status: 'success',
            metadata: {
                keyword,
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Filter Products: Lọc và sắp xếp sản phẩm
const filterProducts = async (req, res) => {
    try {
        const {
            minPrice,
            maxPrice,
            product_type,
            minRating,
            sort = '-createdAt', // -createdAt (mới nhất), createdAt (cũ nhất), product_price, -product_price, -product_ratingsAverage
            page = 1,
            limit = 20
        } = req.query;

        const skip = (page - 1) * limit;

        // Build query filter
        const filter = { isPublished: true };

        if (minPrice || maxPrice) {
            filter.product_price = {};
            if (minPrice) filter.product_price.$gte = Number(minPrice);
            if (maxPrice) filter.product_price.$lte = Number(maxPrice);
        }

        if (product_type) {
            filter.product_type = product_type;
        }

        if (minRating) {
            filter.product_ratingsAverage = { $gte: Number(minRating) };
        }

        const products = await Product.find(filter)
            .populate('product_shop', 'name logo')
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sort)
            .select('-__v')
            .lean();

        const total = await Product.countDocuments(filter);

        return res.status(200).json({
            message: "Lọc sản phẩm thành công",
            status: 'success',
            metadata: {
                filters: { minPrice, maxPrice, product_type, minRating, sort },
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export {
    // Shop/Vendor functions
    createProduct,
    updateProduct,
    publishProduct,
    unpublishProduct,
    getDraftProducts,
    getPublishedProducts,
    deleteProduct,

    // User/Public functions
    getAllProducts,
    getProductDetail,
    searchProducts,
    filterProducts
};