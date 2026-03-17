import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Store, Image, Type, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const ShopSettings = ({ shopId }) => {
    const [shopName, setShopName] = useState('');
    const [shopLogo, setShopLogo] = useState('');
    const [shopCoverInfo, setShopCoverInfo] = useState('');
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
        </motion.div>
    );
};

export default ShopSettings;
