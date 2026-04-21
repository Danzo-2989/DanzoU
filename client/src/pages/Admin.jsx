import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { LayoutDashboard, Plus, Package, Mail, ListPlus, ArrowLeft, Zap, Lock, Trash2, ChevronDown, ChevronUp, Key, Tag, Gamepad2, X, Pencil, Check, Save, Megaphone, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Admin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [stock, setStock] = useState({});
  const [transactions, setTransactions] = useState({});
  const [trxFilter, setTrxFilter] = useState('ALL');
  const [categories, setCategories] = useState({});
  const [newCategory, setNewCategory] = useState({ name: '', type: 'DEVICE' });
  const [emailTemplate, setEmailTemplate] = useState('');
  const [announcement, setAnnouncement] = useState({
    enabled: false,
    message: '',
    buttonText: '',
    buttonUrl: ''
  });
  const [newProduct, setNewProduct] = useState({ name: '', desc: '', image: '', tags: '', feature_media: '' });
  const [newSub, setNewSub] = useState({ productId: '', label: '', price: '' });
  const [bulkStock, setBulkStock] = useState({ subId: '', keys: '' });
  const [auth, setAuth] = useState({ isAuthed: false, password: '' });
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedSub, setExpandedSub] = useState(null);
  const [gameProductId, setGameProductId] = useState('');
  const [newGame, setNewGame] = useState({ name: '', note: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [editingKey, setEditingKey] = useState(null);

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    onValue(ref(db, 'products'), (snapshot) => { setProducts(snapshot.val() || {}); });
    onValue(ref(db, 'stock'), (snapshot) => { setStock(snapshot.val() || {}); });
    onValue(ref(db, 'transactions'), (snapshot) => { setTransactions(snapshot.val() || {}); });
    onValue(ref(db, 'settings/emailTemplate'), (snapshot) => { setEmailTemplate(snapshot.val() || ''); });
    onValue(ref(db, 'settings/announcement'), (snapshot) => {
      const data = snapshot.val();
      if (data) setAnnouncement(data);
    });
    onValue(ref(db, 'settings/categories'), (snapshot) => { setCategories(snapshot.val() || {}); });
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${backendUrl}/admin/products`, newProduct, { headers: { 'x-admin-password': auth.password }});
      setNewProduct({ name: '', desc: '', image: '', tags: '', feature_media: '' });
      alert('Produk berhasil ditambahkan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal tambah produk'); }
  };

  const addSubProduct = async (e) => {
    e.preventDefault();
    if (!newSub.productId) return;
    try {
      await axios.post(`${backendUrl}/admin/products/${newSub.productId}/sub_products`,
        { label: newSub.label, price: Number(newSub.price) },
        { headers: { 'x-admin-password': auth.password }}
      );
      setNewSub({ productId: '', label: '', price: '' });
      alert('Variasi berhasil ditambahkan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal tambah variasi'); }
  };

  const addGameVariant = async (e) => {
    e.preventDefault();
    if (!gameProductId || !newGame.name) return;
    try {
      await axios.post(`${backendUrl}/admin/products/${gameProductId}/game_variants`, newGame, { headers: { 'x-admin-password': auth.password }});
      setNewGame({ name: '', note: '' });
      alert('Game variant berhasil ditambahkan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal tambah game variant'); }
  };

  const addBulkStock = async (e) => {
    e.preventDefault();
    if (!bulkStock.subId || !bulkStock.keys) return;
    const keysArray = bulkStock.keys.split('\n').filter(k => k.trim() !== '');
    try {
      await axios.post(`${backendUrl}/admin/stock/${bulkStock.subId}`, { keys: keysArray }, { headers: { 'x-admin-password': auth.password }});
      setBulkStock({ subId: '', keys: '' });
      alert(`Sukses menambahkan ${keysArray.length} key!`);
    } catch (err) { alert(err.response?.data?.message || 'Gagal tambah stok'); }
  };

  const deleteProduct = async (productId, productName) => {
    if (!confirm(`Hapus produk "${productName}"? Semua variasi & stok akan ikut terhapus!`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/products/${productId}`, { headers: { 'x-admin-password': auth.password }});
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus produk'); }
  };

  const deleteSubProduct = async (productId, subId, label) => {
    if (!confirm(`Hapus variasi "${label}"?`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/products/${productId}/sub_products/${subId}`, { headers: { 'x-admin-password': auth.password }});
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus variasi'); }
  };

  const deleteStockKey = async (subId, keyId, keyValue) => {
    if (!confirm(`Hapus key "${keyValue}"?`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/stock/${subId}/${keyId}`, { headers: { 'x-admin-password': auth.password }});
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus key'); }
  };

  const deleteGameVariant = async (productId, gameId, gameName) => {
    if (!confirm(`Hapus game "${gameName}"?`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/products/${productId}/game_variants/${gameId}`, { headers: { 'x-admin-password': auth.password }});
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus game variant'); }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) return;
    try {
      await axios.post(`${backendUrl}/admin/settings/categories`, newCategory, { headers: { 'x-admin-password': auth.password }});
      setNewCategory({ name: '', type: 'DEVICE' });
      alert('Kategori berhasil ditambahkan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal tambah kategori'); }
  };

  const deleteCategory = async (categoryId, categoryName) => {
    if (!confirm(`Hapus kategori "${categoryName}"?`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/settings/categories/${categoryId}`, { headers: { 'x-admin-password': auth.password }});
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus kategori'); }
  };

  const saveEditProduct = async () => {
    if (!editingProduct) return;
    try {
      await axios.put(`${backendUrl}/admin/products/${editingProduct.id}`, editingProduct.data, { headers: { 'x-admin-password': auth.password }});
      setEditingProduct(null);
      alert('Produk berhasil diupdate!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal update produk'); }
  };

  const saveEditSub = async () => {
    if (!editingSub) return;
    try {
      await axios.put(`${backendUrl}/admin/products/${editingSub.pid}/sub_products/${editingSub.sid}`,
        { label: editingSub.data.label, price: Number(editingSub.data.price) },
        { headers: { 'x-admin-password': auth.password }}
      );
      setEditingSub(null);
      alert('Variasi berhasil diupdate!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal update variasi'); }
  };

  const saveEditKey = async () => {
    if (!editingKey) return;
    try {
      await axios.put(`${backendUrl}/admin/stock/${editingKey.subId}/${editingKey.keyId}`,
        { key: editingKey.value },
        { headers: { 'x-admin-password': auth.password }}
      );
      setEditingKey(null);
    } catch (err) { alert(err.response?.data?.message || 'Gagal update key'); }
  };

  const saveEmailTemplate = async () => {
    try {
      await axios.post(`${backendUrl}/admin/settings/emailTemplate`, { template: emailTemplate }, { headers: { 'x-admin-password': auth.password }});
      alert('Template email berhasil disimpan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal simpan template'); }
  };

  const saveAnnouncement = async () => {
    try {
      await axios.post(`${backendUrl}/admin/settings/announcement`, announcement, { headers: { 'x-admin-password': auth.password }});
      alert('Pengumuman website berhasil disimpan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal simpan pengumuman'); }
  };

  const resendKey = async (trxId) => {
    if (!confirm('Kirim ulang email ke pembeli ini?')) return;
    try {
      await axios.post(`${backendUrl}/admin/transactions/${trxId}/resend`, {}, { headers: { 'x-admin-password': auth.password }});
      alert('Email berhasil dikirim ulang!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal mengirim ulang'); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendUrl}/admin/login`, { password: auth.password });
      if (res.data.success) {
        setAuth({ ...auth, isAuthed: true });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Password salah!');
    }
  };

  const handleReorder = async (type, parentId, itemsArray, index, direction) => {
    if ((direction === 'UP' && index === 0) || (direction === 'DOWN' && index === itemsArray.length - 1)) return;
    
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const currentItem = itemsArray[index];
    const targetItem = itemsArray[targetIndex];

    const currentOrder = currentItem.order !== undefined ? currentItem.order : index;
    const targetOrder = targetItem.order !== undefined ? targetItem.order : targetIndex;
    
    let newCurrentOrder = targetOrder;
    let newTargetOrder = currentOrder;
    if (newCurrentOrder === newTargetOrder) {
      newCurrentOrder = direction === 'UP' ? newTargetOrder - 1 : newTargetOrder + 1;
    }

    if (type === 'PRODUCT') {
      updates[`products/${currentItem.id}/order`] = newCurrentOrder;
      updates[`products/${targetItem.id}/order`] = newTargetOrder;
    } else if (type === 'SUB_PRODUCT') {
      updates[`products/${parentId}/sub_products/${currentItem.id}/order`] = newCurrentOrder;
      updates[`products/${parentId}/sub_products/${targetItem.id}/order`] = newTargetOrder;
    } else if (type === 'GAME_VARIANT') {
      updates[`products/${parentId}/game_variants/${currentItem.id}/order`] = newCurrentOrder;
      updates[`products/${parentId}/game_variants/${targetItem.id}/order`] = newTargetOrder;
    } else if (type === 'CATEGORY') {
      updates[`settings/categories/${currentItem.id}/order`] = newCurrentOrder;
      updates[`settings/categories/${targetItem.id}/order`] = newTargetOrder;
    }

    try {
      await axios.post(`${backendUrl}/admin/reorder`, { updates }, { headers: { 'x-admin-password': auth.password }});
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah urutan');
    }
  };

  const sortedProducts = Object.entries(products)
    .map(([id, product], idx) => ({ id, ...product, sortOrder: product.order !== undefined ? product.order : idx }))
    .sort((a, b) => a.sortOrder - b.sortOrder);


  const sortedCategories = Object.entries(categories)
    .map(([id, cat], idx) => ({ id, ...cat, sortOrder: cat.order !== undefined ? cat.order : idx }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
    
  const deviceTags = sortedCategories.filter(c => c.type === 'DEVICE');
  const gameTags = sortedCategories.filter(c => c.type === 'GAME');

  const toggleTag = (tag) => {
    const current = newProduct.tags ? newProduct.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const exists = current.some(t => t.toLowerCase() === tag.toLowerCase());
    const updated = exists ? current.filter(t => t.toLowerCase() !== tag.toLowerCase()) : [...current, tag];
    setNewProduct({ ...newProduct, tags: updated.join(', ') });
  };

  const isTagActive = (tag) => {
    const current = newProduct.tags ? newProduct.tags.split(',').map(t => t.trim().toLowerCase()) : [];
    return current.includes(tag.toLowerCase());
  };

  if (!auth.isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleAuth} className="neo-card flex flex-col gap-6 max-w-md w-full animate-fade-in-up">
          <div className="flex justify-center mb-2">
            <div className="bg-neo-green text-slate-900 p-4 border-4 border-neo-border"><Lock size={40} className="" strokeWidth={3}/></div>
          </div>
          <h2 className="text-3xl font-black uppercase text-center text-neo-dark">Kunci Admin</h2>
          <input type="password" className="neo-input text-center font-bold tracking-widest text-lg" placeholder="Masukkan Password"
            value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} required/>
          <button className="neo-button-primary mt-2">Masuk Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pt-12 pb-24">
      <button onClick={() => navigate('/')} className="neo-button mb-8 inline-flex animate-fade-in-up">
        <ArrowLeft size={20} strokeWidth={3} className="mr-2"/> Kembali
      </button>

      <div className="neo-card bg-neo-green text-slate-900 mb-12 animate-fade-in-up flex items-center justify-center py-8">
        <h1 className="text-4xl md:text-6xl font-black uppercase flex items-center gap-4 text-center">
          <LayoutDashboard size={48} strokeWidth={3} className="hidden md:block text-neo-dark"/>
          Control <span className="bg-neo-surface px-4 border-4 border-neo-border mx-2">Center</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Tambah Produk */}
        <section className="neo-card flex flex-col gap-6 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-neo-green text-slate-900 border-4 border-neo-border p-2"><Plus size={24} strokeWidth={3}/></div>
            Produk Baru
          </h2>
          <form onSubmit={addProduct} className="flex flex-col gap-5">
            <input className="neo-input" placeholder="Nama Aplikasi..."
              value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required/>
            <textarea className="neo-input min-h-[100px]" placeholder="Deskripsi Singkat..."
              value={newProduct.desc} onChange={e => setNewProduct({...newProduct, desc: e.target.value})} required/>
            <input className="neo-input" placeholder="URL Gambar (Opsional)"
              value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})}/>
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase text-sm flex items-center gap-2 bg-red-200 border-2 border-neo-border w-fit px-3 py-1 shadow-[2px_2px_0_0_var(--color-neo-border)]">
                🎬 URL Feature (Gambar/Video)
              </label>
              <input className="neo-input text-sm" placeholder="URL gambar atau YouTube..."
                value={newProduct.feature_media} onChange={e => setNewProduct({...newProduct, feature_media: e.target.value})}/>
              <p className="text-xs font-bold opacity-50">Tampil saat pembeli klik "SEE FEATURES"</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase text-sm flex items-center gap-2 bg-pink-200 border-2 border-neo-border w-fit px-3 py-1 shadow-[2px_2px_0_0_var(--color-neo-border)]">
                <Tag size={14} strokeWidth={3}/> Tags Platform & Games
              </label>
              
              <p className="font-bold text-xs opacity-60 uppercase tracking-widest mt-1">Platform / Device</p>
              <div className="flex flex-wrap gap-2">
                {deviceTags.map(cat => (
                  <button key={cat.id} type="button" onClick={() => toggleTag(cat.name)}
                    className={`border-2 border-neo-border px-3 py-1 text-xs font-black uppercase transition-all
                      ${isTagActive(cat.name) ? 'bg-neo-dark text-neo-surface' : 'bg-neo-surface hover:bg-pink-100 shadow-[2px_2px_0_0_var(--color-neo-border)]'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
              
              <p className="font-bold text-xs opacity-60 uppercase tracking-widest mt-2">Games</p>
              <div className="flex flex-wrap gap-2">
                {gameTags.map(cat => (
                  <button key={cat.id} type="button" onClick={() => toggleTag(cat.name)}
                    className={`border-2 border-neo-border px-3 py-1 text-xs font-black uppercase transition-all
                      ${isTagActive(cat.name) ? 'bg-neo-dark text-neo-surface' : 'bg-neo-surface hover:bg-yellow-100 shadow-[2px_2px_0_0_var(--color-neo-border)]'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>

              <input className="neo-input text-sm mt-2" placeholder="Atau ketik manual tag lain (Dipisahkan koma)"
                value={newProduct.tags} onChange={e => setNewProduct({...newProduct, tags: e.target.value})}/>
            </div>
            <button className="neo-button-primary mt-2">SIMPAN PRODUK</button>
          </form>
        </section>

        {/* Tambah Variasi */}
        <section className="neo-card flex flex-col gap-6 animate-fade-in-up md:col-span-1 lg:col-span-1">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-neo-green text-slate-900 border-4 border-neo-border p-2"><Package size={24} strokeWidth={3}/></div>
            Variasi (Bulan/Tahun)
          </h2>
          <form onSubmit={addSubProduct} className="flex flex-col gap-5">
            <select className="neo-input font-bold" value={newSub.productId} onChange={e => setNewSub({...newSub, productId: e.target.value})} required>
              <option value="">-- Pilih Produk --</option>
              {Object.entries(products).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}
            </select>
            <input className="neo-input" placeholder="Label (Misal: 1 Bulan)"
              value={newSub.label} onChange={e => setNewSub({...newSub, label: e.target.value})} required/>
            <input className="neo-input" type="number" placeholder="Harga (Rp)"
              value={newSub.price} onChange={e => setNewSub({...newSub, price: e.target.value})} required/>
            <button className="neo-button-primary mt-2">SIMPAN VARIASI</button>
          </form>
        </section>

        {/* Tambah Game Variant */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-yellow-300 border-4 border-neo-border p-2"><Gamepad2 size={24} strokeWidth={3}/></div>
            Pilihan Game (Free Fire, MLBB, dll)
          </h2>
          <form onSubmit={addGameVariant} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <select className="neo-input font-bold" value={gameProductId} onChange={e => setGameProductId(e.target.value)} required>
              <option value="">-- Pilih Produk --</option>
              {Object.entries(products).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}
            </select>
            <input className="neo-input" placeholder="Nama Game (Misal: Free Fire)"
              value={newGame.name} onChange={e => setNewGame({...newGame, name: e.target.value})} required/>
            <input className="neo-input" placeholder="Catatan (Opsional)"
              value={newGame.note} onChange={e => setNewGame({...newGame, note: e.target.value})}/>
            <button className="neo-button-primary md:col-span-3">TAMBAH GAME</button>
          </form>
          {Object.entries(products).some(([, p]) => p.game_variants) && (
            <div className="flex flex-col gap-3 border-t-4 border-neo-border pt-4">
              <p className="font-black uppercase text-sm opacity-60">Game yang sudah ditambahkan:</p>
              {Object.entries(products).map(([pid, p]) =>
                p.game_variants ? (
                  <div key={pid}>
                    <p className="font-black text-sm uppercase mb-1">{p.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const sortedGames = Object.entries(p.game_variants)
                          .map(([gid, g], idx) => ({ id: gid, ...g, sortOrder: g.order !== undefined ? g.order : idx }))
                          .sort((a,b) => a.sortOrder - b.sortOrder);
                        return sortedGames.map((g, gIndex) => {
                          const gid = g.id;
                          return (
                        <div key={gid} className="flex items-center gap-1 bg-yellow-100 border-2 border-neo-border px-3 py-1 shadow-[2px_2px_0_0_var(--color-neo-border)]">
                          <button onClick={() => handleReorder('GAME_VARIANT', pid, sortedGames, gIndex, 'UP')} className="text-xs hover:text-neo-green"><ChevronUp size={12} strokeWidth={3}/></button>
                          <button onClick={() => handleReorder('GAME_VARIANT', pid, sortedGames, gIndex, 'DOWN')} className="text-xs hover:text-neo-green"><ChevronDown size={12} strokeWidth={3}/></button>
                          <span className="font-black text-xs uppercase">{g.name}</span>
                          {g.note && <span className="text-xs opacity-50 ml-1">({g.note})</span>}
                          <button onClick={() => deleteGameVariant(pid, gid, g.name)} className="ml-2 bg-red-400 border-2 border-neo-border p-0.5">
                            <X size={10} strokeWidth={3}/>
                          </button>
                        </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </section>

        {/* Kelola Kategori & Tag */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-pink-300 border-4 border-neo-border p-2"><Tag size={24} strokeWidth={3}/></div>
            Kelola Kategori / Filter Tag
          </h2>
          <form onSubmit={addCategory} className="flex flex-col md:flex-row gap-3">
            <select className="neo-input font-bold md:w-1/3" value={newCategory.type} onChange={e => setNewCategory({...newCategory, type: e.target.value})}>
              <option value="DEVICE">Device / Platform</option>
              <option value="GAME">Game</option>
            </select>
            <input className="neo-input flex-1" placeholder="Nama Kategori (Misal: Android, Free Fire)"
              value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} required/>
            <button className="neo-button-primary w-fit px-6 flex items-center gap-2"><Plus size={20} strokeWidth={3}/> Tambah</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-4 border-neo-border pt-4">
            {/* List Device */}
            <div className="flex flex-col gap-2">
              <h3 className="font-black text-sm uppercase opacity-50 bg-gray-100 px-3 py-1 border-2 border-neo-border mb-1">Device & Platform</h3>
              {deviceTags.length === 0 && <p className="text-xs font-bold opacity-40 ml-1">Belum ada tags device</p>}
              {deviceTags.map((cat, i) => (
                <div key={cat.id} className="flex items-center gap-2 bg-neo-surface border-2 border-neo-border px-2 py-1.5 shadow-[2px_2px_0px_0px_var(--color-neo-border)] hover:bg-gray-50 transition-all">
                  <button type="button" onClick={() => handleReorder('CATEGORY', null, deviceTags, i, 'UP')} className="hover:text-neo-green"><ChevronUp size={16} strokeWidth={3}/></button>
                  <button type="button" onClick={() => handleReorder('CATEGORY', null, deviceTags, i, 'DOWN')} className="hover:text-neo-green"><ChevronDown size={16} strokeWidth={3}/></button>
                  <span className="flex-1 font-black text-xs uppercase truncate leading-none">{cat.name}</span>
                  <button type="button" onClick={() => deleteCategory(cat.id, cat.name)} className="bg-red-400 p-0.5 border-2 border-neo-border hover:bg-red-500 transition-all"><X size={12} strokeWidth={3}/></button>
                </div>
              ))}
            </div>

            {/* List Game */}
            <div className="flex flex-col gap-2">
              <h3 className="font-black text-sm uppercase opacity-50 bg-gray-100 px-3 py-1 border-2 border-neo-border mb-1">Games</h3>
              {gameTags.length === 0 && <p className="text-xs font-bold opacity-40 ml-1">Belum ada tags game</p>}
              {gameTags.map((cat, i) => (
                <div key={cat.id} className="flex items-center gap-2 bg-neo-surface border-2 border-neo-border px-2 py-1.5 shadow-[2px_2px_0px_0px_var(--color-neo-border)] hover:bg-gray-50 transition-all">
                  <button type="button" onClick={() => handleReorder('CATEGORY', null, gameTags, i, 'UP')} className="hover:text-neo-green"><ChevronUp size={16} strokeWidth={3}/></button>
                  <button type="button" onClick={() => handleReorder('CATEGORY', null, gameTags, i, 'DOWN')} className="hover:text-neo-green"><ChevronDown size={16} strokeWidth={3}/></button>
                  <span className="flex-1 font-black text-xs uppercase truncate leading-none">{cat.name}</span>
                  <button type="button" onClick={() => deleteCategory(cat.id, cat.name)} className="bg-red-400 p-0.5 border-2 border-neo-border hover:bg-red-500 transition-all"><X size={12} strokeWidth={3}/></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inject Stock */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-neo-green text-slate-900 border-4 border-neo-border p-2"><ListPlus size={24} strokeWidth={3}/></div>
            Inject Stock Key
          </h2>
          <form onSubmit={addBulkStock} className="flex flex-col gap-5">
            <select className="neo-input font-bold" value={bulkStock.subId} onChange={e => setBulkStock({...bulkStock, subId: e.target.value})} required>
              <option value="">-- Pilih Variasi --</option>
              {Object.entries(products).map(([pid, p]) =>
                p.sub_products && Object.entries(p.sub_products).map(([sid, s]) => (
                  <option key={sid} value={sid}>{p.name} - {s.label}</option>
                ))
              )}
            </select>
            <textarea className="neo-input font-mono min-h-[160px]"
              placeholder={"Paste baris key di sini...\nKEY-001\nKEY-002"}
              value={bulkStock.keys} onChange={e => setBulkStock({...bulkStock, keys: e.target.value})} required/>
            <button className="neo-button bg-neo-dark text-neo-surface border-white hover:text-neo-dark mt-2">
              <Zap size={20} fill="currentColor"/> INJECT SEKARANG
            </button>
          </form>
        </section>

        {/* Template Email */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-neo-green text-slate-900 border-4 border-neo-border p-2"><Mail size={24} strokeWidth={3}/></div>
            Template Email
          </h2>
          <div className="flex flex-col gap-5">
            <div className="bg-indigo-100 border-4 border-neo-border p-4 font-bold text-sm shadow-[4px_4px_0px_0px_var(--color-neo-border)]">
              ℹ️ Gunakan <span className="bg-neo-dark text-neo-surface px-2 py-1 mx-1">{"{stok_key}"}</span> untuk tempat lisensi.
            </div>
            <textarea className="neo-input min-h-[140px]" placeholder="Hi buyer, here is your key: {stok_key}"
              value={emailTemplate} onChange={e => setEmailTemplate(e.target.value)}/>
            <button onClick={saveEmailTemplate} className="neo-button-primary w-fit">SIMPAN TEMPLATE</button>
          </div>
        </section>

        {/* Pengumuman Website */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-sky-300 border-4 border-neo-border p-2"><Megaphone size={24} strokeWidth={3}/></div>
            Pengumuman Website
          </h2>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 font-black uppercase cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={announcement.enabled}
                onChange={e => setAnnouncement({...announcement, enabled: e.target.checked})}
                className="w-5 h-5 accent-neo-dark"
              />
              Aktifkan Popup Pengumuman di Halaman Utama
            </label>
            <textarea className="neo-input min-h-[100px]" placeholder="Isi pesan popup pengumuman..."
              value={announcement.message} onChange={e => setAnnouncement({...announcement, message: e.target.value})}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="neo-input" placeholder="Teks Tombol (Misal: Lanjut, Join Grup)"
                value={announcement.buttonText} onChange={e => setAnnouncement({...announcement, buttonText: e.target.value})}/>
              <input className="neo-input" placeholder="URL Tujuan Button (Opsional)"
                value={announcement.buttonUrl} onChange={e => setAnnouncement({...announcement, buttonUrl: e.target.value})}/>
            </div>
            <p className="text-xs font-bold opacity-50">Kosongkan URL Tujuan jika tombol hanya berfungsi untuk menutup popup.</p>
            <button onClick={saveAnnouncement} className="neo-button-primary w-fit mt-2">SIMPAN PENGUMUMAN</button>
          </div>
        </section>

        {/* ── KELOLA, EDIT & HAPUS ── */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-orange-400 border-4 border-neo-border p-2"><Pencil size={24} strokeWidth={3}/></div>
            Kelola, Edit & Hapus Data
          </h2>

          {Object.keys(products).length === 0 && <p className="font-bold opacity-50 text-center py-4">Belum ada produk.</p>}

          <div className="flex flex-col gap-4">
            {sortedProducts.map((productWrapper, pIndex) => {
              const pid = productWrapper.id;
              const product = productWrapper;
              return (
              <div key={pid} className="border-4 border-neo-border shadow-[4px_4px_0px_0px_var(--color-neo-border)]">

                {/* Header Produk */}
                <div className="flex items-center justify-between p-3 bg-neo-surface gap-2">
                  <button onClick={() => setExpandedProduct(expandedProduct === pid ? null : pid)}
                    className="flex items-center gap-2 font-black uppercase text-base flex-1 text-left min-w-0">
                    {expandedProduct === pid ? <ChevronUp size={18} strokeWidth={3}/> : <ChevronDown size={18} strokeWidth={3}/>}
                    <span className="truncate">{product.name}</span>
                    <span className="text-xs font-bold opacity-40 shrink-0 normal-case">({Object.keys(product.sub_products || {}).length} var)</span>
                  </button>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleReorder('PRODUCT', null, sortedProducts, pIndex, 'UP')} className="bg-neo-surface border-4 border-neo-border p-1.5 shadow-[3px_3px_0px_0px_var(--color-neo-border)] hover:-translate-y-1 transition-all"><ChevronUp size={15} strokeWidth={3}/></button>
                    <button onClick={() => handleReorder('PRODUCT', null, sortedProducts, pIndex, 'DOWN')} className="bg-neo-surface border-4 border-neo-border p-1.5 shadow-[3px_3px_0px_0px_var(--color-neo-border)] hover:-translate-y-1 transition-all"><ChevronDown size={15} strokeWidth={3}/></button>
                    <button
                      onClick={() => setEditingProduct({
                        id: pid,
                        data: { name: product.name, desc: product.desc || '', image: product.image || '', tags: product.tags || '', feature_media: product.feature_media || '' }
                      })}
                      className="bg-yellow-300 border-4 border-neo-border p-1.5 shadow-[3px_3px_0px_0px_var(--color-neo-border)] hover:-translate-y-1 transition-all">
                      <Pencil size={15} strokeWidth={3}/>
                    </button>
                    <button onClick={() => deleteProduct(pid, product.name)}
                      className="bg-red-400 border-4 border-neo-border p-1.5 shadow-[3px_3px_0px_0px_var(--color-neo-border)] hover:-translate-y-1 transition-all">
                      <Trash2 size={15} strokeWidth={3}/>
                    </button>
                  </div>
                </div>

                {/* Form Edit Produk */}
                {editingProduct?.id === pid && (
                  <div className="border-t-4 border-neo-border bg-yellow-50 p-4 flex flex-col gap-3">
                    <p className="font-black uppercase text-xs opacity-60 flex items-center gap-1"><Pencil size={11}/> Edit Produk</p>
                    <input className="neo-input text-sm" placeholder="Nama Produk" value={editingProduct.data.name}
                      onChange={e => setEditingProduct({...editingProduct, data: {...editingProduct.data, name: e.target.value}})}/>
                    <textarea className="neo-input text-sm min-h-[80px]" placeholder="Deskripsi" value={editingProduct.data.desc}
                      onChange={e => setEditingProduct({...editingProduct, data: {...editingProduct.data, desc: e.target.value}})}/>
                    <input className="neo-input text-sm" placeholder="URL Gambar" value={editingProduct.data.image}
                      onChange={e => setEditingProduct({...editingProduct, data: {...editingProduct.data, image: e.target.value}})}/>
                    <input className="neo-input text-sm" placeholder="URL Feature Media (gambar/YouTube)" value={editingProduct.data.feature_media}
                      onChange={e => setEditingProduct({...editingProduct, data: {...editingProduct.data, feature_media: e.target.value}})}/>
                    <input className="neo-input text-sm" placeholder="Tags (Android, iOS, PC...)" value={editingProduct.data.tags}
                      onChange={e => setEditingProduct({...editingProduct, data: {...editingProduct.data, tags: e.target.value}})}/>
                    <div className="flex gap-2">
                      <button onClick={saveEditProduct} className="neo-button-primary flex-1 text-sm py-2 flex items-center justify-center gap-1"><Save size={14}/> Simpan</button>
                      <button onClick={() => setEditingProduct(null)} className="neo-button flex-1 text-sm py-2 flex items-center justify-center gap-1"><X size={14}/> Batal</button>
                    </div>
                  </div>
                )}

                {/* Variasi */}
                {expandedProduct === pid && product.sub_products && (
                  <div className="border-t-4 border-neo-border bg-gray-50">
                    {(() => {
                      const sortedSubs = Object.entries(product.sub_products)
                        .map(([sid, sub], idx) => ({ id: sid, ...sub, sortOrder: sub.order !== undefined ? sub.order : idx }))
                        .sort((a,b) => a.sortOrder - b.sortOrder);
                      return sortedSubs.map((sub, sIndex) => {
                        const sid = sub.id;
                      const subStockKeys = stock[sid] ? Object.entries(stock[sid]) : [];
                      return (
                        <div key={sid} className="border-b-4 border-neo-border last:border-b-0">

                          {/* Header Variasi */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 gap-2">
                            <button onClick={() => setExpandedSub(expandedSub === sid ? null : sid)}
                              className="flex items-center gap-2 font-black text-sm flex-1 text-left min-w-0">
                              {expandedSub === sid ? <ChevronUp size={14} strokeWidth={3}/> : <ChevronDown size={14} strokeWidth={3}/>}
                              <span className="bg-neo-green text-slate-900 border-2 border-neo-border px-2 py-0.5 text-xs shrink-0">{sub.label}</span>
                              <span className="font-bold text-sm truncate">Rp {Number(sub.price).toLocaleString('id-ID')}</span>
                              <span className="text-xs opacity-40 shrink-0">— {subStockKeys.length} key</span>
                            </button>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => handleReorder('SUB_PRODUCT', pid, sortedSubs, sIndex, 'UP')} className="bg-neo-surface border-4 border-neo-border p-1 shadow-[2px_2px_0px_0px_var(--color-neo-border)] hover:-translate-y-0.5 transition-all"><ChevronUp size={13} strokeWidth={3}/></button>
                              <button onClick={() => handleReorder('SUB_PRODUCT', pid, sortedSubs, sIndex, 'DOWN')} className="bg-neo-surface border-4 border-neo-border p-1 shadow-[2px_2px_0px_0px_var(--color-neo-border)] hover:-translate-y-0.5 transition-all"><ChevronDown size={13} strokeWidth={3}/></button>
                              <button onClick={() => setEditingSub({ pid, sid, data: { label: sub.label, price: String(sub.price) }})}
                                className="bg-yellow-300 border-4 border-neo-border p-1 shadow-[2px_2px_0px_0px_var(--color-neo-border)] hover:-translate-y-0.5 transition-all">
                                <Pencil size={13} strokeWidth={3}/>
                              </button>
                              <button onClick={() => deleteSubProduct(pid, sid, sub.label)}
                                className="bg-orange-300 border-4 border-neo-border p-1 shadow-[2px_2px_0px_0px_var(--color-neo-border)] hover:-translate-y-0.5 transition-all">
                                <Trash2 size={13} strokeWidth={3}/>
                              </button>
                            </div>
                          </div>

                          {/* Form Edit Variasi */}
                          {editingSub?.sid === sid && (
                            <div className="bg-yellow-50 px-4 py-3 flex flex-col gap-2 border-b-2 border-neo-border">
                              <p className="font-black uppercase text-xs opacity-60 flex items-center gap-1"><Pencil size={10}/> Edit Variasi</p>
                              <input className="neo-input text-sm" placeholder="Label" value={editingSub.data.label}
                                onChange={e => setEditingSub({...editingSub, data: {...editingSub.data, label: e.target.value}})}/>
                              <input className="neo-input text-sm" type="number" placeholder="Harga" value={editingSub.data.price}
                                onChange={e => setEditingSub({...editingSub, data: {...editingSub.data, price: e.target.value}})}/>
                              <div className="flex gap-2">
                                <button onClick={saveEditSub} className="neo-button-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1"><Save size={12}/> Simpan</button>
                                <button onClick={() => setEditingSub(null)} className="neo-button flex-1 text-xs py-1.5 flex items-center justify-center gap-1"><X size={12}/> Batal</button>
                              </div>
                            </div>
                          )}

                          {/* Stock Keys */}
                          {expandedSub === sid && (
                            <div className="px-4 py-3 flex flex-col gap-2">
                              {subStockKeys.length === 0 ? (
                                <p className="font-bold opacity-40 text-xs text-center py-2">Stok kosong</p>
                              ) : (
                                subStockKeys.map(([keyId, keyVal]) => {
                                  const keyStr = keyVal.key || keyVal;
                                  const isEditingThis = editingKey?.keyId === keyId;
                                  return (
                                    <div key={keyId} className="flex items-center gap-2 bg-neo-surface border-2 border-neo-border px-3 py-2 shadow-[2px_2px_0px_0px_var(--color-neo-border)]">
                                      <Key size={12} strokeWidth={3} className="opacity-40 shrink-0"/>
                                      {isEditingThis ? (
                                        <>
                                          <input className="flex-1 font-mono text-xs border-2 border-neo-border px-2 py-1 outline-none min-w-0"
                                            value={editingKey.value}
                                            onChange={e => setEditingKey({...editingKey, value: e.target.value})}/>
                                          <button onClick={saveEditKey} className="bg-neo-green text-slate-900 border-2 border-neo-border p-1 hover:-translate-y-0.5 transition-all shrink-0">
                                            <Check size={12} strokeWidth={3}/>
                                          </button>
                                          <button onClick={() => setEditingKey(null)} className="bg-gray-200 border-2 border-neo-border p-1 shrink-0">
                                            <X size={12} strokeWidth={3}/>
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <span className="font-mono text-xs font-bold truncate flex-1 min-w-0">{keyStr}</span>
                                          <button onClick={() => setEditingKey({ subId: sid, keyId, value: keyStr })}
                                            className="bg-yellow-300 border-2 border-neo-border p-1 hover:-translate-y-0.5 transition-all shrink-0">
                                            <Pencil size={12} strokeWidth={3}/>
                                          </button>
                                          <button onClick={() => deleteStockKey(sid, keyId, keyStr)}
                                            className="bg-red-300 border-2 border-neo-border p-1 hover:-translate-y-0.5 transition-all shrink-0">
                                            <Trash2 size={12} strokeWidth={3}/>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </section>

        {/* Riwayat Transaksi */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-border pb-4">
            <div className="bg-purple-300 border-4 border-neo-border p-2"><Package size={24} strokeWidth={3}/></div>
            Riwayat Transaksi
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {['ALL', 'SUCCESS', 'PENDING'].map(filter => (
              <button
                key={filter}
                onClick={() => setTrxFilter(filter)}
                className={`border-4 border-neo-border px-4 py-2 font-black uppercase text-xs transition-all shadow-[3px_3px_0px_0px_var(--color-neo-border)]
                  ${trxFilter === filter ? 'bg-neo-dark text-neo-surface shadow-none translate-x-0.5 translate-y-0.5' : 'bg-neo-surface text-neo-dark hover:-translate-y-1'}`}
              >
                {filter === 'ALL' ? 'Semua' : filter}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
            {Object.keys(transactions).length === 0 && <p className="font-bold opacity-50 text-center py-4">Belum ada transaksi.</p>}
            {Object.entries(transactions)
              .filter(([tid, trx]) => trxFilter === 'ALL' || trx.status?.toLowerCase() === trxFilter.toLowerCase())
              .sort((a,b) => b[1].created_at - a[1].created_at).map(([tid, trx]) => (
              <div key={tid} className="border-4 border-neo-border bg-neo-surface shadow-[4px_4px_0_0_var(--color-neo-border)] p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black uppercase text-sm md:text-base">{trx.product_name}</span>
                    <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 border-2 border-neo-border ${trx.status === 'success' ? 'bg-green-300' : 'bg-yellow-300'} uppercase`}>
                      {trx.status}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 font-bold text-xs opacity-60">
                    <p>📧 {trx.buyer_email}</p>
                    {trx.buyer_whatsapp && <p>📱 {trx.buyer_whatsapp}</p>}
                  </div>
                  <p className="font-bold text-xs opacity-60">💰 Rp {trx.amount?.toLocaleString('id-ID')} | 🕒 {new Date(trx.created_at).toLocaleString('id-ID')}</p>
                  {trx.key_delivered && (
                    <p className="font-mono text-xs mt-1 bg-gray-100 border-2 border-neo-border px-2 py-1 select-all break-all text-neo-dark w-fit">
                      🔑 {trx.key_delivered}
                    </p>
                  )}
                </div>
                {trx.status === 'success' && trx.key_delivered && (
                  <button onClick={() => resendKey(tid)}
                    className="shrink-0 bg-neo-dark text-neo-surface border-4 border-neo-border px-4 py-2 font-black uppercase text-xs hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_#34d399] flex items-center justify-center gap-2 h-fit">
                    <Send size={14} strokeWidth={3}/> Resend Key
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default Admin;
