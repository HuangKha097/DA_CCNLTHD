import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
    MapPin, CreditCard, ShoppingBag, ChevronRight, 
    CheckCircle2, AlertCircle, Ticket, Truck, ArrowLeft,
    ShieldCheck, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [items, setItems] = useState(location.state?.items || []);
    const [user, setUser] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ street: '', ward: '', district: '', city: '', phone: '' });
    
    const [shopOrders, setShopOrders] = useState([]);
    const [grandTotal, setGrandTotal] = useState(0);
    const [appliedDiscounts, setAppliedDiscounts] = useState({}); // { shopId: { code, amount } }
    
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (items.length === 0) {
            navigate('/cart');
            return;
        }
        fetchCheckoutData();
    }, []);

    const fetchCheckoutData = async () => {
        setVerifying(true);
        try {
            const userId = localStorage.getItem('client_id');
            const [userRes, reviewRes] = await Promise.all([
                api.get(`/user/info/${userId}`),
                api.post('/order/checkout/review', { cartItems: items })
            ]);

            if (userRes.data?.status === 'success') {
                setUser(userRes.data.data);
                setAddresses(userRes.data.data.address || []);
            }

            if (reviewRes.data?.status === 'success') {
                setShopOrders(reviewRes.data.metadata.shopOrders);
                setGrandTotal(reviewRes.data.metadata.grandTotal);
            }
        } catch (err) {
            console.error("Checkout review failed:", err);
            setError(err.response?.data?.message || "Không thể tải thông tin thanh toán. Vui lòng thử lại.");
        } finally {
            setVerifying(false);
        }
    };

    const handleApplyDiscount = async (shopId, code) => {
        if (!code.trim()) return;
        setLoading(true);
        try {
            const userId = localStorage.getItem('client_id');
            const shopOrder = shopOrders.find(s => s.shopId.toString() === shopId.toString());
            
            const res = await api.post('/discount/amount', {
                code,
                shopId,
                userId,
                orderTotal: shopOrder.totalPrice
            });

            if (res.data?.status === 'success') {
                setAppliedDiscounts(prev => ({
                    ...prev,
                    [shopId]: { code, amount: res.data.metadata.discountAmount }
                }));
                alert("Áp dụng mã giảm giá thành công!");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Mã giảm giá không hợp lệ");
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const selectedAddress = showNewAddressForm ? newAddress : addresses[selectedAddressIndex];
            
            if (!selectedAddress || !selectedAddress.street || !selectedAddress.city) {
                alert("Vui lòng chọn hoặc nhập mã địa chỉ giao hàng");
                setLoading(false);
                return;
            }

            const payload = {
                cartItems: items,
                shipping: { ...selectedAddress, customerName: user?.name },
                payment: { method: 'cod' },
                discounts: appliedDiscounts // Pass applied discounts to backend
            };

            const res = await api.post('/order/checkout', payload);

            if (res.data?.status === 'success') {
                navigate('/profile', { state: { tab: 'orders', message: "Đặt hàng thành công!" } });
            }
        } catch (err) {
            alert(err.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const calculateFinalTotal = () => {
        const discountSum = Object.values(appliedDiscounts).reduce((sum, d) => sum + d.amount, 0);
        return grandTotal - discountSum;
    };

    if (verifying) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }}
                />
                <span className="gradient-text" style={{ fontWeight: 'bold' }}>Vanguard</span> Checkout: Đang chuẩn bị đơn hàng...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                <AlertCircle size={64} color="var(--danger)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Rất tiếc!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
                <button onClick={() => navigate('/cart')} className="glass-panel" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRadius: '12px', fontWeight: 'bold' }}>
                    Quay lại giỏ hàng
                </button>
            </div>
        );
    }

    return (
        <div style={{ margin: '0 auto', padding: '0 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                   <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Xác nhận <span className="gradient-text">Thanh Toán</span></h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* --- SHIPPING ADDRESS --- */}
                    <section className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <MapPin size={24} color="var(--primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Địa Chỉ Nhận Hàng</h2>
                        </div>

                        {addresses.length > 0 && !showNewAddressForm ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {addresses.map((addr, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedAddressIndex(idx)}
                                        style={{ 
                                            padding: '1rem', borderRadius: '12px', cursor: 'pointer',
                                            border: selectedAddressIndex === idx ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                                            background: selectedAddressIndex === idx ? 'var(--card-border)' : 'var(--card-bg)',
                                            display: 'flex', alignItems: 'center', gap: '15px'
                                        }}
                                    >
                                        <div style={{ 
                                            width: '20px', height: '20px', borderRadius: '50%', 
                                            border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                        }}>
                                            {selectedAddressIndex === idx && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                                                {user?.name} | {addr.phone || user?.phone || 'Chưa có SĐT'}
                                                {idx === 0 && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--primary)', color: 'white', borderRadius: '4px' }}>MẶC ĐỊNH</span>}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                                                {addr.street}, {addr.ward}, {addr.district || '...'}, {addr.city}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setShowNewAddressForm(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '10px' }}
                                >
                                    <PlusCircle size={18} /> Thêm địa chỉ mới
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input type="text" placeholder="Họ và tên" defaultValue={user?.name} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                                    <input type="text" placeholder="Số điện thoại" value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input type="text" placeholder="Tỉnh/Thành phố" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                                    <input type="text" placeholder="Quận/Huyện" value={newAddress.district} onChange={(e) => setNewAddress({...newAddress, district: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                                </div>
                                <input type="text" placeholder="Phường/Xã" value={newAddress.ward} onChange={(e) => setNewAddress({...newAddress, ward: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                                <input type="text" placeholder="Số nhà, tên đường" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-main)' }} />
                                
                                {addresses.length > 0 && (
                                    <button onClick={() => setShowNewAddressForm(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '8px' }}>
                                        Quay lại địa chỉ cũ
                                    </button>
                                )}
                            </div>
                        )}
                    </section>

                    {/* --- PRODUCTS REVIEW --- */}
                    {shopOrders.map((shopOrder, sIdx) => (
                        <section key={shopOrder.shopId} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                                < ShoppingBag size={20} color="var(--secondary)" />
                                <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{shopOrder.items[0]?.shopName || 'Gian Hàng Vanguard'}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {shopOrder.items.map((item, iIdx) => (
                                    <div key={iIdx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--card-border)', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={item.product_thumb || item.productId?.product_thumb || `https://via.placeholder.com/80?text=${item.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '500', marginBottom: '4px', color: 'var(--text-main)' }}>{item.name}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                 <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>x{item.quantity}</div>
                                                 <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{item.price.toLocaleString()} đ</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                    <Ticket size={20} color="var(--primary)" />
                                    <input 
                                        type="text" 
                                        placeholder="Nhập mã voucher của Shop" 
                                        style={{ 
                                            background: 'var(--bg-color)', border: '1px solid var(--card-border)', 
                                            padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)', maxWidth: '200px' 
                                        }}
                                        id={`discount-${shopOrder.shopId}`}
                                    />
                                    <button 
                                        onClick={() => {
                                            const code = document.getElementById(`discount-${shopOrder.shopId}`).value;
                                            handleApplyDiscount(shopOrder.shopId.toString(), code);
                                        }}
                                        style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Áp dụng
                                    </button>
                                </div>
                                {appliedDiscounts[shopOrder.shopId] && (
                                    <div style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        Đã giảm: - {appliedDiscounts[shopOrder.shopId].amount.toLocaleString()} đ
                                    </div>
                                )}
                                <div style={{ fontSize: '1rem' }}>
                                    Thành tiền ({shopOrder.items.length} SP): <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.2rem' }}>
                                        {(shopOrder.totalPrice - (appliedDiscounts[shopOrder.shopId]?.amount || 0)).toLocaleString()} đ
                                    </span>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                {/* --- SIDEBAR SUMMARY --- */}
                <aside>
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', position: 'sticky', top: '100px' }}>
                        <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>Tóm tắt đơn hàng</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tiền hàng ({items.length} SP)</span>
                                <span style={{ color: 'var(--text-main)' }}>{grandTotal.toLocaleString()} đ</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Phí vận chuyển</span>
                                <span style={{ color: 'var(--success)' }}>Miễn phí</span>
                            </div>
                            
                            {Object.keys(appliedDiscounts).length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                                    <span>Voucher giảm giá</span>
                                    <span>- {Object.values(appliedDiscounts).reduce((s, d) => s + d.amount, 0).toLocaleString()} đ</span>
                                </div>
                            )}

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }}></div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>Tổng cộng</span>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: '900' }}>{calculateFinalTotal().toLocaleString()} đ</div>
                                    <div style={{ fontSize: '0.75rem' }}>(Đã bao gồm VAT)</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '1rem', margin: '1.5rem 0', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                             <CreditCard size={20} color="#10b981" />
                             <div style={{ fontSize: '0.9rem' }}>Thanh toán khi nhận hàng (COD)</div>
                        </div>

                        <button 
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="hover-glow"
                            style={{ 
                                width: '100%', padding: '1.2rem', background: 'var(--primary)', color: 'white', 
                                border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '1.1rem',
                                cursor: 'pointer', transition: 'all 0.3s',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Đang xác nhận...' : 'ĐẶT HÀNG NGAY'}
                        </button>

                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <ShieldCheck size={14} color="var(--success)" /> Bảo vệ người mua Vanguard 100%
                            </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <Truck size={14} color="var(--primary)" /> Giao hàng bởi Vanguard Logistics
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CheckoutPage;
