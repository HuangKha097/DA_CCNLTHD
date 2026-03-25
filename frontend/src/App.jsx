import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { Home, User, LogOut, Settings, Search, ShoppingCart, Shield } from 'lucide-react';
import './index.css';

// Placeholder Pages (To be built out)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ShopPage from './pages/ShopPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SellerAuth from './pages/SellerAuth';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Navigate, useLocation } from 'react-router-dom';

// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('access_token');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location, message: "Vui lòng đăng nhập để truy cập tính năng này" }} replace />;
    }

    return children;
};

// --- THREE JS BACKGROUND ---
const AbstractShape = () => {
    const meshRef = useRef();
    
    useFrame((state, delta) => {
        meshRef.current.rotation.x += delta * 0.1;
        meshRef.current.rotation.y += delta * 0.15;
    });

    return (
        <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
            <mesh ref={meshRef} position={[3, 0, -5]}>
                <torusKnotGeometry args={[2, 0.4, 128, 32]} />
                <meshStandardMaterial 
                    color="#8b5cf6" 
                    wireframe 
                    transparent 
                    opacity={0.15} 
                />
            </mesh>
        </Float>
    );
};

const Background3D = () => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade speed={0.5} />
            </Canvas>
        </div>
    );
};

// --- NAVIGATION BAR ---
const Navbar = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    const isAdmin = userInfo.roles?.includes('admin');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <nav className="glass-panel" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 50
        }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Vanguard</h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Market</span>
            </Link>

            <form onSubmit={handleSearch} style={{ 
                flex: 1, maxWidth: '500px', margin: '0 2rem', position: 'relative' 
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', background: 'var(--bg-color)',
                    border: '1px solid var(--secondary)', borderRadius: '20px', padding: '0.4rem 1rem'
                }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm Vanguards, Gian Hàng, Hoặc Sản Phẩm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            background: 'transparent', border: 'none', color: 'var(--text-main)',
                            outline: 'none', width: '100%', paddingLeft: '10px', fontSize: '0.95rem'
                        }}
                    />
                </div>
            </form>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {isAdmin ? (
                    <Link to="/admin/dashboard" title="Admin Panel" style={{ color: '#eab308' }}><Shield size={20} /></Link>
                ) : (
                    <>
                        <Link to="/" title="Home" style={{ color: 'var(--text-muted)' }}><Home size={20} /></Link>
                        <Link to="/profile" title="Profile" style={{ color: 'var(--text-muted)' }}><User size={20} /></Link>
                        <Link to="/cart" title="Cart" style={{ color: 'var(--text-muted)' }}><ShoppingCart size={20} /></Link>
                        <Link to="/settings" title="Settings" style={{ color: 'var(--text-muted)' }}><Settings size={20} /></Link>
                    </>
                )}
                {localStorage.getItem('access_token') ? (
                     <button onClick={handleLogout} title="Logout" style={{ color: 'var(--danger)', padding: 0 }}>
                         <LogOut size={20} />
                     </button>
                ) : (
                    <Link to="/login" style={{ 
                        background: 'var(--primary)', 
                        color: 'white', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '500',
                        fontSize: '0.9rem'
                    }}>
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
};

// --- MAIN LAYOUT ---
function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  return (
    <Router>
        <Background3D />
        
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            
            <main style={{ flex: 1, padding: '1rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                <Routes>
                    <Route path="/" element={
                        JSON.parse(localStorage.getItem('user_info') || '{}').roles?.includes('admin') 
                        ? <Navigate to="/admin/dashboard" replace /> 
                        : <HomePage />
                    } />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/shops/:shopId" element={<ShopPage />} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/product/:productId" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                    <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                    <Route path="/seller" element={<SellerAuth />} />
                    <Route path="/seller/dashboard" element={<SellerDashboard />} />
                    <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                </Routes>
            </main>

            <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                © 2026 Vanguard Market. Seamless & Secure.
            </footer>
        </div>
    </Router>
  );
}

export default App;
