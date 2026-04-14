import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";

const addToCart = async (req, res) => {
    try {
        // Lấy userId từ token (đã được decode bởi authenToken middleware)
        const userId = req.user?.userId || req.headers['x-client-id'] || req.body.userId;
        const {productId, shopId, quantity} = req.body;

        if (!userId) {
            return res.status(400).json({message: "Thiếu UserId", status: "error"});
        }

        if (!productId || !shopId || !quantity) {
            return res.status(400).json({
                message: "Thiếu thông tin: productId, shopId hoặc quantity",
                status: "error"
            });
        }

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Sản phẩm không tồn tại",
                status: "error"
            });
        }

        // Kiểm tra sản phẩm có thuộc về shop được cung cấp không
        if (product.product_shop.toString() !== shopId.toString()) {
            return res.status(400).json({
                message: "Sản phẩm này không thuộc shop được chỉ định",
                status: "error"
            });
        }

        // Kiểm tra shop tồn tại
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({
                message: "Shop không tồn tại",
                status: "error"
            });
        }

        // Kiểm tra user có phải owner của shop không (không thể add sản phẩm của chính shop mình)
        if (shop.owner.toString() === userId.toString()) {
            return res.status(400).json({
                message: "Bạn không thể thêm sản phẩm của chính shop mình vào giỏ hàng",
                status: "error"
            });
        }

        const userCart = await Cart.findOne({
            cart_userId: userId,
            cart_state: 'active'
        });

        const productExists = userCart?.cart_products.find(
            (p) => p.productId.toString() === productId.toString()
        );

        const totalQuantity = productExists
            ? productExists.quantity + quantity
            : quantity;

        if (!userCart) {
            const newCart = await Cart.create({
                cart_userId: userId,
                cart_state: 'active',
                cart_products: [{
                    productId,
                    shopId,
                    quantity,
                    name: product.product_name,
                    price: product.product_price,
                    shopName: shop.name,
                    product_thumb: product.product_thumb
                }],
                cart_count_product: 1
            });

            return res.status(200).json({
                message: "Thêm vào giỏ hàng thành công",
                status: "success",
                metadata: newCart
            });
        }

        let updatedCart;

        if (productExists) {
            // update quantity
            updatedCart = await Cart.findOneAndUpdate(
                {
                    cart_userId: userId,
                    'cart_products.productId': productId,
                    cart_state: 'active'
                },
                {
                    $inc: {'cart_products.$.quantity': quantity}
                },
                {new: true}
            );
        } else {
            // thêm sản phẩm mới vào giỏ
            updatedCart = await Cart.findOneAndUpdate(
                {
                    cart_userId: userId,
                    cart_state: 'active'
                },
                {
                    $push: {
                        cart_products: {
                            productId,
                            shopId,
                            quantity,
                            name: product.product_name,
                            price: product.product_price,
                            shopName: shop.name,
                            product_thumb: product.product_thumb
                        }
                    },
                    $inc: {cart_count_product: 1}
                },
                {new: true}
            );
        }

        return res.status(200).json({
            message: "Cập nhật giỏ hàng thành công",
            status: "success",
            metadata: updatedCart
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            status: "error",
            error: error.message
        });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.user?.userId || req.headers['x-client-id'] || req.params.userId;
        const cart = await Cart.findOne({cart_userId: userId});

        if (!cart) return res.status(404).json({message: "Không tìm thấy giỏ hàng", status: "error"});

        return res.status(200).json({
            message: "Lấy giỏ hàng thành công",
            status: "success",
            metadata: cart
        });
    } catch (error) {
        return res.status(500).json({message: "Server error", status: "error", error: error.message});
    }
};

const updateCart = async (req, res) => {
    try {
        const userId = req.user?.userId || req.headers['x-client-id'] || req.body.userId;
        const {productId, quantity} = req.body;

        const updatedCart = await Cart.findOneAndUpdate(
            {cart_userId: userId, 'cart_products.productId': productId, cart_state: 'active'},
            {$set: {'cart_products.$.quantity': quantity}},
            {new: true}
        );

        return res.status(200).json({
            status: "success",
            message: "Cập nhật số lượng thành công",
            metadata: updatedCart
        });
    } catch (error) {
        return res.status(500).json({message: "Server error", status: "error", error: error.message});
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        const {productId} = req.params;

        const updatedCart = await Cart.findOneAndUpdate(
            {cart_userId: userId, cart_state: 'active'},
            {
                $pull: {cart_products: {productId: productId}},
                $inc: {cart_count_product: -1}
            },
            {new: true}
        );

        return res.status(200).json({
            status: "success",
            message: "Đã xóa sản phẩm khỏi giỏ hàng",
            metadata: updatedCart
        });
    } catch (error) {
        return res.status(500).json({message: "Server error", status: "error", error: error.message});
    }
};

export {
    addToCart,
    getCart,
    updateCart,
    removeFromCart
};