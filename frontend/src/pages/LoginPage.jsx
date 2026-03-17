import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle, Lock } from 'lucide-react';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we came from a protected route or session expired
    const redirectMessage = location.state?.message || 
                           (new URLSearchParams(location.search).get('expired') === 'true' 
                            ? "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." 
                            : "");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const endpoint = isLogin ? '/user/login' : '/user/signup';
            
            // Backend Auth structure expects specific keys
            const payload = isLogin 
                ? { email: formData.email, password: formData.password }
                : { name: formData.name, email: formData.email, password: formData.password };
                
            const res = await api.post(endpoint, payload);

            if (res.data?.status === 'success') {
                // Determine token path based on backend structure
                const token = isLogin ? res.data.metadata.tokens : ''; 
                const user = isLogin ? res.data.metadata.user : res.data.metadata.user;

                if (token) localStorage.setItem('access_token', token);
                localStorage.setItem('client_id', user._id);
                localStorage.setItem('user_info', JSON.stringify(user));
                
                navigate('/');
            } else {
                setError('Lỗi xác thực hệ thống: Vui lòng thử lại');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '80vh' 
        }}>
            <form onSubmit={handleSubmit} className="glass-panel" style={{ 
                width: '100%', 
                maxWidth: '400px', 
                padding: '2.5rem', 
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '2rem', margin: 0 }} className="gradient-text">
                        {isLogin ? 'Welcome Back' : 'Join Vanguard'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                        {isLogin ? 'Sign in to access your assets' : 'Create a new account'}
                    </p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {redirectMessage && !error && (
                    <div className="glass-panel" style={{ 
                        padding: '1rem', 
                        border: '1px solid rgba(139, 92, 246, 0.3)', 
                        background: 'rgba(139, 92, 246, 0.05)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: 'var(--primary)',
                        fontSize: '0.9rem'
                    }}>
                        <Lock size={18} />
                        <span>{redirectMessage}</span>
                    </div>
                )}

                {!isLogin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
                        <input 
                            type="text" 
                            required 
                            style={{ 
                                padding: '12px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--card-border)', 
                                backgroundColor: 'var(--bg-color)', 
                                color: 'white',
                                outline: 'none'
                            }}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
                    <input 
                        type="email" 
                        required 
                        style={{ 
                            padding: '12px', 
                            borderRadius: '8px', 
                            border: '1px solid var(--card-border)', 
                            backgroundColor: 'var(--bg-color)', 
                            color: 'var(--text-main)',
                            outline: 'none'
                        }}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
                    <input 
                        type="password" 
                        required 
                        style={{ 
                            padding: '12px', 
                            borderRadius: '8px', 
                            border: '1px solid var(--card-border)', 
                            backgroundColor: 'var(--bg-color)', 
                            color: 'var(--text-main)',
                            outline: 'none'
                        }}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                <button type="submit" style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'background 0.2s',
                    marginTop: '0.5rem'
                }}>
                    {isLogin ? 'Sign In' : 'Sign Up'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                        style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isLogin ? 'Create one' : 'Sign in'}
                    </span>
                </p>
                
                {/* Visual separator for alternative login */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--card-border)' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
                    <span style={{ padding: '0 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
                </div>

                <button type="button" onClick={() => navigate("/seller")} style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--secondary)',
                    color: 'var(--secondary)',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                }}>
                    Login as Shop Owner
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
