//logic giỏ hàng: Thêm sản phẩm vào giỏ, cập nhật số lượng, xóa sản phẩm, tính tổng tiền tạm tính.
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";

const addToCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.body.userId;
        const { productId, shopId, quantity, name, price } = req.body;

        if (!userId || !productId || !shopId || !quantity) {
            return res.status(400).json({ 
                message: "Thiếu thông tin: userId, productId, shopId, quantity",
                status: 'error'
            });
        }

        //  Sản phẩm có tồn tại và đã published không?
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: 'error'
            });
        }

        if (!product.isPublished) {
            return res.status(403).json({
                message: "Sản phẩm này chưa được công bố, không thể thêm vào giỏ",
                status: 'error'
            });
        }

        //  Kiểm tra tồn kho (Inventory)
        const inventory = await Inventory.findOne({
            inven_productId: productId,
            inven_shopId: shopId
        });

        if (!inventory) {
            return res.status(404).json({
                message: "Sản phẩm không có sẵn trong kho của shop này",
                status: 'error'
            });
        }

        // Tính số lượng đã đặt trước (reservations)
        const reservedQuantity = inventory.inven_reservations.reduce((sum, res) => sum + res.quantity, 0);
        const availableStock = inventory.inven_stock - reservedQuantity;

        if (availableStock < quantity) {
            return res.status(400).json({
                message: `Sản phẩm chỉ còn ${availableStock} trong kho, không thể thêm ${quantity}`,
                status: 'error'
            });
        }

        // Lấy hoặc tạo mới giỏ hàng
        let userCart = await Cart.findOne({ cart_userId: userId, cart_state: 'active' });

        // Cart chưa tồn tại -> Create New Cart
        if (!userCart) {
            const newCart = await Cart.create({
                cart_userId: userId,
                cart_state: 'active',
                cart_products: [{ productId, shopId, quantity, name: product.product_name, price: product.product_price }],
                cart_count_product: quantity
            });

            return res.status(200).json({
                message: "Thêm vào giỏ hàng thành công",
                status: 'success',
                metadata: newCart
            });
        }

        //  Kiểm tra duplicate - sản phẩm này từ shop này đã có trong giỏ chưa?
        const existingProductIndex = userCart.cart_products.findIndex(
            (item) => item.productId.toString() === productId.toString() && item.shopId.toString() === shopId.toString()
        );

        let updatedCart;

        if (existingProductIndex !== -1) {
            // Sản phẩm + shop đã có -> Check lại inventory với tổng quantity
            const currentQty = userCart.cart_products[existingProductIndex].quantity;
            const totalQty = currentQty + quantity;

            if (availableStock < totalQty) {
                return res.status(400).json({
                    message: `Sản phẩm chỉ còn ${availableStock} trong kho, không thể thêm đến ${totalQty}`,
                    status: 'error'
                });
            }

            // Update quantity
            updatedCart = await Cart.findOneAndUpdate(
                {
                    cart_userId: userId,
                    'cart_products.productId': productId,
                    'cart_products.shopId': shopId,
                    cart_state: 'active'
                },
                {
                    $inc: { 
                        'cart_products.$.quantity': quantity,
                        cart_count_product: quantity
                    }
                },
                { new: true }
            );
        } else {
            // Sản phẩm mới -> Push to 'cart_products' array
            updatedCart = await Cart.findOneAndUpdate(
                {
                    cart_userId: userId,
                    cart_state: 'active'
                },
                {
                    $push: { cart_products: { productId, shopId, quantity, name: product.product_name, price: product.product_price } },
                    $inc: { cart_count_product: quantity }
                },
                { new: true }
            );
        }

        return res.status(200).json({
            message: "Cập nhật giỏ hàng thành công",
            status: 'success',
            metadata: updatedCart
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.params.userId;

        if (!userId) {
            return res.status(400).json({
                message: "Thiếu userId",
                status: 'error'
            });
        }

        const cart = await Cart.findOne({ cart_userId: userId });

        if (!cart) {
            return res.status(200).json({
                message: "Giỏ hàng trống",
                status: 'success',
                metadata: {
                    cart_userId: userId,
                    cart_products: [],
                    cart_count_product: 0
                }
            });
        }

        return res.status(200).json({
            message: "Lấy giỏ hàng thành công",
            status: 'success',
            metadata: cart
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.body.userId;
        const { productId, shopId } = req.body;

        if (!userId || !productId || !shopId) {
            return res.status(400).json({
                message: "Thiếu thông tin: userId, productId, shopId",
                status: 'error'
            });
        }

        const cart = await Cart.findOne({ cart_userId: userId });

        if (!cart) {
            return res.status(404).json({
                message: "Giỏ hàng không tồn tại",
                status: 'error'
            });
        }

        // Tìm sản phẩm trong giỏ
        const productIndex = cart.cart_products.findIndex(
            (item) => item.productId.toString() === productId.toString() && item.shopId.toString() === shopId.toString()
        );

        if (productIndex === -1) {
            return res.status(404).json({
                message: "Sản phẩm không có trong giỏ hàng",
                status: 'error'
            });
        }

        // Xóa sản phẩm
        const removedQty = cart.cart_products[productIndex].quantity;
        cart.cart_products.splice(productIndex, 1);
        cart.cart_count_product -= removedQty;

        await cart.save();

        return res.status(200).json({
            message: "Xóa sản phẩm khỏi giỏ hàng thành công",
            status: 'success',
            metadata: cart
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const updateCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.body.userId;
        const { productId, shopId, quantity } = req.body;

        if (!userId || !productId || !shopId || quantity === undefined) {
            return res.status(400).json({
                message: "Thiếu thông tin: userId, productId, shopId, quantity",
                status: 'error'
            });
        }

        if (quantity < 0) {
            return res.status(400).json({
                message: "Số lượng không được âm",
                status: 'error'
            });
        }

        // Kiểm tra inventory
        const inventory = await Inventory.findOne({
            inven_productId: productId,
            inven_shopId: shopId
        });

        if (!inventory) {
            return res.status(404).json({
                message: "Sản phẩm không có trong kho",
                status: 'error'
            });
        }

        const reservedQuantity = inventory.inven_reservations.reduce((sum, res) => sum + res.quantity, 0);
        const availableStock = inventory.inven_stock - reservedQuantity;

        if (availableStock < quantity) {
            return res.status(400).json({
                message: `Sản phẩm chỉ còn ${availableStock} trong kho`,
                status: 'error'
            });
        }

        const cart = await Cart.findOne({ cart_userId: userId });

        if (!cart) {
            return res.status(404).json({
                message: "Giỏ hàng không tồn tại",
                status: 'error'
            });
        }

        // Tìm sản phẩm trong giỏ
        const productIndex = cart.cart_products.findIndex(
            (item) => item.productId.toString() === productId.toString() && item.shopId.toString() === shopId.toString()
        );

        if (productIndex === -1) {
            return res.status(404).json({
                message: "Sản phẩm không có trong giỏ hàng",
                status: 'error'
            });
        }

        // Cập nhật số lượng
        const oldQty = cart.cart_products[productIndex].quantity;
        
        if (quantity === 0) {
            // Nếu quantity = 0 -> xóa sản phẩm
            cart.cart_products.splice(productIndex, 1);
            cart.cart_count_product -= oldQty;
        } else {
            cart.cart_products[productIndex].quantity = quantity;
            cart.cart_count_product = cart.cart_count_product - oldQty + quantity;
        }

        await cart.save();

        return res.status(200).json({
            message: "Cập nhật giỏ hàng thành công",
            status: 'success',
            metadata: cart
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.params.userId;

        if (!userId) {
            return res.status(400).json({
                message: "Thiếu userId",
                status: 'error'
            });
        }

        await Cart.findOneAndUpdate(
            { cart_userId: userId },
            {
                cart_products: [],
                cart_count_product: 0
            },
            { new: true }
        );

        return res.status(200).json({
            message: "Xóa tất cả sản phẩm trong giỏ hàng thành công",
            status: 'success'
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export {
    addToCart,
    getCart,
    removeFromCart,
    updateCart,
    clearCart
};