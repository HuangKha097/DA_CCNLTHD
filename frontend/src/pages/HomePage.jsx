import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Gift, Zap, TrendingUp, Monitor, Tv, Briefcase, ChevronRight, X, Coins, CheckCircle2, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VanguardCatcher from '../components/VanguardCatcher';

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [checkInState, setCheckInState] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showGameModal, setShowGameModal] = useState(false);
    const [gameResult, setGameResult] = useState(null);
    const [isOpening, setIsOpening] = useState(false);
    const [showArcadeModal, setShowArcadeModal] = useState(false);
    const [arcadeReward, setArcadeReward] = useState(null);
    const [currentBanner, setCurrentBanner] = useState(0);

    const banners = [
        {
            url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop',
            title: 'MacBook Pro M3 Max',
            desc: 'Hiere năng vượt trội. Tiết kiệm tới 15%.',
            tag: 'Siêu Sale Giờ Vàng'
        },
        {
            url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2000&auto=format&fit=crop',
            title: 'Gaming Setup Pro',
            desc: 'Trải nghiệm đỉnh cao với dàn máy mới nhất.',
            tag: 'Ưu Đãi Game Thủ'
        },
        {
            url: 'https://images.unsplash.com/photo-1593642632823-8f785bc67e73?q=80&w=2000&auto=format&fit=crop',
            title: 'Phụ Kiện Công Nghệ',
            desc: 'Giảm giá cực sâu các mẫu tai nghe, chuột.',
            tag: 'Sale Cuối Tuần'
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % banners.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const loaderRef = React.useRef(null);

    const fetchProducts = async (pageNum, isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            const res = await api.get(`/product/all?page=${pageNum}&limit=12`);
            if (res.data?.status === 'success') {
                const newProducts = res.data.metadata.products;
                if (isInitial) {
                    setProducts(newProducts);
                } else {
                    setProducts(prev => [...prev, ...newProducts]);
                }
                
                // If we got fewer products than the limit, there are no more products
                if (newProducts.length < 12) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error("Error fetching homepage products", error);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchProducts(1, true);
    }, []);

    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchProducts(nextPage);
            }
        }, { threshold: 0.1 });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [page, hasMore, loading, loadingMore]);

    const handleCheckIn = async () => {
        const userId = localStorage.getItem('client_id');
        if (!userId) {
            alert("Vui lòng đăng nhập để điểm danh");
            return;
        }

        try {
            const res = await api.post('/coin/checkin');
            if (res.data?.status === 'success') {
                setCheckInState(true);
                setEarnedCoins(500);
                setShowCheckInModal(true);
            }
        } catch (error) {
            console.error("Check-in error:", error);
            alert(error.response?.data?.message || "Hôm nay bạn đã điểm danh rồi!");
            setCheckInState(true);
        }
    };

    const handlePlayGame = async () => {
        const userId = localStorage.getItem('client_id');
        if (!userId) {
            alert("Vui lòng đăng nhập để mở rương may mắn!");
            setShowGameModal(false);
            window.location.href = '/login?auth_required=true';
            return;
        }

        setIsOpening(true);
        try {
            const res = await api.post('/coin/play-game');
            if (res.data?.status === 'success') {
                setTimeout(() => {
                    setGameResult(res.data.metadata.reward);
                    setIsOpening(false);
                }, 1500); // Simulate animation delay
            }
        } catch (error) {
            console.error("Game error:", error);
            alert(error.response?.data?.message || "Hôm nay bạn đã chơi rồi!");
            setIsOpening(false);
            setShowGameModal(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }}
            />
            Đang tải dữ liệu Vanguard...
        </div>
    );

    return (
        <>
            {/* Promo Banner - Full Width */}
            <div style={{ 
                width: '100vw', 
                marginLeft: 'calc(-50vw + 50%)', 
                marginRight: 'calc(-50vw + 50%)',
                height: '350px', 
                marginBottom: '2rem',
                position: 'relative', 
                overflow: 'hidden',
                background: 'var(--card-border)'
            }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentBanner}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ 
                            position: 'absolute', inset: 0,
                            background: `url(${banners[currentBanner].url}) center/cover no-repeat`
                        }}
                    >
                        <div style={{
                            position: 'absolute', inset: 0, 
                            background: 'rgba(0,0,0,0.6)', /* Simple solid overlay, no gradient */
                            padding: '4rem 10%', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                        }}>
                             <div style={{ 
                                 display: 'flex', gap: '6px', padding: '6px 12px', 
                                 background: 'var(--primary)', color: 'white', 
                                 fontWeight: 'bold', borderRadius: '4px', 
                                 alignSelf: 'flex-start', marginBottom: '1rem' 
                             }}>
                                 <Zap size={18} /> {banners[currentBanner].tag}
                             </div>
                             <h2 style={{ fontSize: '3rem', margin: '0 0 0.5rem', color: 'white' }}>{banners[currentBanner].title}</h2>
                             <p style={{ color: 'white', fontSize: '1.2rem', margin: '0 0 2rem', opacity: 0.9 }}>{banners[currentBanner].desc}</p>
                             <button style={{ padding: '14px 32px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', borderRadius: '8px', alignSelf: 'flex-start' }}>Mua Ngay</button>
                        </div>
                    </motion.div>
                </AnimatePresence>
                
                {/* Banner Indicators */}
                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
                    {banners.map((_, idx) => (
                        <div key={idx} onClick={() => setCurrentBanner(idx)} style={{ 
                            width: '40px', height: '4px', background: currentBanner === idx ? 'var(--primary)' : 'rgba(255,255,255,0.3)', 
                            borderRadius: '2px', cursor: 'pointer', transition: 'background 0.3s' 
                        }} />
                    ))}
                </div>
            </div>

            {/* Horizontal Toolbelt: Categories & Check-in */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 350px', 
                gap: '1.5rem', 
                marginBottom: '2.5rem' 
            }}>
                {/* Featured Categories Card */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Danh Mục Nổi Bật</h3>
                        <Link to="/search" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>Xem tất cả</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {[{icon: Monitor, label: 'Điện tử & IT'}, {icon: Tv, label: 'Thiết bị gia dụng'}, {icon: Briefcase, label: 'Thời trang & Phụ kiện'}].map((item, idx) => (
                            <Link key={idx} to={`/search?q=${item.label}`} style={{
                                textDecoration: 'none', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                                padding: '1.5rem', borderRadius: '12px', background: 'var(--card-border)', transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <item.icon size={32} color="var(--primary)" />
                                <span style={{ fontSize: '0.9rem', fontWeight: '500', textAlign: 'center' }}>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Check-in Card (Horizontal-ish) */}
                <div className="glass-panel" style={{ 
                    padding: '1.5rem', borderRadius: '16px', 
                    background: 'var(--card-border)',
                    textAlign: 'center', border: '1px solid var(--secondary)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center'
                }}>
                     <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', textAlign: 'left' }}>
                        <Gift size={48} color="var(--secondary)" />
                        <div>
                            <h3 style={{ margin: '0 0 0.25rem', color: 'var(--text-main)' }}>Điểm Danh Nhận Xu</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tích luỹ thẻ quà tặng ngay hôm nay.</p>
                        </div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '1.5rem' }}>
                        <button onClick={() => setShowInfoModal(true)} style={{
                            padding: '12px', borderRadius: '8px', fontWeight: 'bold',
                            background: 'var(--primary)', 
                            color: 'white', fontSize: '0.9rem'
                        }}>
                            Chi Tiết Thưởng
                        </button>
                        <button 
                            onClick={checkInState ? () => setShowGameModal(true) : handleCheckIn}
                            style={{
                                padding: '12px', borderRadius: '8px', fontWeight: 'bold',
                                background: 'rgba(251, 191, 36, 0.1)', color: 'var(--secondary)',
                                border: '1px solid var(--secondary)', fontSize: '0.9rem'
                            }}
                        >
                            {checkInState ? 'Mở Rương' : 'Điểm Danh Ngay'}
                        </button>
                     </div>
                     <button 
                        onClick={() => setShowArcadeModal(true)}
                        style={{
                            width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', fontWeight: 'bold',
                            background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                            border: '1px solid #3b82f6', fontSize: '0.85rem'
                        }}
                    >
                        <Gamepad2 size={14} style={{ display: 'inline', marginRight: '5px' }} />
                        Mini Games
                    </button>
                </div>
            </div>

            {/* MAIN GRID - Now Full Width */}
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <TrendingUp size={24} className="gradient-text" /> 
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Gợi Ý Dành Cho Bạn</h2>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                    {products.length === 0 ? (
                         <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                             Chưa có sản phẩm nào được đăng bán.
                         </div>
                    ) : (
                        products.map(product => (
                            <Link key={product._id} to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="glass-panel" style={{ 
                                    padding: '1rem', 
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer',
                                    height: '100%'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                                >
                                    <div style={{
                                        width: '100%', height: '220px', backgroundColor: 'var(--card-border)',
                                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden', marginBottom: '1rem', position: 'relative'
                                    }}>
                                        <img 
                                            src={product.product_thumb || 'https://via.placeholder.com/300?text=No+Image'} 
                                            alt={product.product_name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                            Đã bán {product.product_quantity < 50 ? product.product_quantity * 2 : 194}
                                        </div>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', lineHeight: '1.4' }}>{product.product_name}</h3>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                                {(product.product_price * 1.2).toLocaleString()} đ
                                            </span>
                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                {product.product_price.toLocaleString()} đ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Loading Indicator for Infinite Scroll */}
                {hasMore && (
                    <div ref={loaderRef} style={{ padding: '2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
                        <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={{ 
                                width: 30, height: 30, border: '3px solid var(--primary)', 
                                borderTopColor: 'transparent', borderRadius: '50%', 
                                margin: '0 auto' 
                            }}
                        />
                        <p style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đang tải thêm sản phẩm...</p>
                    </div>
                )}

                {!hasMore && products.length > 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                        <div style={{ width: '40px', height: '1px', background: 'var(--card-border)', margin: '0 auto 1rem' }}></div>
                        Bạn đã xem hết sản phẩm rồi!
                    </div>
                )}
            </div>

        {/* Check-in Success Modal */}
            <AnimatePresence>
                {showCheckInModal && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.85)'
                    }}>
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="glass-panel"
                            style={{ 
                                width: '100%', maxWidth: '400px', padding: '3rem 2rem', 
                                borderRadius: '24px', textAlign: 'center', position: 'relative',
                                background: 'var(--card-bg)',
                                border: '1px solid rgba(249, 115, 22, 0.3)'
                            }}
                        >
                            <button 
                                onClick={() => setShowCheckInModal(false)}
                                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-muted)' }}
                            >
                                <X size={24} />
                            </button>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div style={{ 
                                    width: '80px', height: '80px', borderRadius: '50%', 
                                    background: 'rgba(249, 115, 22, 0.2)', color: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.5rem', border: '2px solid var(--primary)'
                                }}>
                                    <Coins size={40} />
                                </div>

                                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Điểm Danh Thành Công!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Bạn vừa nhận được phần thưởng hàng ngày</p>

                                <div style={{ 
                                    background: 'rgba(255,255,255,0.05)', padding: '1.5rem', 
                                    borderRadius: '16px', display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', gap: '12px', marginBottom: '2rem'
                                }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>+{earnedCoins}</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Coins</span>
                                </div>

                                <button 
                                    onClick={() => setShowCheckInModal(false)}
                                    style={{ 
                                        width: '100%', padding: '16px', background: 'var(--primary)', 
                                        color: 'white', borderRadius: '12px', fontWeight: 'bold',
                                        fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(249, 115, 22, 0.3)'
                                    }}
                                >
                                    Tuyệt vời!
                                </button>

                                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Săn thêm xu may mắn?</p>
                                    <button 
                                        onClick={() => {
                                            setShowCheckInModal(false);
                                            setShowGameModal(true);
                                        }}
                                        style={{ 
                                            width: '100%', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', 
                                            color: 'var(--secondary)', borderRadius: '12px', fontWeight: 'bold',
                                            fontSize: '0.9rem', border: '1px solid var(--secondary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <Zap size={18} /> Mở Rương May Mắn
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lucky Chest Game Modal */}
            <AnimatePresence>
                {showGameModal && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.95)'
                    }}>
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="glass-panel"
                            style={{ 
                                width: '100%', maxWidth: '400px', padding: '3rem 2rem', 
                                borderRadius: '32px', textAlign: 'center', position: 'relative',
                                background: 'var(--bg-color)',
                                border: '1px solid var(--card-border)'
                            }}
                        >
                            {!gameResult && (
                                <button 
                                    onClick={() => setShowGameModal(false)}
                                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-muted)' }}
                                >
                                    <X size={24} />
                                </button>
                            )}

                            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'white' }}>Rương May Mắn</h2>

                            <div style={{ position: 'relative', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                                <motion.div
                                    animate={isOpening ? { 
                                        rotate: [0, -5, 5, -5, 5, 0],
                                        scale: [1, 1.1, 1]
                                    } : {}}
                                    transition={{ duration: 0.5, repeat: isOpening ? Infinity : 0 }}
                                    style={{ color: gameResult ? 'var(--secondary)' : 'var(--text-muted)', cursor: gameResult ? 'default' : 'pointer' }}
                                    onClick={!isOpening && !gameResult ? handlePlayGame : undefined}
                                >
                                    {gameResult ? (
                                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                                            <Gift size={100} />
                                        </motion.div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <Gift size={100} />
                                            {!isOpening && (
                                                <motion.div 
                                                    animate={{ y: [0, -10, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold' }}
                                                >
                                                    Nhấn để mở!
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                                
                                {isOpening && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        style={{ position: 'absolute', color: 'var(--secondary)', fontWeight: 'bold' }}
                                    >
                                        Đang mở rương...
                                    </motion.div>
                                )}
                            </div>

                            {gameResult ? (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1rem' }}>Chúc mừng!</h3>
                                    <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                                        +{gameResult}
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Vanguard Coins đã được cộng vào ví của bạn.</p>
                                    <button 
                                        onClick={() => {
                                            setShowGameModal(false);
                                            setGameResult(null);
                                        }}
                                        style={{ 
                                            width: '100%', padding: '14px', background: 'var(--primary)', 
                                            color: 'white', borderRadius: '12px', fontWeight: 'bold'
                                        }}
                                    >
                                        Nhận Thưởng
                                    </button>
                                </motion.div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Cơ hội nhận ngẫu nhiên <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>50 - 150 xu</span>.
                                </p>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Check-in Info Modal */}
            <AnimatePresence>
                {showInfoModal && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.85)'
                    }}>
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="glass-panel"
                            style={{ 
                                width: '100%', maxWidth: '450px', padding: '2.5rem', 
                                borderRadius: '24px', position: 'relative',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--card-border)'
                            }}
                        >
                            <button 
                                onClick={() => setShowInfoModal(false)}
                                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-muted)' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'white' }}>Trung Tâm Điểm Danh</h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '2rem 0' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                                        <Coins size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px', color: 'white' }}>Nhận 500 Xu Mỗi Ngày</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Chỉ cần một lần nhấn để tích lũy xu Vanguard.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                    <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px', color: 'white' }}>Đổi Voucher Giá Trị</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Dùng xu để đổi lấy mã giảm giá lên đến 200k.</p>
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--card-border)' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                        Mỗi người dùng được điểm danh 1 lần sau mỗi 24 giờ.
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={() => {
                                    setShowInfoModal(false);
                                    handleCheckIn();
                                }}
                                disabled={checkInState}
                                style={{ 
                                    width: '100%', padding: '16px', background: 'var(--primary)', 
                                    color: 'white', borderRadius: '12px', fontWeight: 'bold',
                                    fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(249, 115, 22, 0.2)'
                                }}
                            >
                                {checkInState ? 'Hôm Nay Đã Nhận' : 'Điểm Danh Ngay'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Arcade Game Modal */}
            <AnimatePresence>
                {showArcadeModal && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1200,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(15px)'
                    }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ width: '100%', maxWidth: '600px', position: 'relative' }}
                        >
                            <VanguardCatcher 
                                onClose={() => setShowArcadeModal(false)}
                                onSuccess={(reward) => {
                                    setArcadeReward(reward);
                                }}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HomePage;
