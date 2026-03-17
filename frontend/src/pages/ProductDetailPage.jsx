import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    ShoppingCart, Star, ArrowLeft, ShieldCheck, Truck, 
    RefreshCcw, ChevronLeft, ChevronRight, MessageSquare, 
    ThumbsUp, User as UserIcon, Send, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetailPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    const [newReview, setNewReview] = useState({ rating: 5, content: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [shopStats, setShopStats] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchProductData();
    }, [productId]);

    const fetchProductData = async () => {
        setLoading(true);
        try {
            const [detailRes, relatedRes, reviewRes] = await Promise.all([
                api.get(`/product/${productId}`),
                api.get(`/product/related/${productId}`),
                api.get(`/review/${productId}`)
            ]);
            
            if (detailRes.data?.status === 'success') {
                const productData = detailRes.data.metadata;
                setProduct(productData);
                
                // Fetch shop stats in parallel once we have the shop ID
                api.post('/shop/info', { shopId: productData.product_shop._id })
                   .then(res => {
                       if (res.data?.status === 'success') setShopStats(res.data.metadata.stats);
                   });
            }
            if (relatedRes.data?.status === 'success') setRelatedProducts(relatedRes.data.metadata);
            if (reviewRes.data?.status === 'success') setReviews(reviewRes.data.metadata);
        } catch (error) {
            console.error("Error fetching product data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        try {
            // Pre-validation check for inventory
            const checkRes = await api.post('/order/checkout/review', {
                cartItems: [{
                    productId: product._id,
                    shopId: product.product_shop._id,
                    quantity: quantity,
                    name: product.product_name,
                    price: product.product_price
                }]
            });

            if (checkRes.data?.status === 'success') {
                const res = await api.post('/cart/add', {
                    productId: product._id,
                    shopId: product.product_shop._id,
                    quantity: quantity,
                    name: product.product_name,
                    price: product.product_price,
                    shopName: product.product_shop?.name,
                    product_thumb: product.product_thumb
                });
                if (res.data?.status === 'success') {
                    alert("Đã thêm vào giỏ hàng!");
                }
            }
        } catch (error) {
            console.error("Cart add failed:", error);
            alert(error.response?.data?.message || "Vui lòng đăng nhập để thực hiện thao tác này");
            if (error.response?.status === 401) navigate('/login');
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            alert("Vui lòng đăng nhập để đánh giá");
            return;
        }

        setSubmittingReview(true);
        try {
            const res = await api.post('/review', {
                productId: product._id,
                userId,
                content: newReview.content,
                rating: newReview.rating
            });

            if (res.data?.status === 'success') {
                setReviews([res.data.metadata, ...reviews]);
                setNewReview({ rating: 5, content: '' });
                alert("Đánh giá của bạn đã được gửi!");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleChat = () => {
        const userId = localStorage.getItem('client_id');
        if (!userId) {
            alert("Vui lòng đăng nhập để nhắn tin với gian hàng!");
            navigate('/login?auth_required=true');
            return;
        }
        alert("Tính năng chat sẽ sớm ra mắt!");
    };

    const handleBuyNow = async () => {
        const userId = localStorage.getItem('client_id');
        if (!userId) {
            alert("Vui lòng đăng nhập để tiến hành thanh toán!");
            navigate('/login?auth_required=true');
            return;
        }
        
        try {
            const item = {
                productId: product._id,
                shopId: product.product_shop._id,
                quantity: quantity,
                name: product.product_name,
                price: product.product_price,
                shopName: product.product_shop?.name,
                product_thumb: product.product_thumb
            };

            // Pre-validation check
            const checkRes = await api.post('/order/checkout/review', {
                cartItems: [item]
            });

            if (checkRes.data?.status === 'success') {
                // Add to cart silently so it's consistent if they abandon checkout
                await api.post('/cart/add', item);
                
                // Navigate to checkout with the item state
                navigate('/checkout', { state: { items: [item] } });
            }
        } catch (error) {
            console.error("Buy Now failed:", error);
            const msg = error.response?.data?.message || "Sản phẩm hiện không khả dụng. Vui lòng thử lại sau.";
            alert(msg);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
            <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }}
            />
            Đang tải dữ liệu Vanguard...
        </div>
    );

    if (!product) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>Sản phẩm không khả dụng</div>;

    const allImages = [product.product_thumb, ...(product.product_images || [])];

    return (
        <div style={{ padding: '1rem 0', color: 'var(--text-main)' }}>
            {/* Header / Breadcrumb */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Trang chủ <ChevronRight size={14} /> {product.product_type} <ChevronRight size={14} /> <span style={{ color: 'var(--text-main)' }}>{product.product_name}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '4rem', marginBottom: '5rem' }}>
                {/* Left: Product Gallery */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-panel" style={{ borderRadius: '24px', overflow: 'hidden', position: 'relative', aspectRatio: '1/1', background: 'var(--card-bg)' }}>
                        <AnimatePresence mode="wait">
                            <motion.img 
                                key={currentImageIndex}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                src={allImages[currentImageIndex]} 
                                alt={product.product_name} 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                        </AnimatePresence>
                        
                        {allImages.length > 1 && (
                            <>
                                <button onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))} 
                                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '10px', color: 'white', cursor: 'pointer' }}>
                                    <ChevronLeft size={24} />
                                </button>
                                <button onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))} 
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '10px', color: 'white', cursor: 'pointer' }}>
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px' }}>
                        {allImages.map((img, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => setCurrentImageIndex(idx)}
                                style={{ 
                                    minWidth: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                                    border: currentImageIndex === idx ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.05)',
                                    background: 'var(--card-bg)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    opacity: currentImageIndex === idx ? 1 : 0.6,
                                    transform: currentImageIndex === idx ? 'scale(1.05)' : 'scale(1)'
                                }}
                            >
                                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right: Product Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ padding: '4px 12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {product.product_type}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <Star size={16} fill="#fbbf24" color="#fbbf24" />
                            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{product.product_ratingsAverage}</span>
                            <span>• {reviews.length} đánh giá</span>
                        </div>
                    </div>

                    <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: '800', lineHeight: '1.1' }}>{product.product_name}</h1>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                        <div className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: '900' }}>
                            {product.product_price.toLocaleString()} VND
                        </div>
                        <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '1.2rem' }}>
                            {(product.product_price * 1.2).toLocaleString()} VND
                        </span>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: 60, height: 60, borderRadius: '16px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', overflow: 'hidden' }}>
                                    <img src={product.product_shop.logo || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.product_shop.name} />
                                </div>
                                {product.product_shop.verified && (
                                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--success)', borderRadius: '50%', padding: '2px', border: '2px solid var(--bg-card)' }}>
                                        <ShieldCheck size={12} color="white" fill="var(--success)" />
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'white' }}>{product.product_shop.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Store size={12} /> {shopStats?.totalProducts || 0} SP</span>
                                    <span>•</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12} color="#fbbf24" fill="#fbbf24" /> {shopStats?.avgRating || 5.0}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => navigate(`/shops/${product.product_shop._id}`)} className="hover-card" style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    Xem Shop
                                </button>
                                <button 
                                    onClick={handleChat}
                                    className="hover-card" style={{ padding: '10px 18px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                                >
                                    Chat
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--card-border)', padding: '6px' }}>
                            <button onClick={() => setQuantity(Math.max(1, quantity-1))} style={{ width: 44, height: 44, color: 'var(--text-main)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                            <span style={{ width: 50, textAlign: 'center', fontWeight: '900', fontSize: '1.2rem', color: 'var(--primary)' }}>{quantity}</span>
                            <button onClick={() => setQuantity(quantity+1)} style={{ width: 44, height: 44, color: 'var(--text-main)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                            <button 
                                onClick={handleAddToCart} 
                                className="hover-glow"
                                style={{ 
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
                                    padding: '18px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', borderRadius: '14px', 
                                    fontWeight: '800', fontSize: '1.1rem', border: '2px solid var(--primary)', cursor: 'pointer'
                                }}
                            >
                                <ShoppingCart size={22} /> Thêm Giỏ Hàng
                            </button>
                            <button 
                                onClick={handleBuyNow}
                                className="hover-glow"
                                style={{ 
                                    flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', 
                                    padding: '18px', background: 'var(--primary)', color: 'white', borderRadius: '14px', 
                                    fontWeight: '900', fontSize: '1.1rem', border: 'none', cursor: 'pointer',
                                    boxShadow: '0 15px 30px rgba(249, 115, 22, 0.3)'
                                }}
                            >
                                Mua Ngay
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        {[
                            { icon: Truck, text: 'Giao hàng siêu tốc 2h' },
                            { icon: RefreshCcw, text: '7 ngày đổi trả miễn phí' },
                            { icon: ShieldCheck, text: 'Bảo hành chính hãng' },
                            { icon: ThumbsUp, text: 'Cam kết chất lượng' }
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <item.icon size={16} color="var(--primary)" /> {item.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', gap: '3rem', borderBottom: '1px solid var(--card-border)', marginBottom: '2.5rem' }}>
                    {[
                        { id: 'description', label: 'Mô tả chi tiết', icon: MessageSquare },
                        { id: 'specs', label: 'Thông số kỹ thuật', icon: ShieldCheck },
                        { id: 'reviews', label: `Đánh giá (${reviews.length})`, icon: Star }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            style={{ 
                                padding: '1rem 0', background: 'none', border: 'none', 
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent', 
                                cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem',
                                transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'description' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <p style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-main)', opacity: 0.8, whiteSpace: 'pre-wrap' }}>
                                    {product.product_description}
                                </p>
                            </motion.div>
                        )}

                        {activeTab === 'specs' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.entries(product.product_attributes || {}).map(([k, v], idx) => (
                                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '250px 1fr', padding: '16px', borderRadius: '12px', background: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'capitalize' }}>{k}</span>
                                        <span style={{ fontWeight: '500' }}>{v}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'reviews' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
                                    {/* Ratings Summary */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid var(--card-border)', pr: '2rem' }}>
                                        <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--primary)' }}>{product.product_ratingsAverage}</div>
                                        <div style={{ display: 'flex', color: '#fbbf24', gap: '4px' }}>
                                            {[1,2,3,4,5].map(s => <Star key={s} size={24} fill={s <= product.product_ratingsAverage ? '#fbbf24' : 'none'} />)}
                                        </div>
                                        <p style={{ color: 'var(--text-muted)' }}>Dựa trên {reviews.length} đánh giá thực tế</p>
                                        
                                        <form onSubmit={handleSubmitReview} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <h4 style={{ margin: 0 }}>Gửi đánh giá của bạn</h4>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {[1,2,3,4,5].map(s => (
                                                    <Star 
                                                        key={s} 
                                                        size={20} 
                                                        cursor="pointer"
                                                        fill={s <= newReview.rating ? '#fbbf24' : 'none'} 
                                                        color={s <= newReview.rating ? '#fbbf24' : 'var(--text-muted)'}
                                                        onClick={() => setNewReview({...newReview, rating: s})}
                                                    />
                                                ))}
                                            </div>
                                            <textarea 
                                                value={newReview.content}
                                                onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                                                placeholder="Sản phẩm này thế nào? Hãy cho chúng tôi biết cảm nghĩ của bạn..."
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--card-border)', color: 'var(--text-main)', minHeight: '100px', resize: 'vertical' }}
                                            />
                                            <button 
                                                disabled={submittingReview}
                                                style={{ padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                                            >
                                                {submittingReview ? 'Đang gửi...' : <><Send size={18} /> Gửi đánh giá</>}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Review List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {reviews.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                                <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                                <p>Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                                            </div>
                                        ) : (
                                            reviews.map((rev, idx) => (
                                                <div key={idx} style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ width: 35, height: 35, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <UserIcon size={18} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 'bold' }}>{rev.review_userId?.name || 'Vanguard User'}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(rev.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', color: '#fbbf24', gap: '2px' }}>
                                                            {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= rev.review_rating ? '#fbbf24' : 'none'} color={s <= rev.review_rating ? '#fbbf24' : 'var(--text-muted)'} />)}
                                                        </div>
                                                    </div>
                                                    <p style={{ margin: 0, lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}>{rev.review_content}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div style={{ marginTop: '6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: '800' }}>Sản phẩm tương tự</h2>
                        <button onClick={() => navigate(`/search?q=${product.product_type}`)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Xem tất cả</button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
                        {relatedProducts.map(p => (
                            <motion.div 
                                key={p._id} 
                                whileHover={{ y: -10 }} 
                                onClick={() => navigate(`/product/${p._id}`)} 
                                className="glass-panel" 
                                style={{ borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
                            >
                                <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: 'var(--card-border)' }}>
                                    <img src={p.product_thumb} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.product_name}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.2rem' }}>{p.product_price.toLocaleString()} đ</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <Star size={12} fill="#fbbf24" color="#fbbf24" /> {p.product_ratingsAverage}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetailPage;
