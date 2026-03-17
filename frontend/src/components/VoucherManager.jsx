import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Tag, Plus, Trash2, Power, PowerOff, 
    Calendar, Percent, DollarSign, AlertCircle, 
    CheckCircle2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoucherManager = ({ shopId }) => {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        value: '',
        type: 'fixed_amount',
        start_date: '',
        end_date: '',
        max_uses: 100,
        uses_per_user: 1,
        min_order_value: 0
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDiscounts();
    }, [shopId]);

    const fetchDiscounts = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/discount/shop/${shopId}?all=true`);
            if (res.data?.status === 'success') {
                setDiscounts(res.data.metadata);
            }
        } catch (error) {
            console.error("Error fetching discounts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (code, currentStatus) => {
        try {
            const res = await api.post('/discount/toggle', {
                shopId,
                code,
                isActive: !currentStatus
            });
            if (res.data?.status === 'success') {
                setDiscounts(prev => prev.map(d => 
                    d.discount_code === code ? { ...d, is_active: !currentStatus } : d
                ));
            }
        } catch (error) {
            alert("Lỗi khi thay đổi trạng thái voucher");
        }
    };

    const handleDelete = async (code) => {
        if (!window.confirm(`Bạn có chắc muốn xóa voucher ${code}?`)) return;
        try {
            const res = await api.post('/discount/delete', { shopId, code });
            if (res.data?.status === 'success') {
                setDiscounts(prev => prev.filter(d => d.discount_code !== code));
                alert("Đã xóa voucher");
            }
        } catch (error) {
            alert("Lỗi khi xóa voucher");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post('/discount/create', {
                ...formData,
                shopId,
                is_active: true
            });
            if (res.data?.status === 'success') {
                setDiscounts([res.data.metadata, ...discounts]);
                setShowAddForm(false);
                setFormData({
                    name: '', code: '', value: '', type: 'fixed_amount',
                    start_date: '', end_date: '', max_uses: 100,
                    uses_per_user: 1, min_order_value: 0
                });
                alert("Tạo voucher thành công!");
            }
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi tạo voucher");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Tag size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Quản Lý <span className="gradient-text">Voucher</span></h2>
                </div>
                <button 
                    onClick={() => setShowAddForm(true)}
                    style={{ 
                        background: 'var(--primary)', color: 'white', padding: '10px 20px', 
                        borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' 
                    }}
                >
                    <Plus size={18} /> Tạo Voucher Mới
                </button>
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel" 
                        style={{ padding: '2rem', borderRadius: '16px', position: 'relative' }}
                    >
                        <button 
                            onClick={() => setShowAddForm(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 style={{ margin: '0 0 1.5rem' }}>Thiết Lập Chương Trình Giảm Giá</h3>
                        
                        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tên Voucher</label>
                                <input type="text" placeholder="Ví dụ: Giảm Giá Mùa Hè" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Mã Voucher (Code)</label>
                                <input type="text" placeholder="Ví dụ: SUMMER2026" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loại Giảm Giá</label>
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ background: 'var(--bg-color)', color: 'white' }}>
                                    <option value="fixed_amount">Số tiền cố định (đ)</option>
                                    <option value="percentage">Phần trăm (%)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Giá Trị Giảm</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="number" required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} style={{ width: '100%' }} />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                        {formData.type === 'percentage' ? '%' : 'đ'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Giá trị đơn tối thiểu</label>
                                <input type="number" required value={formData.min_order_value} onChange={e => setFormData({...formData, min_order_value: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tổng số lượt sử dụng</label>
                                <input type="number" required value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ngày Bắt Đầu</label>
                                <input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ngày Kết Thúc</label>
                                <input type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                            </div>
                            
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowAddForm(false)} className="glass-panel" style={{ padding: '10px 24px', borderRadius: '8px' }}>Hủy</button>
                                <button type="submit" disabled={submitting} style={{ background: 'var(--primary)', color: 'white', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold' }}>
                                    {submitting ? 'Đang tạo...' : 'Lưu Voucher'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải danh sách voucher...</div>
                ) : discounts.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Bạn chưa có chương trình khuyến mãi nào.
                    </div>
                ) : (
                    discounts.map(discount => {
                        const isExpired = new Date(discount.discount_end_date) < new Date();
                        return (
                            <div key={discount._id} className="glass-panel" style={{ 
                                padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderLeft: `4px solid ${discount.is_active ? 'var(--primary)' : 'var(--text-muted)'}`,
                                opacity: isExpired ? 0.6 : 1
                            }}>
                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                    <div style={{ 
                                        width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                                    }}>
                                        {discount.discount_type === 'percentage' ? <Percent size={24} /> : <DollarSign size={24} />}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <h3 style={{ margin: 0 }}>{discount.discount_name}</h3>
                                            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                                                {discount.discount_code}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <DollarSign size={14} /> Giá trị: {discount.discount_value}{discount.discount_type === 'percentage' ? '%' : 'đ'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CheckCircle2 size={14} /> Đã dùng: {discount.discount_users_used.length}/{discount.discount_max_uses}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isExpired ? 'var(--danger)' : 'inherit' }}>
                                                <Calendar size={14} /> Hạn: {new Date(discount.discount_end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => handleToggle(discount.discount_code, discount.is_active)}
                                        style={{ 
                                            padding: '8px', borderRadius: '8px', background: 'none', border: '1px solid var(--card-border)',
                                            color: discount.is_active ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer'
                                        }}
                                        title={discount.is_active ? "Tạm dừng" : "Kích hoạt"}
                                    >
                                        {discount.is_active ? <Power size={18} /> : <PowerOff size={18} />}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(discount.discount_code)}
                                        style={{ 
                                            padding: '8px', borderRadius: '8px', background: 'none', border: '1px solid var(--card-border)',
                                            color: 'var(--danger)', cursor: 'pointer'
                                        }}
                                        title="Xóa voucher"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default VoucherManager;
