
import Cart from "../models/Cart.js";

const addToCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.body.userId;
        const { productId, shopId, quantity, name, price, shopName, product_thumb } = req.body;

        if (!userId) return res.status(400).json({ message: "Thiếu UserId", status: "error" });

        const userCart = await Cart.findOne({ cart_userId: userId, cart_state: 'active' });

        // Cart chưa tồn tại -> Create New Cart
        if (!userCart) {
            const newCart = await Cart.create({
                cart_userId: userId,
                cart_state: 'active',
                cart_products: [{ productId, shopId, quantity, name, price, shopName, product_thumb }],
                cart_count_product: 1
            });

            return res.status(200).json({
                message: "Thêm vào giỏ hàng thành công",
                status: "success",
                metadata: newCart
            });
        }

        //Cart đã có -> Check if Product exists in Cart
        const productExists = userCart.cart_products.find(
            (product) => product.productId === productId
        );

        let updatedCart;

        if (productExists) {
            // Sản phẩm đã có trong giỏ -> Update quantity ($inc)
            updatedCart = await Cart.findOneAndUpdate(
                {
                    cart_userId: userId,
                    'cart_products.productId': productId,
                    cart_state: 'active'
                },
                {
                    $inc: { 'cart_products.$.quantity': quantity }
                },
                { new: true }
            );
        } else {
            //Sản phẩm mới -> Push to 'cart_products' array
            updatedCart = await Cart.findOneAndUpdate(
                {
                    cart_userId: userId,
                    cart_state: 'active'
                },
                {
                    $push: { cart_products: { productId, shopId, quantity, name, price, shopName, product_thumb } },
                    $inc: { cart_count_product: 1 }
                },
                { new: true }
            );
        }
        return res.status(200).json({
            message: "Cập nhật giỏ hàng thành công",
            status: "success",
            metadata: updatedCart
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.params.userId;
        const cart = await Cart.findOne({ cart_userId: userId });

        if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng", status: "error" });

        return res.status(200).json({
            message: "Lấy giỏ hàng thành công",
            status: "success",
            metadata: cart
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const updateCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.body.userId;
        const { productId, quantity } = req.body;

        const updatedCart = await Cart.findOneAndUpdate(
            { cart_userId: userId, 'cart_products.productId': productId, cart_state: 'active' },
            { $set: { 'cart_products.$.quantity': quantity } },
            { new: true }
        );

        return res.status(200).json({
            status: "success",
            message: "Cập nhật số lượng thành công",
            metadata: updatedCart
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.headers['x-client-id'] || req.params.userId;
        const { productId } = req.params;

        const updatedCart = await Cart.findOneAndUpdate(
            { cart_userId: userId, cart_state: 'active' },
            { 
                $pull: { cart_products: { productId: productId } },
                $inc: { cart_count_product: -1 }
            },
            { new: true }
        );

        return res.status(200).json({
            status: "success",
            message: "Đã xóa sản phẩm khỏi giỏ hàng",
            metadata: updatedCart
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", status: "error", error: error.message });
    }
};

export {
    addToCart,
    getCart,
    updateCart,
    removeFromCart
};