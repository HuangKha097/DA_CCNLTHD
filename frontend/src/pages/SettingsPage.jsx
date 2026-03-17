import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Bell, Shield } from 'lucide-react';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        return !document.documentElement.hasAttribute('data-theme');
    });

    const toggleTheme = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        
        if (newDarkMode) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleLogout = () => {
        if(window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
             localStorage.clear();
             navigate('/login');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Cài Đặt Hệ Thống</h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Quản lý tùy chọn ứng dụng</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Appearance Settings */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '8px' }}>
                             {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <h3 style={{ margin: 0 }}>Giao diện: {darkMode ? 'Tối' : 'Sáng'}</h3>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontWeight: '500' }}>{darkMode ? 'Dark Mode Hóa Trí Tuệ' : 'Chế độ Sáng Thanh Lịch'}</span>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {darkMode ? 'Chế độ làm dịu mắt trong môi trường ánh sáng thấp.' : 'Giao diện sáng sủa, chuyên nghiệp.'}
                            </p>
                        </div>
                        <button 
                            onClick={toggleTheme}
                            style={{
                                width: '50px', height: '26px', borderRadius: '13px',
                                background: darkMode ? 'var(--primary)' : 'var(--card-border)',
                                position: 'relative', transition: 'background 0.3s'
                            }}>
                            <div style={{
                                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                                position: 'absolute', top: '3px',
                                left: darkMode ? '27px' : '3px',
                                transition: 'left 0.3s'
                            }}></div>
                        </button>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--secondary)', borderRadius: '8px' }}>
                             <Bell size={20} />
                        </div>
                        <h3 style={{ margin: 0 }}>Thông báo</h3>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontWeight: '500' }}>Thông báo đẩy</span>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nhận thông báo khi có đơn hàng hoặc tin nhắn mới.</p>
                        </div>
                        <button style={{
                                width: '50px', height: '26px', borderRadius: '13px',
                                background: 'var(--card-border)',
                                position: 'relative'
                            }}>
                            <div style={{
                                width: '20px', height: '20px', borderRadius: '50%', background: 'var(--text-muted)',
                                position: 'absolute', top: '3px', left: '3px'
                            }}></div>
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}>
                             <Shield size={20} />
                        </div>
                        <h3 style={{ margin: 0, color: 'var(--danger)' }}>Khu vực nguy hiểm</h3>
                    </div>

                    <button 
                        onClick={handleLogout}
                        style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            width: '100%', padding: '14px', borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                            fontWeight: 'bold', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                         <LogOut size={20} /> Đăng xuất phiên làm việc
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
