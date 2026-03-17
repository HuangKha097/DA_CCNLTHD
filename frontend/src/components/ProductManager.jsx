import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Archive, ExternalLink, Trash2, CheckCircle, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductManager = ({ shopId }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [isAddMode, setIsAddMode] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        product_name: '', 
        product_price: '', 
        product_description: '', 
        product_quantity: '', 
        product_type: 'Electronics',
        product_thumb: '',
        product_images_text: '', // Multi-image support
        product_attributes_text: '' // JSON/Manual attributes
    });
    const [attributeList, setAttributeList] = useState([{ key: '', value: '' }]);

    useEffect(() => {
        fetchProducts();
    }, [shopId]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/product/all-shop/${shopId}`);
            if (res.data?.status === 'success') {
                setProducts(res.data.metadata.products);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const attributes = {};
            attributeList.forEach(attr => {
                if(attr.key.trim()) attributes[attr.key.trim()] = attr.value;
            });

            const payload = {
                product_shop: shopId,
                product_name: formData.product_name,
                product_price: Number(formData.product_price),
                product_description: formData.product_description,
                product_quantity: Number(formData.product_quantity),
                product_type: formData.product_type,
                product_thumb: formData.product_thumb,
                product_images: formData.product_images_text.split(',').map(s => s.trim()).filter(s => s),
                product_attributes: attributes,
                isPublished: true
            };
            
            let res;
            if (isEditMode) {
                res = await api.put(`/product/${editingProductId}`, payload);
            } else {
                res = await api.post('/product/create', payload);
            }

            if (res.data?.status === 'success') {
                alert(isEditMode ? "Cập nhật sản phẩm thành công!" : "Tạo sản phẩm thành công!");
                resetForm();
                fetchProducts();
            }
        } catch(e) {
            alert(e.response?.data?.message || "Lỗi khi xử lý sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setIsAddMode(false);
        setIsEditMode(false);
        setEditingProductId(null);
        setFormData({
            product_name: '', product_price: '', product_description: '', 
            product_quantity: '', product_type: 'Electronics', product_thumb: '',
            product_images_text: '', product_attributes_text: ''
        });
        setAttributeList([{ key: '', value: '' }]);
    };

    const handleEditClick = (product) => {
        setEditingProductId(product._id);
        setFormData({
            product_name: product.product_name,
            product_price: product.product_price,
            product_description: product.product_description,
            product_quantity: product.product_quantity,
            product_type: product.product_type,
            product_thumb: product.product_thumb,
            product_images_text: (product.product_images || []).join(', '),
            product_attributes_text: ''
        });
        
        // Convert attributes object back to list
        const attrs = Object.entries(product.product_attributes || {}).map(([key, value]) => ({ key, value }));
        setAttributeList(attrs.length > 0 ? attrs : [{ key: '', value: '' }]);
        
        setIsEditMode(true);
        setIsAddMode(true); // Reuse the same form view
    };

    const handleDeleteProduct = async (productId) => {
        if(!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
        try {
            const res = await api.delete(`/product/${productId}`);
            if (res.data?.status === 'success') {
                alert("Xóa sản phẩm thành công");
                fetchProducts();
            }
        } catch(e) {
            alert("Lỗi khi xóa sản phẩm");
        }
    };

    const handleTogglePublish = async (product) => {
        try {
            const endpoint = product.isPublished ? `/product/unpublish/${product._id}` : `/product/publish/${product._id}`;
            const res = await api.patch(endpoint);
            if (res.data?.status === 'success') {
                fetchProducts();
            }
        } catch(e) {
            alert("Lỗi khi thay đổi trạng thái sản phẩm");
        }
    };

    const addAttribute = () => setAttributeList([...attributeList, { key: '', value: '' }]);
    const updateAttribute = (index, field, value) => {
        const newList = [...attributeList];
        newList[index][field] = value;
        setAttributeList(newList);
    };

    if (isAddMode) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>{isEditMode ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
                    <button onClick={resetForm} style={{ color: 'var(--text-muted)' }}>Hủy bỏ</button>
                </div>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Tên Sản Phẩm</label>
                            <input required style={inputStyle} value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} />
                        </div>
                        <div>
                            <label>Giá (VND)</label>
                            <input required type="number" style={inputStyle} value={formData.product_price} onChange={e => setFormData({...formData, product_price: e.target.value})} />
                        </div>
                        <div>
                            <label>Số lượng kho</label>
                            <input required type="number" style={inputStyle} value={formData.product_quantity} onChange={e => setFormData({...formData, product_quantity: e.target.value})} />
                        </div>
                        <div>
                            <label>Loại Sản Phẩm</label>
                            <select style={inputStyle} value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})}>
                                <option value="Electronics">Điện Tử</option>
                                <option value="Clothing">Quần Áo</option>
                                <option value="Furniture">Nội Thất</option>
                                <option value="Footwear">Giày Dép</option>
                                <option value="Accessories">Phụ Kiện</option>
                                <option value="Beauty">Làm Đẹp</option>
                                <option value="Health">Sức Khỏe</option>
                                <option value="Sports">Thể Thao</option>
                                <option value="Toys">Đồ Chơi</option>
                                <option value="Books">Sách</option>
                                <option value="Groceries">Bách Hóa</option>
                                <option value="Automotive">Ô Tô & Xe Máy</option>
                                <option value="Pet">Thú Cưng</option>
                                <option value="Appliances">Gia Dụng</option>
                                <option value="Other">Khác</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Thumbnail / Ảnh Chính (URL)</label>
                            <input required style={inputStyle} value={formData.product_thumb} onChange={e => setFormData({...formData, product_thumb: e.target.value})} placeholder="https://..." />
                        </div>
                        <div>
                            <label>Ảnh Chi Tiết (URL, cách nhau bằng dấu phẩy)</label>
                            <input style={inputStyle} value={formData.product_images_text} onChange={e => setFormData({...formData, product_images_text: e.target.value})} placeholder="url1, url2..." />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Thuộc Tính Chi Tiết</label>
                        {attributeList.map((attr, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                <input placeholder="Tên (vd: RAM)" style={{...inputStyle, marginTop: 0}} value={attr.key} onChange={e => updateAttribute(idx, 'key', e.target.value)} />
                                <input placeholder="Giá trị (vd: 16GB)" style={{...inputStyle, marginTop: 0}} value={attr.value} onChange={e => updateAttribute(idx, 'value', e.target.value)} />
                            </div>
                        ))}
                        <button type="button" onClick={addAttribute} style={{ padding: '4px 12px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', borderRadius: '4px', fontSize: '0.8rem' }}>
                            + Thêm thuộc tính
                        </button>
                    </div>
                    <div>
                        <label>Mô tả chi tiết</label>
                        <textarea required rows={4} style={inputStyle} value={formData.product_description} onChange={e => setFormData({...formData, product_description: e.target.value})}></textarea>
                    </div>

                    <button type="submit" disabled={loading} style={{ padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 'bold', alignSelf: 'flex-start', opacity: loading ? 0.7 : 1 }}>
                        {isEditMode ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm Phát Hành'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Đang hiển thị {products.length} sản phẩm</p>
                <button onClick={() => setIsAddMode(true)} style={{ 
                    background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <Plus size={16} /> Thêm Sản Phẩm Mới
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {products.map(p => (
                    <div key={p._id} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {/* Status Badge */}
                        <div style={{ 
                            position: 'absolute', top: '1rem', right: '1rem', 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                            background: p.isPublished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                            color: p.isPublished ? 'var(--success)' : 'var(--primary)',
                            display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1
                        }}>
                             {p.isPublished ? <CheckCircle size={12} /> : <EyeOff size={12} />}
                             {p.isPublished ? 'Đang bán' : 'Bản nháp'}
                        </div>

                        <div style={{ height: '180px', background: 'var(--card-border)', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden' }}>
                             <img src={p.product_thumb || 'https://via.placeholder.com/280?text=Image'} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{p.product_name}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: 0 }}>{p.product_price.toLocaleString()} VND</p>
                             <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Kho: {p.product_quantity}</p>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                             <div style={{ display: 'flex', gap: '12px' }}>
                                 <button onClick={() => handleEditClick(p)} style={{ color: 'var(--secondary)', transition: 'transform 0.2s' }} title="Chỉnh sửa">
                                     <Edit2 size={16} />
                                 </button>
                                 <button onClick={() => handleTogglePublish(p)} style={{ color: 'var(--text-muted)' }} title={p.isPublished ? "Ẩn khỏi cửa hàng" : "Phát hành"}>
                                     {p.isPublished ? <Archive size={16} /> : <ExternalLink size={16} />}
                                 </button>
                                 <button onClick={() => handleDeleteProduct(p._id)} style={{ color: 'var(--danger)' }} title="Xóa vĩnh viễn">
                                     <Trash2 size={16} />
                                 </button>
                             </div>
                             
                             <button onClick={() => navigate(`/product/${p._id}`)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                 <ExternalLink size={14} /> Chi tiết
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%', padding: '12px', background: 'var(--bg-color)', color: 'white',
    border: '1px solid var(--card-border)', borderRadius: '8px', outline: 'none',
    marginTop: '6px'
};

export default ProductManager;
