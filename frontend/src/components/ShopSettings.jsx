import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Store, Image, Type, Save, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const ShopSettings = ({ shopId }) => {
    const navigate = useNavigate();
    const [shopName, setShopName] = useState('');
    const [shopLogo, setShopLogo] = useState('');
    const [shopCoverInfo, setShopCoverInfo] = useState('');
    const [shopStatus, setShopStatus] = useState('active');
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShopInfo = async () => {
            try {
                setLoading(true);
                const res = await api.post('/shop/info', { shopId });
                if (res.data?.status === 'success') {
                    const info = res.data.metadata;
                    setShopName(info.name || '');
                    setShopLogo(info.logo || '');
                    setShopCoverInfo(info.coverInfo || '');
                    setShopStatus(info.status || 'active');
                }
            } catch (error) {
                console.error("Error fetching shop info:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchShopInfo();
    }, [shopId]);

    const handleUpdateShopSettings = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await api.put('/shop/update', { 
                shopId, 
                shopName, 
                shopLogo, 
                shopCoverInfo 
            });
            if (res.data?.status === 'success') {
                alert("Cập nhật Shop thành công!");
                // Update local storage to keep it synced
                const storedShop = JSON.parse(localStorage.getItem('shop_info') || '{}');
                localStorage.setItem('shop_info', JSON.stringify({ ...storedShop, name: shopName, logo: shopLogo, coverInfo: shopCoverInfo }));
                
                // Trigger a page refresh or state lift if needed, 
                // but since SellerDashboard reads from localStorage on mount, 
                // this will be picked up next time or can be handled via window event
                window.dispatchEvent(new Event('shop_updated'));
            }
        } catch (error) {
            console.error("Lỗi cập nhật Shop:", error);
            alert("Có lỗi xảy ra khi cập nhật gian hàng");
        } finally {
            setUpdating(false);
        }
    };

    const handleDisableShop = async () => {
        const actionLabel = shopStatus === 'active' ? 'vô hiệu hoá' : 'kích hoạt lại';
        if (!window.confirm(`Bạn có chắc muốn ${actionLabel} gian hàng?`)) return;
        setUpdating(true);
        try {
            const res = await api.put('/shop/disable', { shopId });
            if (res.data?.status === 'success') {
                const newStatus = shopStatus === 'active' ? 'inactive' : 'active';
                setShopStatus(newStatus);
                alert(`Đã ${actionLabel} gian hàng.`);
                // Update local storage
                const storedShop = JSON.parse(localStorage.getItem('shop_info') || '{}');
                localStorage.setItem('shop_info', JSON.stringify({ ...storedShop, status: newStatus }));
                window.dispatchEvent(new Event('shop_updated'));
            }
        } catch (error) {
            console.error(error);
            alert(`Có lỗi xảy ra khi ${actionLabel}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteShop = async () => {
        const confirm1 = window.confirm("CẢNH BÁO: Hành động này sẽ XÓA VĨNH VIỄN gian hàng, thông tin doanh thu và TOÀN BỘ sản phẩm. Bạn có chắc chắn?");
        if (!confirm1) return;
        const confirm2 = window.confirm("Bạn có THỰC SỰ chắc chắn muốn xoá gian hàng? Hành động này KHÔNG THỂ HOÀN TÁC.");
        if (!confirm2) return;

        setUpdating(true);
        try {
            const res = await api.delete(`/shop/${shopId}`);
            if (res.data?.status === 'success') {
                alert("Đã xoá gian hàng vĩnh viễn.");
                localStorage.removeItem('shop_info');
                localStorage.removeItem('x-shop-id');
                // Remove vendor from internal logged user context if needed, but navigation will reload user role
                navigate('/seller');
            }
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra khi xoá shop");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div>Đang tải cài đặt gian hàng...</div>;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel" 
            style={{ padding: '2.5rem', borderRadius: '20px', maxWidth: '800px' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem' }}>
                <Store size={32} color="var(--success)" />
                <h2 style={{ margin: 0 }}>Thiết Lập <span className="gradient-text">Gian Hàng</span></h2>
            </div>

            <form onSubmit={handleUpdateShopSettings} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Type size={16} /> Tên Gian Hàng
                        </label>
                        <input 
                            type="text" 
                            value={shopName} 
                            onChange={(e) => setShopName(e.target.value)} 
                            required 
                            style={{ 
                                padding: '14px', borderRadius: '12px', border: '1px solid var(--card-border)', 
                                background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' 
                            }} 
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Image size={16} /> URL Logo Shop
                        </label>
                        <input 
                            type="text" 
                            value={shopLogo} 
                            onChange={(e) => setShopLogo(e.target.value)} 
                            placeholder="https://..." 
                            style={{ 
                                padding: '14px', borderRadius: '12px', border: '1px solid var(--card-border)', 
                                background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' 
                            }} 
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         Mô Tả / Thông Tin Gian Hàng
                    </label>
                    <textarea 
                        value={shopCoverInfo} 
                        onChange={(e) => setShopCoverInfo(e.target.value)} 
                        placeholder="Hãy giới thiệu về gian hàng của bạn..."
                        style={{ 
                            padding: '14px', borderRadius: '12px', border: '1px solid var(--card-border)', 
                            background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem',
                            minHeight: '150px', resize: 'vertical'
                        }} 
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                        type="submit" 
                        disabled={updating} 
                        className="btn-primary"
                        style={{ 
                            padding: '14px 40px', borderRadius: '12px', background: 'var(--primary)', 
                            color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px',
                            border: 'none', cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                    >
                        {updating ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                <Save size={20} />
                            </motion.div>
                        ) : <Save size={20} />}
                        {updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                </div>
            </form>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'var(--danger)' }}>
                    <ShieldAlert size={24} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Khu Vực Nguy Hiểm</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: shopStatus === 'active' ? '1px solid rgba(255, 165, 0, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: shopStatus === 'active' ? '#ffa500' : 'var(--success)' }}>
                                <AlertTriangle size={18} /> {shopStatus === 'active' ? 'Vô Hiệu Hoá Gian Hàng' : 'Kích Hoạt Lại Gian Hàng'}
                            </span>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{shopStatus === 'active' ? 'Tạm ẩn gian hàng khỏi hệ thống. Bạn có thể kích hoạt lại sau.' : 'Mở lại gian hàng để tiếp tục kinh doanh kinh doanh hiển thị trên hệ thống.'}</p>
                        </div>
                        <button type="button" onClick={handleDisableShop} disabled={updating} style={{ padding: '10px 20px', borderRadius: '8px', background: shopStatus === 'active' ? 'rgba(255, 165, 0, 0.1)' : 'rgba(34, 197, 94, 0.1)', border: shopStatus === 'active' ? '1px solid #ffa500' : '1px solid var(--success)', color: shopStatus === 'active' ? '#ffa500' : 'var(--success)', cursor: 'pointer', fontWeight: 'bold' }}>
                            {shopStatus === 'active' ? 'Vô Hiệu Hoá' : 'Kích Hoạt Lại'}
                        </button>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                                <ShieldAlert size={18} /> Xoá Vĩnh Viễn
                            </span>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Xoá vĩnh viễn gian hàng, thông tin và toàn bộ sản phẩm của gian hàng.</p>
                        </div>
                        <button type="button" onClick={handleDeleteShop} disabled={updating} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold' }}>
                            Xoá Gian Hàng
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ShopSettings;
