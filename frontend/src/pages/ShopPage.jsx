import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Tag, Search, Store, Star, Users, Calendar, 
    MessageSquare, CheckCircle2, Award, ChevronRight,
    TrendingUp, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ShopPage = () => {
    const { shopId } = useParams();
    const [shopInfo, setShopInfo] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // all, new, popular
    const [searchQuery, setSearchQuery] = useState('');
    const [discounts, setDiscounts] = useState([]);
    const navigate = useNavigate();

    const loaderRef = useRef(null);

    const fetchShopData = async (pageNum, isInitial = false) => {
        if (!shopId) return;
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            // Fetch Shop Info (only once)
            if (isInitial) {
                const shopRes = await api.post('/shop/info', { shopId });
                if (shopRes.data?.status === 'success') {
                    setShopInfo(shopRes.data.metadata);
                }

                // Fetch real discounts
                const discountRes = await api.get(`/discount/shop/${shopId}`);
                if (discountRes.data?.status === 'success') {
                    setDiscounts(discountRes.data.metadata);
                }
            }

            // Fetch products with pagination
            const productsRes = await api.get(`/product/published/all/${shopId}?page=${pageNum}&limit=12`);
            if (productsRes.data?.status === 'success') {
                const newProducts = productsRes.data.metadata.products;
                if (isInitial) {
                    setProducts(newProducts);
                } else {
                    setProducts(prev => [...prev, ...newProducts]);
                }
                
                if (newProducts.length < 12) setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching shop data", error);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchShopData(1, true);
    }, [shopId]);

    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchShopData(nextPage);
            }
        }, { threshold: 0.1 });

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [page, hasMore, loading, loadingMore]);

    const handleCopyDiscount = (code) => {
        navigator.clipboard.writeText(code);
        alert(`Mã ${code} đã được sao chép!`);
    };

    const handleFollow = () => {
        const userId = localStorage.getItem('client_id');
        if (!userId) {
            alert("Vui lòng đăng nhập để theo dõi gian hàng này!");
            navigate('/login?auth_required=true');
            return;
        }
        // Logic for following shop would go here
        alert("Tính năng theo dõi sẽ sớm ra mắt!");
    };

    const handleChat = () => {
        const userId = localStorage.getItem('client_id');
        if (!userId) {
            alert("Vui lòng đăng nhập để nhắn tin với gian hàng!");
            navigate('/login?auth_required=true');
            return;
        }
        // Logic for chat would go here
        alert("Tính năng chat sẽ sớm ra mắt!");
    };

    if (loading && page === 1) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }}
                />
                Đang mở gian hàng...
            </div>
        );
    }

    if (!shopInfo) {
        return (
            <div className="glass-panel" style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', textAlign: 'center', padding: '2rem' }}>
                <Store size={64} color="var(--text-muted)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Không tìm thấy gian hàng</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Gian hàng có thể không tồn tại hoặc đã bị khóa.</p>
                <Link to="/" style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                    Quay lại trang chủ
                </Link>
            </div>
        );
    }

    const filteredProducts = products.filter(p => 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ margin: '0 auto' }}>
            {/* --- PREMIUM SHOP HEADER --- */}
            <div className="glass-panel" style={{ borderRadius: '24px', overflow: 'hidden', marginBottom: '3rem', position: 'relative' }}>
                {/* Cover Image */}
                <div style={{ 
                    height: '240px', 
                    background: shopInfo?.coverInfo 
                        ? `url(${shopInfo.coverInfo}) center/cover no-repeat` 
                        : 'var(--card-bg)',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
                </div>

                {/* Profile Card Overlay */}
                <div style={{ 
                    padding: '0 2rem 2rem', 
                    marginTop: '-60px', 
                    position: 'relative', 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: '2rem',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ 
                            width: '140px', height: '140px', borderRadius: '24px', 
                            background: 'var(--bg-card)', padding: '6px', 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <img 
                                src={shopInfo?.logo || 'https://via.placeholder.com/150?text=Shop'} 
                                style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }} 
                                alt={shopInfo?.name}
                            />
                        </div>
                        {shopInfo?.verified && (
                            <div style={{ 
                                position: 'absolute', bottom: '-10px', right: '-10px', 
                                background: 'var(--primary)', color: 'white', 
                                padding: '4px 8px', borderRadius: '20px', fontSize: '0.7rem',
                                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                                border: '3px solid var(--bg-card)'
                            }}>
                                <CheckCircle2 size={12} /> VERIFIED
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: '900', color: 'var(--text-main)' }}>{shopInfo?.name}</h1>
                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Store size={14} /> {shopInfo?.status === 'active' ? 'Đang hoạt động' : 'Tạm nghỉ'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} className="text-amber-500" /> {shopInfo?.stats?.avgRating || '5.0'} ({shopInfo?.stats?.totalReviews || 0} Đánh giá)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                            <button 
                                onClick={handleFollow}
                                style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Users size={18} /> Theo Dõi
                            </button>
                            <button 
                                onClick={handleChat}
                                className="glass-panel" style={{ padding: '10px 24px', color: 'var(--text-main)', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--card-border)' }}
                            >
                                <MessageSquare size={18} /> Chat
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>{shopInfo?.stats?.totalProducts || 0}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Sản phẩm</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--secondary)', fontSize: '1.2rem', fontWeight: 'bold' }}>{shopInfo?.stats?.responseRate || '98%'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Phản hồi</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>{shopInfo?.stats?.followers || '1.2k'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Người theo dõi</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {shopInfo?.stats?.joinDate ? new Date(shopInfo.stats.joinDate).getFullYear() : '2024'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tham gia</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT SECTION --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
                <main>
                    {/* Navigation & Search */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            {['all', 'new', 'popular'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{ 
                                        padding: '10px 0', 
                                        color: activeTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
                                        borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                                        fontWeight: activeTab === tab ? 'bold' : 'normal',
                                        fontSize: '1rem', background: 'none'
                                    }}
                                >
                                    {tab === 'all' ? 'Tất cả sản phẩm' : tab === 'new' ? 'Sản phẩm mới' : 'Bán chạy'}
                                </button>
                            ))}
                        </div>

                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text"
                                placeholder="Tìm trong gian hàng này..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ 
                                    width: '100%', padding: '10px 10px 10px 40px', background: 'var(--card-bg)',
                                    border: '1px solid var(--card-border)', borderRadius: '10px', color: 'var(--text-main)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                        gap: '1.5rem' 
                    }}>
                        {filteredProducts.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                                <Store size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                Không tìm thấy sản phẩm nào phù hợp.
                            </div>
                        ) : (
                            filteredProducts.map(product => (
                                <Link key={product._id} to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass-panel hover-card" 
                                        style={{ padding: '1rem', borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
                                    >
                                        <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', background: 'var(--card-border)' }}>
                                            <img src={product.product_thumb} alt={product.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', lineClamp: 2 }}>{product.product_name}</h3>
                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{product.product_price.toLocaleString()} đ</span>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã bán 152</div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Loading/Footer for infinite scroll */}
                    {hasMore && !searchQuery && (
                        <div ref={loaderRef} style={{ padding: '3rem', textAlign: 'center' }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                style={{ width: 30, height: 30, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}
                            />
                        </div>
                    )}
                </main>

                <aside>
                    <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Discount Coupons */}
                        {discounts.length > 0 && (
                            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                    <Award color="var(--primary)" size={24} />
                                    <h3 style={{ margin: 0 }}>Ưu Đãi Độc Quyền</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    {discounts.map(discount => (
                                        <div key={discount.discount_code} style={{ 
                                            background: 'var(--card-bg)',
                                            padding: '1.2rem', borderRadius: '12px', position: 'relative',
                                            border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden'
                                        }}>
                                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '40px', height: '40px', background: 'var(--primary)', opacity: 0.1, borderRadius: '50%' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>
                                                        {discount.discount_type === 'percentage' ? `GIẢM ${discount.discount_value}%` : `GIẢM ${discount.discount_value / 1000}k`}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Mã: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{discount.discount_code}</span></div>
                                                </div>
                                                <button 
                                                    onClick={() => handleCopyDiscount(discount.discount_code)}
                                                    style={{ background: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                >
                                                    Lưu
                                                </button>
                                            </div>
                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Đơn tối thiểu {discount.discount_min_order_value.toLocaleString()} đ
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fast Shipping Box */}
                        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6' }}>
                                <Timer size={20} />
                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Vanguard Express</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '10px 0 0' }}>Giao hàng nhanh nội thành trong 2 giờ với các đơn hàng trên 500k.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ShopPage;

