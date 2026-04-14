import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import Inventory from "../models/Inventory.js";

const createProduct = async (req, res) => {
    try {
        const {
            product_name,
            product_price,
            product_description,
            product_type,
            product_attributes,
            product_thumb,
            product_images,
            isPublished
        } = req.body;
        const shop = req.params.shopId;

        if (!shop) {
            return res.status(404).json({
                message: "Shop không tồn tại",
                status: 'error'
            });
        }

        if (shop.status === 'banned') {
            return res.status(403).json({
                message: "Shop này đã bị ban, không thể đăng sản phẩm mới",
                status: 'error'
            });
        }

        const existingProduct = await Product.findOne({
            product_shop: shop,
            product_name
        });

        if (existingProduct) {
            return res.status(409).json({
                message: "Tên sản phẩm đã tồn tại trong shop của bạn",
                status: 'error'
            });
        }

        const newProduct = await Product.create({
            product_shop:shop,
            product_name,
            product_price,
            product_description,
            product_type,
            product_attributes,
            product_thumb,
            product_images: product_images || [],
            isPublished: isPublished !== undefined ? isPublished : false 
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

const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;

        // Find the existing product to check ownership and existence
        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        // Double-check: Ensure product belongs to user's shop (middleware should have checked this)
        const productShop = await Shop.findById(currentProduct.product_shop);
        if (!productShop || productShop.owner.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "Bạn không có quyền cập nhật sản phẩm này",
                status: 'error'
            });
        }

        // Prevent updating product_shop (keep original behavior)
        if (updateData.product_shop) {
            delete updateData.product_shop;
        }

        // Check for duplicate name if product_name is being updated
        if (updateData.product_name && updateData.product_name !== currentProduct.product_name) {
            const existingNameProduct = await Product.findOne({
                product_shop: currentProduct.product_shop,
                product_name: updateData.product_name
            });
            
            if (existingNameProduct) {
                return res.status(409).json({
                    message: "Tên sản phẩm mới đã tồn tại trong shop của bạn",
                    status: 'error'
                });
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: "Cập nhật sản phẩm thành công",
            status: "success",
            metadata: updatedProduct
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Publish Product
const publishProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check product ownership first
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        const productShop = await Shop.findById(product.product_shop);
        if (!productShop || productShop.owner.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "Bạn không có quyền thao tác với sản phẩm này",
                status: 'error'
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { isPublished: true },
            { new: true }
        );

        return res.status(200).json({
            message: "Đã public sản phẩm",
            status: 'success',
            metadata: updatedProduct
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Unpublish Product
const unpublishProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check product ownership first
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        const productShop = await Shop.findById(product.product_shop);
        if (!productShop || productShop.owner.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "Bạn không có quyền thao tác với sản phẩm này",
                status: 'error'
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { isPublished: false },
            { new: true }
        );

        return res.status(200).json({
            message: "Đã chuyển sản phẩm về draft",
            status: 'success',
            metadata: updatedProduct
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Draft Products
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

        // Lấy inventory cho mỗi product
        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const inventory = await Inventory.findOne({
                    inven_productId: product._id,
                    inven_shopId: shopId
                }).select('inven_stock').lean();
                return {
                    ...product,
                    stock: inventory?.inven_stock || 0
                };
            })
        );

        const total = await Product.countDocuments({
            product_shop: shopId,
            isPublished: false
        });

        return res.status(200).json({
            message: "Lấy danh sách draft thành công",
            status: 'success',
            metadata: {
                products: productsWithStock,
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

// Get Published Products
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

        // Lấy inventory cho mỗi product
        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const inventory = await Inventory.findOne({
                    inven_productId: product._id,
                    inven_shopId: shopId
                }).select('inven_stock').lean();
                return {
                    ...product,
                    stock: inventory?.inven_stock || 0
                };
            })
        );

        const total = await Product.countDocuments({
            product_shop: shopId,
            isPublished: true
        });

        return res.status(200).json({
            message: "Lấy danh sách sản phẩm đang bán thành công",
            status: 'success',
            metadata: {
                products: productsWithStock,
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

// Delete Product
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check product ownership first
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        const productShop = await Shop.findById(product.product_shop);
        if (!productShop || productShop.owner.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "Bạn không có quyền xóa sản phẩm này",
                status: 'error'
            });
        }

        const deletedProduct = await Product.findByIdAndDelete(productId);

        return res.status(200).json({
            message: "Xóa sản phẩm thành công",
            status: 'success',
            metadata: deletedProduct
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get All Shop Products
const getAllShopProducts = async (req, res) => {
    try {
        const { shopId } = req.params;
        const products = await Product.find({ product_shop: shopId })
            .sort({ createdAt: -1 })
            .lean();

        // Lấy inventory cho mỗi product
        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const inventory = await Inventory.findOne({
                    inven_productId: product._id,
                    inven_shopId: shopId
                }).select('inven_stock').lean();
                return {
                    ...product,
                    stock: inventory?.inven_stock || 0
                };
            })
        );

        return res.status(200).json({
            status: 'success',
            message: "Lấy tất cả sản phẩm của shop thành công",
            metadata: {
                products: productsWithStock
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

//  USER/PUBLIC FUNCTION

// Get All Products
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const activeShops = await Shop.find({ status: 'active' }).select('_id');
        const activeShopIds = activeShops.map(s => s._id);

        const products = await Product.find({ isPublished: true, product_shop: { $in: activeShopIds } })
            .populate('product_shop', 'name logo')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .select('-__v')
            .lean();

        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const inventory = await Inventory.findOne({
                    inven_productId: product._id,
                    inven_shopId: product.product_shop._id
                }).select('inven_stock').lean();
                return {
                    ...product,
                    stock: inventory?.inven_stock || 0
                };
            })
        );

        const total = await Product.countDocuments({ isPublished: true, product_shop: { $in: activeShopIds } });

        return res.status(200).json({
            message: "Lấy danh sách sản phẩm thành công",
            status: 'success',
            metadata: {
                products: productsWithStock,
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

// Get Product Detail
const getProductDetail = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate('product_shop', 'name email logo verified status')
            .select('-__v')
            .lean();

        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        if (!product.isPublished || (product.product_shop && product.product_shop.status === 'banned')) {
            return res.status(403).json({
                message: "Sản phẩm hoặc gian hàng hiện không khả dụng",
                status: 'error'
            });
        }

        if (product.product_shop && product.product_shop.status === 'inactive') {
            return res.status(403).json({
                message: "Sản phẩm hoặc gian hàng hiện không khả dụng",
                status: 'error'
            });
        }

        const inventory = await Inventory.findOne({
            inven_productId: productId,
            inven_shopId: product.product_shop._id
        }).select('inven_stock inven_shopId').lean();

        return res.status(200).json({
            message: "Lấy chi tiết sản phẩm thành công",
            status: 'success',
            metadata: {
                ...product,
                stock: inventory?.inven_stock || 0,
                shopId: inventory?.inven_shopId || product.product_shop._id
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Related Products
const getRelatedProducts = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 10 } = req.query;

        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        // Chỉ lấy sản phẩm từ shop active (loại bỏ shop bị ban)
        const activeShops = await Shop.find({ status: 'active' }).select('_id');
        const activeShopIds = activeShops.map(s => s._id);

        const related = await Product.find({
            _id: { $ne: productId },
            product_type: product.product_type,
            product_shop: { $in: activeShopIds },
            isPublished: true
        })
            .limit(parseInt(limit))
            .populate('product_shop', 'name logo')
            .select('-__v')
            .lean();

        // Lấy inventory cho mỗi product liên quan
        const relatedWithStock = await Promise.all(
            related.map(async (prod) => {
                const inventory = await Inventory.findOne({
                    inven_productId: prod._id,
                    inven_shopId: prod.product_shop._id
                }).select('inven_stock').lean();
                return {
                    ...prod,
                    stock: inventory?.inven_stock || 0
                };
            })
        );

        return res.status(200).json({
            message: "Lấy danh sách sản phẩm liên quan thành công",
            status: 'success',
            metadata: relatedWithStock
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Search Products
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
        const searchRegex = new RegExp(keyword, 'i');
        
        const activeShops = await Shop.find({ status: 'active' }).select('_id');
        const activeShopIds = activeShops.map(s => s._id);

        const products = await Product.find({
            isPublished: true,
            product_shop: { $in: activeShopIds },
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

        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const inventory = await Inventory.findOne({
                    inven_productId: product._id,
                    inven_shopId: product.product_shop._id
                }).select('inven_stock').lean();
                return {
                    ...product,
                    stock: inventory?.inven_stock || 0
                };
            })
        );

        const total = await Product.countDocuments({
            isPublished: true,
            product_shop: { $in: activeShopIds },
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
                products: productsWithStock,
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

// Filter Products
const filterProducts = async (req, res) => {
    try {
        const {
            minPrice,
            maxPrice,
            product_type,
            minRating,
            keyword,
            sort = '-createdAt', // -createdAt (mới nhất), createdAt (cũ nhất), product_price, -product_price, -product_ratingsAverage
            page = 1,
            limit = 20
        } = req.query;

        const skip = (page - 1) * limit;

        const activeShops = await Shop.find({ status: 'active' }).select('_id');
        const activeShopIds = activeShops.map(s => s._id);

        const filter = { isPublished: true, product_shop: { $in: activeShopIds } };

        if (keyword) {
            const searchRegex = new RegExp(keyword, 'i');
            filter.$or = [
                { product_name: searchRegex },
                { product_description: searchRegex }
            ];
        }

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

        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const inventory = await Inventory.findOne({
                    inven_productId: product._id,
                    inven_shopId: product.product_shop._id
                }).select('inven_stock').lean();
                return {
                    ...product,
                    stock: inventory?.inven_stock || 0
                };
            })
        );

        const total = await Product.countDocuments(filter);

        return res.status(200).json({
            message: "Lọc sản phẩm thành công",
            status: 'success',
            metadata: {
                filters: { minPrice, maxPrice, product_type, minRating, sort },
                products: productsWithStock,
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
    // Shop/Vendor
    createProduct,
    updateProduct,
    publishProduct,
    unpublishProduct,
    getDraftProducts,
    getPublishedProducts,
    getAllShopProducts,
    deleteProduct,

    // User/Public
    getAllProducts,
    getProductDetail,
    getRelatedProducts,
    searchProducts,
    filterProducts
};