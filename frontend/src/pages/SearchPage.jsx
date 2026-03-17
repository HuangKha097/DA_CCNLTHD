import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Search, Store, Package, CheckCircle2, ChevronRight, Star, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    // Filtering States
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [productType, setProductType] = useState(searchParams.get('type') || '');
    const [minRating, setMinRating] = useState(searchParams.get('rating') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');

    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalProducts, setTotalProducts] = useState(0);

    const navigate = useNavigate();

    const fetchResults = async () => {
        setLoading(true);
        try {
            // Unify keyword and filters into one call
            let filterUrl = `/product/filter?sort=${sort}&limit=20`;
            if (query) filterUrl += `&keyword=${encodeURIComponent(query)}`;
            if (minPrice) filterUrl += `&minPrice=${minPrice}`;
            if (maxPrice) filterUrl += `&maxPrice=${maxPrice}`;
            if (productType) filterUrl += `&product_type=${encodeURIComponent(productType)}`;
            if (minRating) filterUrl += `&minRating=${minRating}`;

            const [prodRes, shopRes] = await Promise.all([
                api.get(filterUrl),
                query ? api.get(`/shop/search?keyword=${encodeURIComponent(query)}&limit=5`) : Promise.resolve({ data: { status: 'success', metadata: { shops: [] } } })
            ]);

            if (prodRes.data?.status === 'success') {
                setProducts(prodRes.data.metadata.products);
                setTotalProducts(prodRes.data.metadata.pagination.total);
            }
            if (shopRes.data?.status === 'success') {
                setShops(shopRes.data.metadata.shops);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, [query, minPrice, maxPrice, productType, minRating, sort]);

    const handleFilterReset = () => {
        setMinPrice('');
        setMaxPrice('');
        setProductType('');
        setMinRating('');
        setSort('-createdAt');
        setSearchParams({ q: query });
    };

    const handleSortChange = (newSort) => {
        setSort(newSort);
    };

    return (
        <div className="search-page-layout">
            <style>
                {`
                    .search-page-layout {
                        display: grid;
                        grid-template-columns: 300px 1fr;
                        gap: 2.5rem;
                        padding: 1rem 0;
                    }
                    @media (max-width: 1024px) {
                        .search-page-layout {
                            grid-template-columns: 1fr;
                        }
                        .filter-sidebar {
                            position: static !important;
                            margin-bottom: 2rem;
                        }
                    }
                `}
            </style>

            {/* ADVANCED FILTER SIDEBAR */}
            <aside className="filter-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.8rem', borderRadius: '20px', position: 'sticky', top: '100px', height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.2rem' }}>
                        <SlidersHorizontal size={22} color="var(--primary)" />
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Bộ Lọc Tìm Kiếm</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Category */}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Danh Mục
                            </label>
                            <select
                                id="filter-category"
                                value={productType}
                                onChange={(e) => setProductType(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    background: 'var(--bg-color)', color: 'var(--text-main)',
                                    border: '1px solid var(--card-border)', cursor: 'pointer',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <option value="">Tất cả danh mục</option>
                                <option value="Electronics">Điện tử</option>
                                <option value="Clothing">Thời trang</option>
                                <option value="Furniture">Nội thất</option>
                                <option value="Accessories">Phụ kiện</option>
                            </select>
                        </div>

                        {/* Price Range */}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '12px', display: "block", textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Khoảng Giá (VND)
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px', alignItems: 'center' }}>
                                <input id="filter-min-price" type="number" placeholder="Tối thiểu" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                                    style={{ flex: 1, width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)', fontSize: '0.9rem' }} />
                                <span style={{ color: 'var(--card-border)', width: '100%', fontWeight: 'bold' }}>-</span>
                                <input id="filter-max-price" type="number" placeholder="Tối đa" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                                    style={{ flex: 1, padding: '12px', width: '100%', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)', fontSize: '0.9rem' }} />
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Đánh Giá
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {[5, 4, 3].map(stars => (
                                    <button
                                        key={stars}
                                        id={`filter-rating-${stars}`}
                                        onClick={() => setMinRating(stars)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px',
                                            background: minRating == stars ? 'var(--card-border)' : 'transparent',
                                            color: minRating == stars ? 'var(--primary)' : 'var(--text-main)',
                                            textAlign: 'left', transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={15} fill={i < stars ? "#fbbf24" : "none"} stroke={i < stars ? "#fbbf24" : "currentColor"} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: minRating == stars ? 'bold' : 'normal' }}>
                                            {stars === 5 ? '' : 'Trở lên'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            id="filter-reset"
                            onClick={handleFilterReset}
                            style={{
                                padding: '14px', borderRadius: '12px', background: 'var(--primary)',
                                color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer',
                                marginTop: '1rem', boxShadow: '0 8px 16px rgba(249, 115, 22, 0.15)',
                                transition: 'transform 0.2s'
                            }}
                            className="hover:scale-[1.02] active:scale-[0.98]"
                        >
                            THIẾT LẬP LẠI
                        </button>
                    </div>
                </div>
            </aside>

            {/* RESULTS VIEW */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem', fontWeight: '800' }}>
                            {query ? (
                                <>Kết quả cho <span style={{ color: 'var(--primary)' }}>"{query}"</span></>
                            ) : (
                                <>Khám Phá <span style={{ color: 'var(--primary)' }}>Sản Phẩm</span></>
                            )}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>
                            Tìm thấy <strong>{totalProducts}</strong> sản phẩm phù hợp yêu cầu.
                        </p>
                    </div>

                    {/* Sorting UI */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card-bg)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ArrowUpDown size={16} /> Sắp xếp theo:
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { label: 'Mới nhất', val: '-createdAt' },
                                { label: 'Giá thấp', val: 'product_price' },
                                { label: 'Giá cao', val: '-product_price' },
                                { label: 'Đánh giá', val: '-product_ratingsAverage' }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => handleSortChange(opt.val)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem',
                                        background: sort === opt.val ? 'var(--primary)' : 'var(--card-border)',
                                        color: sort === opt.val ? 'white' : 'var(--text-muted)',
                                        fontWeight: sort === opt.val ? 'bold' : 'normal',
                                        border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>Đang tìm kiếm sản phẩm tốt nhất...</span>
                    </div>
                ) : (
                    <>
                        {/* SHOPS SECTION (Only if keyword search) */}
                        {query && shops.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                                    <Store size={22} color="var(--primary)" />
                                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Cửa hàng liên quan</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '1.2rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                                    {shops.map(shop => (
                                        <Link key={shop._id} to={`/shops/${shop._id}`} style={{
                                            minWidth: '320px', padding: '1.5rem', borderRadius: '20px', textDecoration: 'none', color: 'inherit',
                                            display: 'flex', alignItems: 'center', gap: '18px', border: '1px solid var(--card-border)',
                                            background: 'var(--card-bg)', transition: 'transform 0.2s'
                                        }} className="hover:scale-[1.02]">
                                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary)', overflow: 'hidden', flexShrink: 0 }}>
                                                <img src={shop.logo || 'https://via.placeholder.com/64?text=Shop'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={shop.name} />
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 'bold' }}>{shop.name}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                                    <CheckCircle2 size={12} /> CHÍNH HÃNG
                                                </div>
                                            </div>
                                            <ChevronRight size={20} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* PRODUCTS SECTION */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                <Package size={22} color="var(--success)" />
                                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Sản phẩm tìm thấy</h2>
                            </div>

                            {products.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: '24px' }}>
                                    <Search size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Rất tiếc, không tìm thấy kết quả nào</h3>
                                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>Hãy thử thay đổi từ khóa hoặc xóa bớt bộ lọc để có nhiều kết quả hơn.</p>
                                    <button
                                        onClick={handleFilterReset}
                                        style={{
                                            marginTop: '2rem', padding: '12px 32px',
                                            background: 'var(--primary)', borderRadius: '14px',
                                            border: 'none', color: 'white', fontWeight: 'bold',
                                            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Xóa tất cả bộ lọc
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.8rem' }}>
                                    {products.map(p => (
                                        <Link key={p._id} to={`/product/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <motion.div
                                                whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(0,0,0,0.2)' }}
                                                className="glass-panel"
                                                style={{
                                                    padding: '1rem', borderRadius: '20px',
                                                    display: 'flex', flexDirection: 'column',
                                                    height: '100%', border: '1px solid var(--card-border)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <div style={{ aspectRatio: '1/1', background: 'var(--card-bg)', borderRadius: '14px', marginBottom: '1.2rem', overflow: 'hidden', position: 'relative' }}>
                                                    <img src={p.product_thumb || 'https://via.placeholder.com/280?text=Vanguard'} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {p.product_ratingsAverage >= 4.5 && (
                                                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--secondary)', color: 'var(--bg-color)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            TOP RATED
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 style={{ margin: '0 0 0.8rem', fontSize: '1.05rem', fontWeight: '600', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {p.product_name}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>V</div>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.product_shop?.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                    <span style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.2rem' }}>
                                                        {p.product_price.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>đ</span>
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#fbbf24' }}>
                                                        <Star size={14} fill="#fbbf24" />
                                                        <span>{p.product_ratingsAverage || '5.0'}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
