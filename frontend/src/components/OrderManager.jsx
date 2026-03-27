import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Truck, Package, MapPin, User, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react';

const OrderManager = ({ shopId }) => {
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [loading, setLoading] = useState(false);
    
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/order/shop/orders?shopId=${shopId}&status=${statusFilter}`);
            if (res.data?.status === 'success') {
                setOrders(res.data.metadata.orders);
            }
        } catch(e) {
            console.error("Error fetching shop orders:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (shopId) fetchOrders();
    }, [shopId, statusFilter]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        if (newStatus === 'cancelled' && !window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
        
        try {
            setLoading(true);
            const res = await api.patch('/order/status', { orderId, status: newStatus });
            if (res.data?.status === 'success') {
                alert(`Cập nhật trạng thái thành công: ${newStatus}`);
                fetchOrders();
            }
        } catch(e) {
            alert(e.response?.data?.message || "Lỗi khi cập nhật trạng thái");
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            'pending': 'Chờ duyệt',
            'confirmed': 'Đã xác nhận',
            'shipping': 'Đang giao',
            'delivered': 'Đã giao',
            'cancelled': 'Đã hủy'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'var(--primary)',
            'confirmed': 'var(--secondary)',
            'shipping': '#3b82f6',
            'delivered': 'var(--success)',
            'cancelled': 'var(--danger)'
        };
        return colors[status] || 'var(--text-muted)';
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem', overflowX: 'auto' }}>
                {['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].map(st => (
                    <button 
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            background: statusFilter === st ? 'rgba(var(--secondary-rgb), 0.1)' : 'transparent',
                            color: statusFilter === st ? 'var(--secondary)' : 'var(--text-muted)',
                            fontWeight: statusFilter === st ? 'bold' : 'normal',
                            border: statusFilter === st ? '1px solid var(--secondary)' : '1px solid transparent',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                    >
                        {getStatusLabel(st)}
                    </button>
                ))}
            </div>

            {orders.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <Truck size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>Hiện không có đơn hàng nào ở trạng thái {statusFilter}.</p>
                 </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {orders.map(order => (
                        <div key={order._id} className="glass-panel" style={{ 
                            padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)',
                            background: 'rgba(255, 255, 255, 0.03)'
                        }}>
                             {/* Order Header */}
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
                                 <div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                         <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                                             Đơn: #{order._id.substring(order._id.length - 8).toUpperCase()}
                                         </strong>
                                         <span style={{ 
                                             fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px',
                                             background: `${getStatusColor(order.order_status)}22`, 
                                             color: getStatusColor(order.order_status),
                                             fontWeight: 'bold', border: `1px solid ${getStatusColor(order.order_status)}44`
                                         }}>
                                             {getStatusLabel(order.order_status)}
                                         </span>
                                     </div>
                                     <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                         {new Date(order.createdAt).toLocaleString('vi-VN')}
                                     </span>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                     <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: 'var(--secondary)' }}>
                                         {order.order_checkout.totalApplyDiscount.toLocaleString()} đ
                                     </p>
                                     <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                         {order.order_payment.method === 'cod' ? 'Thanh toán COD' : 'Đã thanh toán Online'}
                                     </span>
                                 </div>
                             </div>

                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                                 {/* Products List */}
                                 <div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                         <Package size={16} />
                                         <span style={{ fontWeight: 'bold' }}>Sản phẩm ({order.order_products.length})</span>
                                     </div>
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                         {order.order_products.map((item, idx) => (
                                             <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                 <img src={item.product_thumb || item.thumb || `https://via.placeholder.com/50?text=${item.name}`} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                                                 <div style={{ flex: 1 }}>
                                                     <p style={{ margin: 0, fontSize: '0.95rem' }}>{item.name}</p>
                                                     <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                         {item.price.toLocaleString()} đ x {item.quantity}
                                                     </p>
                                                 </div>
                                                 <p style={{ margin: 0, fontWeight: 'bold' }}>{(item.price * item.quantity).toLocaleString()} đ</p>
                                             </div>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Shipping Info & Actions */}
                                 <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '2rem' }}>
                                     <div style={{ marginBottom: '1.5rem' }}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                             <User size={16} />
                                             <span style={{ fontWeight: 'bold' }}>Khách hàng</span>
                                         </div>
                                         <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>
                                              {order.order_shipping.customerName || 'Khách hàng Vanguard'}
                                         </p>
                                         <p style={{ margin: '0 0 4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                              {order.order_shipping.street || 'N/A'}
                                         </p>
                                         <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                  <MapPin size={14} />
                                                  <span>{order.order_shipping.city || 'N/A'}, {order.order_shipping.country || 'Việt Nam'}</span>
                                              </div>
                                              {order.order_shipping.phone && (
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', marginTop: '4px' }}>
                                                      <span>SĐT: {order.order_shipping.phone}</span>
                                                  </div>
                                              )}
                                         </div>
                                     </div>

                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                         {order.order_status === 'pending' && (
                                             <>
                                                 <button 
                                                     onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                                                     style={{ background: 'var(--success)', color: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
                                                 >
                                                     <CheckCircle size={18} /> Xác nhận đơn
                                                  </button>
                                                  <button 
                                                     onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                                                     style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                  >
                                                     <XCircle size={18} /> Hủy đơn
                                                  </button>
                                             </>
                                         )}
                                         {order.order_status === 'confirmed' && (
                                             <button 
                                                 onClick={() => handleUpdateStatus(order._id, 'shipping')}
                                                 style={{ background: 'var(--secondary)', color: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
                                             >
                                                 <Truck size={18} /> Bắt đầu giao hàng
                                             </button>
                                         )}
                                         {order.order_status === 'shipping' && (
                                             <button 
                                                 onClick={() => handleUpdateStatus(order._id, 'delivered')}
                                                 style={{ background: 'var(--success)', color: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
                                             >
                                                 <Package size={18} /> Đã giao thành công
                                             </button>
                                         )}
                                         {['delivered', 'cancelled'].includes(order.order_status) && (
                                             <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px' }}>
                                                 Đơn hàng đã kết thúc
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderManager;
