import React, { useState, useEffect } from 'react';
import { Shield, Users, Store, CheckCircle, Search, AlertCircle, ArrowLeft, Package, ShoppingBag, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    // Theme toggle
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Deep view states
    const [selectedShop, setSelectedShop] = useState(null); // { id, name }
    const [shopProducts, setShopProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    
    const [selectedUser, setSelectedUser] = useState(null); // { id, name }
    const [userOrders, setUserOrders] = useState([]);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        if (!userInfo.roles?.includes('admin')) {
            alert("Bạn không có quyền truy cập trang này!");
            navigate('/');
            return;
        }
        fetchData();
    }, [navigate]);

    // Apply theme changes to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, shopsRes] = await Promise.all([
                api.get('/admin/user'),
                api.get('/admin/shop')
            ]);
            
            if (usersRes.data?.status === 'success') {
                setUsers(usersRes.data.metadata.users);
            }
            if (shopsRes.data?.status === 'success') {
                setShops(shopsRes.data.metadata.shops);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu Admin:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async (userId, currentStatus) => {
        const action = currentStatus === 'block' ? 'mở khóa' : 'khóa';
        if (!window.confirm(`Bạn có chắc muốn ${action} người dùng này?`)) return;
        
        try {
            if (currentStatus === 'block') {
                await api.put(`/admin/user/${userId}/unban`);
            } else {
                await api.delete(`/admin/user/${userId}`);
            }
            fetchData();
        } catch (error) {
            alert(`Lỗi khi ${action}: ` + (error.response?.data?.message || error.message));
        }
    };

    const handleBanShop = async (shopId, currentStatus) => {
        const action = currentStatus === 'banned' ? 'mở khóa' : 'khóa';
        if (!window.confirm(`Bạn có chắc muốn ${action} gian hàng này? Cảnh báo: khoá gian hàng sẽ yêu cầu gian hàng không có đơn nợ.`)) return;
        
        try {
            if (currentStatus === 'banned') {
                await api.put(`/admin/shop/${shopId}/unban`);
            } else {
                await api.delete(`/admin/shop/${shopId}`);
            }
            fetchData();
        } catch (error) {
            alert(`Lỗi khi ${action}: ` + (error.response?.data?.error || "Gian hàng này hiện vẫn còn đơn đang xử lý"));
        }
    };

    const fetchShopProducts = async (shopId, shopName) => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/shop/${shopId}/products`);
            if (res.data?.status === 'success') {
                setShopProducts(res.data.metadata.products);
                setSelectedShop({ id: shopId, name: shopName });
                setProductSearch('');
            }
        } catch (error) {
            alert("Lỗi tải sản phẩm: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchUserOrders = async (userId, userName) => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/user/${userId}/orders`);
            if (res.data?.status === 'success') {
                setUserOrders(res.data.metadata.orders);
                setSelectedUser({ id: userId, name: userName });
            }
        } catch (error) {
            alert("Lỗi tải đơn hàng: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredShops = shops.filter(s => s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const displayProducts = shopProducts.filter(p => p.product_name.toLowerCase().includes(productSearch.toLowerCase()));

    // --- SHARED CLASSES (with Dark Mode Support) ---
    const btnSecondary = "px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 ease-in-out flex items-center gap-2 font-medium shadow-sm";
    const btnActionBan = "px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg hover:-translate-y-0.5 hover:shadow-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-300 ease-in-out font-semibold text-sm";
    const btnActionUnban = "px-3 py-1.5 border border-green-200 dark:border-emerald-900/50 text-green-700 dark:text-emerald-400 bg-green-50 dark:bg-emerald-500/10 rounded-lg hover:-translate-y-0.5 hover:shadow-sm hover:bg-green-100 dark:hover:bg-emerald-500/20 transition-all duration-300 ease-in-out font-semibold text-sm";
    
    const statusBadge = (colorStr, text) => (
        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${colorStr}`}>
            {text}
        </span>
    );
    const tableHeader = "p-4 text-left font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-slate-50/50 dark:bg-[#0f172a]/80 sticky top-0 backdrop-blur-md z-10 border-b border-gray-100 dark:border-slate-800";
    const tableCell = "p-4 text-slate-900 dark:text-slate-100 text-sm align-middle whitespace-nowrap";

    // Theme toggle component for header
    const ThemeToggleButton = () => (
        <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm border border-transparent dark:border-slate-700"
            title="Đổi giao diện sáng/tối"
        >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );

    // --- SUBVIEWS ---
    if (selectedShop) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#020617] font-sans overflow-hidden transition-colors duration-300">
                {/* Fixed Header */}
                <div className="px-6 py-5 sm:px-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-800 shadow-sm z-20 shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedShop(null)} className={btnSecondary}>
                            <ArrowLeft size={18} /> Trở về
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Package className="text-slate-900 dark:text-white" size={24} />
                            Sản phẩm của <span className="text-slate-500 dark:text-slate-400">{selectedShop.name}</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex items-center bg-gray-50 dark:bg-[#020617] rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-2.5 shadow-sm focus-within:shadow-md focus-within:-translate-y-0.5 transition-all duration-300 ease-in-out w-full sm:w-80">
                            <Search size={18} className="text-slate-400 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Tra cứu sản phẩm..." 
                                value={productSearch} 
                                onChange={e => setProductSearch(e.target.value)} 
                                className="bg-transparent border-none text-slate-900 dark:text-white outline-none ml-3 w-full text-sm font-medium" 
                            />
                        </div>
                        <ThemeToggleButton />
                    </div>
                </div>

                {/* Content Container (Scrollable internally) */}
                <div className="flex-1 overflow-hidden p-6 flex flex-col w-full max-w-[1400px] mx-auto">
                    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden transition-colors duration-300">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse relative">
                                <thead>
                                    <tr>
                                        <th className={tableHeader}>Sản Phẩm</th>
                                        <th className={tableHeader}>Danh Mục</th>
                                        <th className={tableHeader}>Giá Bán</th>
                                        <th className={tableHeader}>Kho</th>
                                        <th className={tableHeader}>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {displayProducts.map((p, index) => (
                                            <motion.tr 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
                                                key={p._id} 
                                                className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors duration-200 group"
                                            >
                                                <td className={`${tableCell} font-medium flex items-center gap-4`}>
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 group-hover:shadow-md transition-shadow">
                                                        <img src={p.product_thumb} alt="thumb" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="truncate max-w-[250px] text-slate-900 dark:text-slate-100">{p.product_name}</span>
                                                </td>
                                                <td className={`${tableCell} text-slate-500 dark:text-slate-400`}>{p.product_type}</td>
                                                <td className={`${tableCell} font-semibold text-slate-900 dark:text-slate-50`}>{p.product_price.toLocaleString()}đ</td>
                                                <td className={`${tableCell} text-slate-600 dark:text-slate-400 font-medium`}>{p.product_quantity}</td>
                                                <td className={tableCell}>
                                                    {p.isPublished 
                                                        ? statusBadge('bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', 'Public')
                                                        : statusBadge('bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', 'Hidden')}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {displayProducts.length === 0 && (
                                <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <Package size={48} className="opacity-20" />
                                    <p className="font-medium">Mặt hàng trống hoặc không tìm thấy</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedUser) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#020617] font-sans overflow-hidden transition-colors duration-300">
                <div className="px-6 py-5 sm:px-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-800 shadow-sm z-20 shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedUser(null)} className={btnSecondary}>
                            <ArrowLeft size={18} /> Trở về
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <ShoppingBag className="text-slate-900 dark:text-white" size={24} />
                            Đơn hàng của <span className="text-slate-500 dark:text-slate-400">{selectedUser.name}</span>
                        </h2>
                    </div>
                    <div>
                        <ThemeToggleButton />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-6 flex flex-col w-full max-w-[1400px] mx-auto">
                    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden transition-colors duration-300">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse relative">
                                <thead>
                                    <tr>
                                        <th className={tableHeader}>Mã Đơn</th>
                                        <th className={tableHeader}>Ngày xử lý</th>
                                        <th className={tableHeader}>Tổng Thanh Toán</th>
                                        <th className={tableHeader}>Thanh toán bằng</th>
                                        <th className={`${tableHeader} text-right`}>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {userOrders.map((o, index) => (
                                            <motion.tr 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
                                                key={o._id} 
                                                className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors duration-200"
                                            >
                                                <td className={`${tableCell} font-mono text-[13px] text-slate-500 dark:text-slate-400`}>{o._id}</td>
                                                <td className={`${tableCell} text-slate-700 dark:text-slate-300 font-medium`}>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                                                <td className={`${tableCell} font-bold text-slate-900 dark:text-slate-50`}>{o.order_checkout?.totalPrice?.toLocaleString()}đ</td>
                                                <td className={`${tableCell} text-slate-500 dark:text-slate-400`}>
                                                    {o.order_payment?.method === 'credit' 
                                                        ? <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-semibold">Tín Dụng</span> 
                                                        : <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold">Tiền Mặt COD</span>}
                                                </td>
                                                <td className={`${tableCell} text-right`}>
                                                    {o.order_status === 'delivered' ? statusBadge('bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', 'Delivered') 
                                                    : o.order_status === 'cancelled' ? statusBadge('bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400', 'Cancelled') 
                                                    : statusBadge('bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', o.order_status)}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {userOrders.length === 0 && (
                                <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <ShoppingBag size={48} className="opacity-20" />
                                    <p className="font-medium">Người dùng này chưa có đơn hàng nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const renderUsersTab = () => (
        <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse relative">
                <thead>
                    <tr>
                        <th className={tableHeader}>Hồ Sơ</th>
                        <th className={tableHeader}>Email Liên Hệ</th>
                        <th className={tableHeader}>Phân Quyền</th>
                        <th className={tableHeader}>Trạng thái</th>
                        <th className={`${tableHeader} text-right`}>Bảng Điều Khiển</th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                        {filteredUsers.map((user, index) => (
                            <motion.tr 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
                                key={user._id} 
                                className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors duration-200"
                            >
                                <td className={`${tableCell} font-semibold text-slate-900 dark:text-slate-100`}>{user.name}</td>
                                <td className={`${tableCell} text-slate-500 dark:text-slate-400`}>{user.email}</td>
                                <td className={tableCell}>
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold tracking-wide uppercase border border-transparent dark:border-slate-700">
                                        {user.roles.join(', ')}
                                    </span>
                                </td>
                                <td className={tableCell}>
                                    {user.status === 'active' 
                                        ? statusBadge('bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', 'Active') 
                                        : statusBadge('bg-red-50 text-red-600 border border-red-100 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400', 'Blocked')}
                                </td>
                                <td className={`${tableCell} text-right`}>
                                    {user.roles.includes('admin') ? (
                                        <span className="text-slate-400 text-sm font-semibold mr-2 bg-slate-50 dark:bg-slate-800 dark:text-slate-500 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">Hệ Thống</span>
                                    ) : (
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => fetchUserOrders(user._id, user.name)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:-translate-y-0.5 hover:shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 ease-in-out font-semibold text-sm">
                                                Đơn hàng
                                            </button>
                                            <button 
                                                onClick={() => handleBanUser(user._id, user.status)} 
                                                className={user.status === 'active' ? btnActionBan : btnActionUnban}
                                            >
                                                {user.status === 'active' ? 'Khóa' : 'Mở Khóa'}
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
            {filteredUsers.length === 0 && (
                <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Users size={48} className="opacity-20" />
                    <p className="font-medium">Không tìm thấy hồ sơ hệ thống</p>
                </div>
            )}
        </div>
    );

    const renderShopsTab = () => (
        <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse relative">
                <thead>
                    <tr>
                        <th className={tableHeader}>Công ty / Gian Hàng</th>
                        <th className={tableHeader}>Email Chủ Thể</th>
                        <th className={`${tableHeader} text-center`}>Trust</th>
                        <th className={tableHeader}>Trạng thái</th>
                        <th className={`${tableHeader} text-right`}>Bảng Điều Khiển</th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                        {filteredShops.map((shop, index) => (
                            <motion.tr 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
                                key={shop._id} 
                                className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors duration-200"
                            >
                                <td className={`${tableCell} font-semibold text-slate-900 dark:text-slate-100`}>{shop.name}</td>
                                <td className={`${tableCell} text-slate-500 dark:text-slate-400 font-medium`}>{shop.email}</td>
                                <td className={`${tableCell} text-center`}>
                                    <div className="flex justify-center">
                                        {shop.verified ? <CheckCircle size={20} className="text-emerald-500 drop-shadow-sm" /> : <AlertCircle size={20} className="text-slate-300 dark:text-slate-600" />}
                                    </div>
                                </td>
                                <td className={tableCell}>
                                    {shop.status === 'active' 
                                        ? statusBadge('bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', 'Active') 
                                        : shop.status === 'inactive' 
                                            ? statusBadge('bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', 'Inactive') 
                                            : statusBadge('bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50', 'Banned')}
                                </td>
                                <td className={`${tableCell} text-right`}>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => fetchShopProducts(shop._id, shop.name)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:-translate-y-0.5 hover:shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 ease-in-out font-semibold text-sm">
                                            Sản phẩm
                                        </button>
                                        <button 
                                            onClick={() => handleBanShop(shop._id, shop.status)} 
                                            className={shop.status === 'banned' ? btnActionUnban : btnActionBan}
                                        >
                                            {shop.status === 'banned' ? 'Mở Khóa' : 'Treo Quyền'}
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
            {filteredShops.length === 0 && (
                <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Store size={48} className="opacity-20" />
                    <p className="font-medium">Chưa có gian hàng nào đăng kí</p>
                </div>
            )}
        </div>
    );

    if (loading) return (
        <div className="h-screen w-full bg-gray-50 dark:bg-[#020617] flex items-center justify-center font-sans overflow-hidden transition-colors duration-300">
            <div className="flex flex-col items-center gap-5">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-white rounded-full animate-spin shadow-sm"></div>
                <p className="text-slate-600 dark:text-slate-400 font-semibold tracking-wide text-sm uppercase">Truy Xuất System Base...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#020617] font-sans overflow-hidden w-full transition-colors duration-300">
            {/* Top Fixed Area */}
            <div className="px-6 py-5 sm:px-10 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] z-20 shrink-0 transition-colors duration-300">
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-slate-900 dark:bg-white rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-white/10 text-white dark:text-slate-900">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white m-0">Vanguard Command Center</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium hidden sm:block">
                            Kiểm toán, xét duyệt dữ liệu và phòng ngừa vi phạm.
                        </p>
                    </div>
                </div>
                <div>
                    <ThemeToggleButton />
                </div>
            </div>

            {/* Scrollable Container For Dashboard layout */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 w-full max-w-[1400px] mx-auto gap-6 relative">
                
                {/* Tools Header inside padding */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0 z-10">
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ease-in-out ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-slate-100 dark:border-slate-600 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                        >
                            <Users size={18} /> Khách Hàng <span className={`text-xs px-2 py-0.5 rounded-md ml-1 ${activeTab === 'users' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-transparent text-slate-400'}`}>{users.length}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('shops')}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ease-in-out ${activeTab === 'shops' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-slate-100 dark:border-slate-600 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                        >
                            <Store size={18} /> Gian Hàng Bán <span className={`text-xs px-2 py-0.5 rounded-md ml-1 ${activeTab === 'shops' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-transparent text-slate-400'}`}>{shops.length}</span>
                        </button>
                    </div>

                    <div className="flex items-center bg-white dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2.5 shadow-sm focus-within:shadow-md focus-within:-translate-y-0.5 focus-within:border-slate-400 dark:focus-within:border-slate-500 transition-all duration-300 ease-in-out w-full sm:w-80">
                        <Search size={18} className="text-slate-400 shrink-0" />
                        <input 
                            type="text" 
                            placeholder="Tra cứu người dùng, gian hàng..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none ml-3 w-full text-sm font-semibold"
                        />
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col flex-1 overflow-hidden relative transition-colors duration-300">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="flex-1 flex flex-col overflow-hidden"
                        >
                            {activeTab === 'users' ? renderUsersTab() : renderShopsTab()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
