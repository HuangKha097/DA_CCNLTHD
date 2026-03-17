import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trash2, Plus, Minus, CreditCard, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart');
            if (res.data?.status === 'success') {
                setCart(res.data.metadata);
            }
        } catch (error) {
            console.error("Cart error:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            const res = await api.put('/cart', { productId, quantity: newQuantity });
            if (res.data?.status === 'success') {
                setCart(res.data.metadata);
            }
        } catch (error) {
            console.error("Update quantity error:", error);
        }
    };

    const removeItem = async (productId) => {
        try {
            const res = await api.delete(`/cart/${productId}`);
            if (res.data?.status === 'success') {
                setCart(res.data.metadata);
            }
        } catch (error) {
            console.error("Remove item error:", error);
        }
    };

    const calculateTotal = () => {
        if (!cart) return 0;
        return cart.cart_products.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    if (loading) return <div style={{ color: 'var(--text-main)', padding: '100px', textAlign: 'center' }}>Đang tải...</div>;

    if (!cart || cart.cart_products.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: 'var(--text-main)' }}>
                <ShoppingBag size={80} style={{ marginBottom: '2rem', opacity: 0.3 }} />
                <h2>Giỏ hàng của bạn đang trống</h2>
                <button onClick={() => navigate('/')} style={{ marginTop: '1.5rem', padding: '12px 30px', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>
                    Tiếp tục mua sắm
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem 0', color: 'var(--text-main)' }}>
            <h1 style={{ marginBottom: '2rem' }}>Giỏ hàng của bạn</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <AnimatePresence>
                        {cart.cart_products.map((item) => (
                            <motion.div
                                key={item.productId}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-panel"
                                style={{ padding: '1.5rem', borderRadius: '15px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}
                            >
                                <div style={{ width: '100px', height: '100px', background: 'var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img src={item.product_thumb || `https://via.placeholder.com/100?text=${item.name}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.5rem' }}>{item.name}</h3>
                                    <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{item.price.toLocaleString()} VND</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ padding: '8px 12px', color: 'var(--text-main)', background: 'none', border: 'none' }}><Minus size={14} /></button>
                                    <span style={{ width: '30px', textAlign: 'center' }}>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ padding: '8px 12px', color: 'var(--text-main)', background: 'none', border: 'none' }}><Plus size={14} /></button>
                                </div>

                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '120px', textAlign: 'right' }}>
                                    {(item.price * item.quantity).toLocaleString()} VND
                                </div>

                                <button onClick={() => removeItem(item.productId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={20} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Checkout Summary */}
                <div style={{ flex: 1 }}>
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', position: 'sticky', top: '100px' }}>
                        <h3 style={{ margin: '0 0 1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>Tổng thanh toán</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Tạm tính ({cart.cart_count_product} sản phẩm)</span>
                            <span>{calculateTotal().toLocaleString()} VND</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Phí vận chuyển</span>
                            <span style={{ color: '#10b981' }}>Miễn phí</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1.5rem 0', paddingTop: '1.5rem', borderTop: '2px solid var(--card-border)', fontSize: '1.3rem', fontWeight: 'bold' }}>
                            <span>Tổng cộng</span>
                            <span style={{ color: 'var(--primary)' }}>{calculateTotal().toLocaleString()} VND</span>
                        </div>

                        <button
                            onClick={() => navigate('/checkout', { state: { items: cart.cart_products } })}
                            style={{ width: '100%', padding: '15px', background: 'var(--primary)', color: 'white', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                            <CreditCard size={20} /> Thanh toán ngay
                        </button>

                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                Hệ thống đang bảo mật giao dịch của bạn
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
