import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductManager from '../components/ProductManager';
import OrderManager from '../components/OrderManager';
import VoucherManager from '../components/VoucherManager';
import ShopSettings from '../components/ShopSettings';
import { Package, ClipboardList, Settings, LogOut, LayoutDashboard, Tag, TrendingUp, AlertCircle } from 'lucide-react';

const SellerDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [shopInfo, setShopInfo] = useState(null);
    const [stats, setStats] = useState({ totalProducts: 0, pendingOrders: 0, totalRevenue: 0 });
    const [loadingStats, setLoadingStats] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedShop = localStorage.getItem('shop_info');
        const shopId = localStorage.getItem('x-shop-id');

        if (!storedShop || !shopId) {
            navigate('/seller');
            return;
        }

        try {
            const parsedShop = JSON.parse(storedShop);
            setShopInfo(parsedShop);
            fetchStats(shopId);
        } catch (e) {
            console.error("Failed parsing shop data", e);
        }

        const handleSync = () => {
            const updated = localStorage.getItem('shop_info');
            if (updated) setShopInfo(JSON.parse(updated));
        };
        window.addEventListener('shop_updated', handleSync);
        return () => window.removeEventListener('shop_updated', handleSync);
    }, [navigate]);

    const fetchStats = async (id) => {
        try {
            setLoadingStats(true);
            const res = await api.get(`/order/shop/stats?shopId=${id}`);
            if (res.data?.status === 'success') {
                setStats(res.data.metadata);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleShopLogout = () => {
        // Clear shop specific items but keep user session
        localStorage.removeItem('x-shop-id');
        localStorage.removeItem('shop_info');
        navigate('/seller');
    };

    if (!shopInfo) return <div>Loading Shop Secure Sector...</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'products':
                return <ProductManager shopId={shopInfo._id} />;
            case 'orders':
                return <OrderManager shopId={shopInfo._id} />;
            case 'vouchers':
                return <VoucherManager shopId={shopInfo._id} />;
            case 'settings':
                return <ShopSettings shopId={shopInfo._id} />;
            case 'dashboard':
            default:
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Tổng Sản Phẩm</h3>
                                <Package size={20} color="var(--primary)" />
                            </div>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>
                                {loadingStats ? '...' : stats.totalProducts}
                            </p>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Sản phẩm đang kinh doanh</span>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Đơn Hàng Chờ</h3>
                                <AlertCircle size={20} color="var(--secondary)" />
                            </div>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--secondary)' }}>
                                {loadingStats ? '...' : stats.pendingOrders}
                            </p>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Cần được xác nhận ngay</span>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Doanh Thu (Delivered)</h3>
                                <TrendingUp size={20} color="var(--success)" />
                            </div>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'var(--success)' }}>
                                {loadingStats ? '...' : `${stats.totalRevenue.toLocaleString()} đ`}
                            </p>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Từ đơn hàng đã hoàn tất</span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '80vh', gap: '2rem' }}>
            {/* Sidebar Navigation */}
            <aside className="glass-panel" style={{
                width: '260px', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary)', margin: '0 auto 10px' }}></div>
                    <h3 style={{ margin: 0 }}>{shopInfo.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Kênh Người Bán</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                            borderRadius: '8px', textAlign: 'left',
                            background: activeTab === 'dashboard' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)'
                        }}>
                        <LayoutDashboard size={18} /> Tổng Quan
                    </button>

                    <button
                        onClick={() => setActiveTab('products')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                            borderRadius: '8px', textAlign: 'left',
                            background: activeTab === 'products' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)'
                        }}>
                        <Package size={18} /> Quản Lý Sản Phẩm
                    </button>

                    <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                            borderRadius: '8px', textAlign: 'left',
                            background: activeTab === 'orders' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)'
                        }}>
                        <ClipboardList size={18} /> Quản Lý Đơn Hàng
                    </button>

                    <button
                        onClick={() => setActiveTab('vouchers')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                            borderRadius: '8px', textAlign: 'left',
                            background: activeTab === 'vouchers' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'vouchers' ? 'var(--primary)' : 'var(--text-muted)'
                        }}>
                        <Tag size={18} /> Quản Lý Voucher
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                            borderRadius: '8px', textAlign: 'left',
                            background: activeTab === 'settings' ? 'var(--card-border)' : 'transparent',
                            color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)',
                            marginTop: '0.5rem'
                        }}>
                        <Settings size={18} /> Cài Đặt Shop
                    </button>

                    <div style={{ flex: 1 }}></div>



                </nav>
            </aside>

            {/* Main Internal Content Area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>
                        {activeTab === 'dashboard' ? 'Tổng Quan Đối Tác' :
                            activeTab === 'products' ? 'Tất Cả Sản Phẩm' :
                                activeTab === 'vouchers' ? 'Quản Lý Voucher' :
                                    activeTab === 'settings' ? 'Cài Đặt Gian Hàng' : 'Đơn Hàng Của Bạn'}
                    </h1>
                </header>

                {renderContent()}
            </main>
        </div>
    );
};

export default SellerDashboard;
