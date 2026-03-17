import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Store } from 'lucide-react';

const SellerAuth = () => {
    const [isLogin, setIsLogin] = useState(true);
    // login needs: shopEmail, passwordOnwer (typo in backend)
    // signup needs: name, email, ownerId
    const [formData, setFormData] = useState({ shopName: '', shopEmail: '', passwordOwner: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            if (isLogin) {
                const res = await api.post('/shop/login', {
                    shopEmail: formData.shopEmail,
                    passwordOnwer: formData.passwordOwner // matching backend typo passwordOnwer
                });

                if (res.data?.status === 'success') {
                    const shop = res.data.metadata.shop;
                    localStorage.setItem('x-shop-id', shop._id); // Save Shop ID for headers
                    localStorage.setItem('shop_info', JSON.stringify(shop));
                    navigate('/seller/dashboard');
                } else {
                    setError('Lỗi xác thực shop');
                }
            } else {
                // Register Shop
                const ownerId = localStorage.getItem('client_id');
                if (!ownerId) {
                    setError('Bạn cần đăng nhập tài khoản User trước khi tạo Shop');
                    setTimeout(() => navigate('/login'), 2000);
                    return;
                }

                const res = await api.post('/shop/signup', {
                    name: formData.shopName,
                    email: formData.shopEmail,
                    ownerId: ownerId  // Connect to current user
                });
                
                if (res.data?.status === 'success') {
                    alert('Đăng ký Shop thành công! Vui lòng đăng nhập.');
                    setIsLogin(true);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <form onSubmit={handleSubmit} className="glass-panel" style={{ 
                width: '100%', maxWidth: '450px', padding: '2.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '50%', marginBottom: '1rem' }}>
                         <Store size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', margin: 0 }} className="gradient-text">
                        Vanguard Seller Center
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                        {isLogin ? 'Quản lý cửa hàng của bạn' : 'Trở thành đối tác bán hàng'}
                    </p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {!isLogin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tên Shop</label>
                        <input type="text" required style={{ 
                                padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', 
                                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none'
                        }}
                        value={formData.shopName} onChange={(e) => setFormData({...formData, shopName: e.target.value})} />
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Shop</label>
                    <input type="email" required style={{ 
                            padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', 
                            backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none'
                    }}
                    value={formData.shopEmail} onChange={(e) => setFormData({...formData, shopEmail: e.target.value})} />
                </div>

                {isLogin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Mật khẩu (Tài khoản User)</label>
                        <input type="password" required style={{ 
                                padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', 
                                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none'
                        }}
                        value={formData.passwordOwner} onChange={(e) => setFormData({...formData, passwordOwner: e.target.value})} />
                    </div>
                )}

                <button type="submit" style={{
                    padding: '12px', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.5rem'
                }}>
                    {isLogin ? 'Đăng Nhập Kênh Người Bán' : 'Đăng Ký Shop Ngay'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                    {isLogin ? "Chưa có cửa hàng? " : "Đã có cửa hàng? "}
                    <span onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isLogin ? 'Tạo ngay' : 'Đăng nhập'}
                    </span>
                </p>
            </form>
        </div>
    );
};

export default SellerAuth;
