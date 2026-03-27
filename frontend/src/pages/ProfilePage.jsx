import React, { useEffect, useState } from 'react';
import { User, MapPin, Key, Store, LogOut, Coins, Ticket, ChevronRight, Gift, Package, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // profile | address | security | shop | products | orders
    
    // Form States
    const [nameInput, setNameInput] = useState('');
    const [phoneInput, setPhoneInput] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    // Address State
    const [newAddress, setNewAddress] = useState({ city: '', district: '', ward: '', street: '', phone: '' });
    
    const [updating, setUpdating] = useState(false);
    const [vouchers, setVouchers] = useState([]);
    const [orders, setOrders] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchUserData = async () => {
            const userId = localStorage.getItem('client_id');
            const token = localStorage.getItem('access_token');
            
            if (!userId || !token) {
                navigate('/login');
                return;
            }

            try {
                // Ensure backend endpoint matches our UserController.js setup
                const res = await api.get(`/user/info/${userId}`);
                if (res.data?.status === 'success') {
                     setUser(res.data.data);
                     setNameInput(res.data.data.name);
                     setPhoneInput(res.data.data.phone || '');
                     
                     // If they have a shop, sync it silently to local storage for components that need it
                     if(res.data.data.shop) {
                         localStorage.setItem('x-shop-id', res.data.data.shop._id);
                         localStorage.setItem('shop_info', JSON.stringify(res.data.data.shop));
                     }
                }
            } catch (error) {
                console.error("Error fetching user data", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.clear();
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);

    useEffect(() => {
        const fetchVouchers = async () => {
            if (!user) return;
            try {
                const res = await api.get('/coin/my-vouchers');
                if (res.data?.status === 'success') {
                    setVouchers(res.data.metadata);
                }
            } catch (error) {
                console.error("Error fetching vouchers", error);
            }
        };

        const fetchOrders = async () => {
             if (!user) return;
             try {
                 const res = await api.get('/order/my-orders');
                 if (res.data?.status === 'success') {
                     setOrders(res.data.metadata.orders);
                 }
             } catch (error) {
                 console.error("Lỗi tải đơn hàng:", error);
             }
        };

        if (activeTab === 'my_vouchers') {
            fetchVouchers();
        }
        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab, user]);

    if (loading) return <div>Đang tải hồ sơ...</div>;
    if (!user) return <div>Không thể lấy thông tin người dùng.</div>;

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await api.put(`/user/update/${user._id}`, { name: nameInput, phone: phoneInput });
            if (res.data?.status === 'success') {
                setUser({ ...user, name: nameInput, phone: phoneInput });
                alert("Cập nhật hồ sơ thành công!");
            }
        } catch(error) {
            console.error("Lỗi cập nhật:", error);
            alert("Có lỗi xảy ra khi cập nhật hồ sơ");
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await api.put(`/user/password/${user._id}`, { oldPassword, newPassword });
            if (res.data?.status === 'success') {
                alert("Cập nhật mật khẩu thành công!");
                setOldPassword('');
                setNewPassword('');
            }
        } catch(error) {
            console.error("Lỗi đổi pass:", error);
            alert(error.response?.data?.message || "Lỗi thay đổi mật khẩu");
        } finally {
            setUpdating(false);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        if(!newAddress.street || !newAddress.city) return alert("Vui lòng nhập Tỉnh/Thành và Số nhà");
        setUpdating(true);
        try {
            const res = await api.post(`/user/address/${user._id}`, newAddress);
            if (res.data?.status === 'success') {
                setUser({ ...user, address: res.data.data });
                setNewAddress({ city: '', district: '', ward: '', street: '', phone: '' });
            }
        } catch(error) {
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveAddress = async (index) => {
        if(!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
        try {
            const res = await api.delete(`/user/address/${user._id}/${index}`);
            if (res.data?.status === 'success') {
                setUser({ ...user, address: res.data.data });
            }
        } catch(error) {
            console.error(error);
        }
    };

    const handleExchangeCoins = async (voucher) => {
        if (user.coins < voucher.cost) {
            return alert("Bạn không đủ xu để đổi voucher này!");
        }
        if (!window.confirm(`Bạn có chắc muốn dùng ${voucher.cost} xu để đổi lấy voucher ${voucher.value}k?`)) return;

        setUpdating(true);
        try {
            const res = await api.post('/coin/exchange', {
                amount: voucher.cost,
                discountValue: voucher.value
            });
            if (res.data?.status === 'success') {
                alert(`Đổi thành công! Mã giảm giá của bạn: ${res.data.metadata.discountCode}`);
                setUser({ ...user, coins: res.data.metadata.remainingCoins });
            }
        } catch (error) {
            console.error("Lỗi đổi xu:", error);
            alert(error.response?.data?.message || "Lỗi khi đổi xu");
        } finally {
            setUpdating(false);
        }
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'shop':
                if (!user.shop) {
                    return (
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <Store size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                            <h2>Kênh Người Bán Vanguard</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Bạn chưa sở hữu gian hàng nào. Trở thành đối tác ngay hôm nay!</p>
                            <button onClick={() => navigate('/seller')} style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>
                                Đăng Ký Gian Hàng
                            </button>
                        </div>
                    );
                }
                return (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--card-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
                        }}>
                             <Store size={40} color="var(--secondary)" />
                        </div>
                        <h2 style={{ marginBottom: '1rem' }}>Chào mừng trở lại, {user.shop.name}!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                            Tất cả tính năng quản lý sản phẩm, đơn hàng và voucher đã được chuyển sang Dashboard dành riêng cho Đối tác.
                        </p>
                        <button 
                            onClick={() => navigate('/seller/dashboard')} 
                            style={{ 
                                padding: '14px 32px', background: 'var(--secondary)', color: 'white', 
                                borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem',
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            Truy Cập Dashboard Ngay
                        </button>
                    </div>
                );
            case 'address':
                return (
                    <div>
                        <h3 style={{ margin: '0 0 1rem', color: 'var(--text-main)' }}>Danh sách địa chỉ</h3>
                        {user.address && user.address.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                {user.address.map((addr, idx) => (
                                    <div key={idx} style={{ 
                                        padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            {addr.isDefault && <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>[Mặc Định] </span>}
                                            <span style={{ color: 'var(--text-main)' }}>{addr.street}, {addr.ward}, {addr.district || '...'}, {addr.city}</span>
                                            {addr.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>SĐT: {addr.phone}</div>}
                                        </div>
                                        <button onClick={() => handleRemoveAddress(idx)} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '6px' }}>Xóa</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Bạn chưa lưu địa chỉ nào.</p>
                        )}

                        <h3 style={{ margin: '0 0 1rem', color: 'var(--text-main)', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>Thêm địa chỉ mới</h3>
                        <form onSubmit={handleAddAddress} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input type="text" placeholder="Tỉnh / Thành phố" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--card-border)', color: 'var(--text-main)' }} />
                            <input type="text" placeholder="Quận / Huyện" value={newAddress.district} onChange={(e) => setNewAddress({...newAddress, district: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--card-border)', color: 'var(--text-main)' }} />
                            <input type="text" placeholder="Phường / Xã" value={newAddress.ward} onChange={(e) => setNewAddress({...newAddress, ward: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--card-border)', color: 'var(--text-main)' }} />
                            <input type="text" placeholder="Số nhà, Tên đường" value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--card-border)', color: 'var(--text-main)' }} />
                            <input type="text" placeholder="Số điện thoại nhận hàng" value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--card-border)', color: 'var(--text-main)' }} />
                            <div style={{ gridColumn: '1 / -1' }}>
                                <button type="submit" disabled={updating} style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 'bold', width: 'fit-content' }}>Thêm Địa Chỉ</button>
                            </div>
                        </form>
                    </div>
                );
            case 'security':
                return (
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
                        <div>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Mật khẩu hiện tại</label>
                            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-main)', width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Mật khẩu mới</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-main)', width: '100%' }} />
                        </div>
                        <button type="submit" disabled={updating || !oldPassword || !newPassword} style={{
                            padding: '12px 24px', borderRadius: '8px', background: 'var(--danger)',
                            color: 'white', fontWeight: 'bold', marginTop: '1rem',
                            opacity: (updating || !oldPassword || !newPassword) ? 0.5 : 1
                        }}>
                             Cập Nhật Mật Khẩu
                        </button>
                    </form>
                );
            case 'my_vouchers':
                return (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                            <Ticket size={24} color="var(--success)" />
                            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Kho Voucher Vanguard</h3>
                        </div>

                        {vouchers.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
                                <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Bạn chưa có mã giảm giá nào. Hãy đổi xu để nhận quà!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {vouchers.map(v => (
                                    <div key={v._id} className="glass-panel" style={{ 
                                        padding: '1.5rem', borderRadius: '16px', display: 'flex', 
                                        alignItems: 'center', gap: '1.5rem', borderLeft: '4px solid var(--success)',
                                        background: 'var(--card-bg)'
                                    }}>
                                        <div style={{ 
                                            padding: '12px', background: 'rgba(16, 185, 129, 0.1)', 
                                            borderRadius: '12px', color: 'var(--success)'
                                        }}>
                                            <Gift size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 4px', color: 'var(--text-main)' }}>{v.discount_name}</h4>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <span style={{ 
                                                    fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px',
                                                    background: 'var(--card-border)', color: 'var(--success)', fontWeight: 'bold'
                                                }}>{v.discount_code}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    HSD: {new Date(v.discount_end_date).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(v.discount_code);
                                                alert("Đã sao chép mã giảm giá!");
                                            }}
                                            style={{ 
                                                padding: '8px 16px', background: 'var(--card-border)', 
                                                color: 'white', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold'
                                            }}
                                        >
                                            Sao Chép
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'orders':
                return (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                            <ShoppingBag size={24} color="var(--primary)" />
                            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Lịch sử đơn hàng</h3>
                        </div>

                        {orders.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
                                <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {orders.map(order => (
                                    <div key={order._id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid var(--primary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                                            <span style={{ 
                                                fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px',
                                                background: 'var(--card-border)', color: 'var(--primary)', fontWeight: 'bold'
                                            }}>{order.order_status.toUpperCase()}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {order.order_products.map((p, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span>{p.name} x{p.quantity}</span>
                                                    <span>{p.price.toLocaleString()} đ</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: '1rem', textAlign: 'right', borderTop: '1px dashed var(--card-border)', paddingTop: '0.8rem' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '10px' }}>Tổng cộng:</span>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>{order.order_checkout.totalApplyDiscount.toLocaleString()} đ</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'rewards':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ 
                            padding: '2.5rem', borderRadius: '20px', 
                            background: 'var(--card-border)',
                            border: '1px solid rgba(249, 115, 22, 0.3)', textAlign: 'center'
                        }}>
                             <div style={{ 
                                 width: '60px', height: '60px', borderRadius: '50%', 
                                 background: 'rgba(249, 115, 22, 0.2)', color: 'var(--primary)',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 margin: '0 auto 1rem', border: '2px solid var(--primary)'
                             }}>
                                 <Coins size={32} />
                             </div>
                             <h3 style={{ margin: '0 0 0.5rem', color: 'white', fontSize: '1.2rem' }}>Số Dư Vanguard Coins</h3>
                             <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)', lineHeight: 1 }}>
                                 {user.coins?.toLocaleString() || 0}
                             </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                <Gift size={20} color="var(--primary)" />
                                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Đổi Voucher Giảm Giá</h3>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {[
                                    { id: 1, value: 50, cost: 5000, color: '#f97316' },
                                    { id: 2, value: 100, cost: 9000, color: '#ea580c' },
                                    { id: 3, value: 200, cost: 17000, color: '#c2410c' }
                                ].map(voucher => (
                                    <div key={voucher.id} className="glass-panel" style={{ 
                                        padding: '1.5rem', borderRadius: '16px', display: 'flex', 
                                        flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${voucher.color}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Giảm {voucher.value}k</h4>
                                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cho đơn hàng từ {voucher.value * 2}k</p>
                                            </div>
                                            <Ticket size={24} color={voucher.color} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 'bold' }}>
                                                <Coins size={14} /> {voucher.cost.toLocaleString()} xu
                                            </div>
                                            <button 
                                                onClick={() => handleExchangeCoins(voucher)}
                                                disabled={updating || (user.coins < voucher.cost)}
                                                style={{ 
                                                    padding: '8px 16px', borderRadius: '8px', 
                                                    background: user.coins >= voucher.cost ? 'var(--primary)' : 'var(--card-border)',
                                                    color: user.coins >= voucher.cost ? 'white' : 'var(--text-muted)',
                                                    fontWeight: 'bold', fontSize: '0.9rem'
                                                }}
                                            >
                                                Đổi Ngay
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tên hiển thị</label>
                                <input 
                                    type="text" 
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    style={{
                                        padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)',
                                        background: 'var(--bg-color)', color: 'white'
                                    }} 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Số điện thoại</label>
                                <input 
                                    type="text" 
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder="Điện thoại liên hệ"
                                    style={{
                                        padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)',
                                        background: 'var(--bg-color)', color: 'white'
                                    }} 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email (Không thể đổi)</label>
                                <input type="email" defaultValue={user.email} disabled style={{
                                    padding: '12px', borderRadius: '8px', border: 'none',
                                    background: 'var(--card-border)', color: 'var(--text-muted)'
                                }} />
                            </div>
                        </div>

                        <button type="submit" disabled={updating} style={{
                            padding: '12px 24px', borderRadius: '8px', background: 'var(--primary)',
                            color: 'white', fontWeight: 'bold', width: 'fit-content', marginTop: '1rem',
                            opacity: updating ? 0.7 : 1
                        }}>
                             {updating ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}
                        </button>
                    </form>
                );
        }
    };

    return (
        <div style={{ margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Trung Tâm Quản Lý</h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Hồ sơ cá nhân & Đối tác bán hàng</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '2rem' }}>
                {/* Sidebar Menu */}
                <div className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tài Khoản</h4>
                        <button onClick={() => setActiveTab('profile')} style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            padding: '12px', borderRadius: '8px', 
                            background: activeTab === 'profile' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'profile' ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'left'
                        }}>
                             <User size={18} /> Thông tin cá nhân
                        </button>
                        <button onClick={() => setActiveTab('address')} style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            padding: '12px', borderRadius: '8px', 
                            background: activeTab === 'address' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'address' ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'left'
                        }}>
                             <MapPin size={18} /> Địa chỉ
                        </button>
                        <button onClick={() => setActiveTab('security')} style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            padding: '12px', borderRadius: '8px', 
                            background: activeTab === 'security' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'security' ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'left'
                        }}>
                             <Key size={18} /> Bảo mật
                        </button>
                        <button onClick={() => setActiveTab('rewards')} style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            padding: '12px', borderRadius: '8px', 
                            background: activeTab === 'rewards' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'rewards' ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'left'
                        }}>
                             <Coins size={18} /> Vanguard Rewards
                        </button>
                        <button onClick={() => setActiveTab('my_vouchers')} style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            padding: '12px', borderRadius: '8px', 
                            background: activeTab === 'my_vouchers' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'my_vouchers' ? 'var(--success)' : 'var(--text-muted)', textAlign: 'left'
                        }}>
                             <Ticket size={18} /> Mã Giảm Giá Của Tôi
                        </button>
                        <button onClick={() => setActiveTab('orders')} style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            padding: '12px', borderRadius: '8px', 
                            background: activeTab === 'orders' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'left'
                        }}>
                             <ShoppingBag size={18} /> Đơn hàng của tôi
                        </button>
                    </nav>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h4 style={{ color: 'var(--secondary)', margin: '0 0 0.5rem 10px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Kênh Bán Hàng</h4>
                        <button onClick={() => setActiveTab('shop')} style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            padding: '12px', borderRadius: '8px', 
                            background: activeTab === 'shop' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'shop' ? 'var(--secondary)' : 'var(--text-muted)', textAlign: 'left'
                        }}>
                             <Store size={18} /> Kênh Đối Tác
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                        <div style={{ 
                            width: '100px', height: '100px', borderRadius: '50%', 
                            backgroundColor: 'var(--primary)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 'bold'
                        }}>
                             {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                             <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>{user.name}</h2>
                             <p style={{ margin: 0, color: 'var(--text-muted)' }}>{user.email}</p>
                             <div style={{ 
                                 display: 'inline-block',
                                 marginTop: '0.5rem',
                                 padding: '4px 12px',
                                 borderRadius: '20px',
                                 backgroundColor: 'var(--card-border)',
                                 color: 'var(--primary)',
                                 fontSize: '0.8rem',
                                 fontWeight: 'bold'
                             }}>
                                 {user.shop ? 'Đối Tác Bán Hàng' : 'Thành viên Vanguard'}
                             </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--card-border)', margin: '2rem 0' }}></div>

                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
