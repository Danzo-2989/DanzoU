import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { LayoutDashboard, Plus, Package, Mail, ListPlus, ArrowLeft, Zap, Lock, Trash2, ChevronDown, ChevronUp, Key, Tag, Gamepad2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Admin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [stock, setStock] = useState({});
  const [emailTemplate, setEmailTemplate] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', desc: '', image: '', tags: '', feature_media: '' });
  const [newSub, setNewSub] = useState({ productId: '', label: '', price: '' });
  const [bulkStock, setBulkStock] = useState({ subId: '', keys: '' });
  const [auth, setAuth] = useState({ isAuthed: false, password: '' });
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedSub, setExpandedSub] = useState(null);

  // Game variant state
  const [gameProductId, setGameProductId] = useState('');
  const [newGame, setNewGame] = useState({ name: '', note: '' });

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    onValue(ref(db, 'products'), (snapshot) => { setProducts(snapshot.val() || {}); });
    onValue(ref(db, 'stock'), (snapshot) => { setStock(snapshot.val() || {}); });
    onValue(ref(db, 'settings/emailTemplate'), (snapshot) => { setEmailTemplate(snapshot.val() || ''); });
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${backendUrl}/admin/products`, newProduct, { headers: { 'x-admin-password': auth.password }});
      setNewProduct({ name: '', desc: '', image: '', tags: '', feature_media: '' });
      alert('Produk berhasil ditambahkan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal tambah produk'); }
  };

  const deleteProduct = async (productId, productName) => {
    if (!confirm(`Hapus produk "${productName}"? Semua variasi & stok akan ikut terhapus!`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/products/${productId}`, { headers: { 'x-admin-password': auth.password }});
      alert('Produk berhasil dihapus!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus produk'); }
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

  const deleteSubProduct = async (productId, subId, label) => {
    if (!confirm(`Hapus variasi "${label}"? Stok key di variasi ini akan ikut terhapus!`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/products/${productId}/sub_products/${subId}`, { headers: { 'x-admin-password': auth.password }});
      alert('Variasi berhasil dihapus!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus variasi'); }
  };

  const deleteStockKey = async (subId, keyId, keyValue) => {
    if (!confirm(`Hapus key "${keyValue}"?`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/stock/${subId}/${keyId}`, { headers: { 'x-admin-password': auth.password }});
      alert('Key berhasil dihapus!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus key'); }
  };

  const addGameVariant = async (e) => {
    e.preventDefault();
    if (!gameProductId || !newGame.name) return;
    try {
      await axios.post(`${backendUrl}/admin/products/${gameProductId}/game_variants`,
        newGame,
        { headers: { 'x-admin-password': auth.password }}
      );
      setNewGame({ name: '', note: '' });
      alert('Game variant berhasil ditambahkan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal tambah game variant'); }
  };

  const deleteGameVariant = async (productId, gameId, gameName) => {
    if (!confirm(`Hapus game "${gameName}"?`)) return;
    try {
      await axios.delete(`${backendUrl}/admin/products/${productId}/game_variants/${gameId}`, { headers: { 'x-admin-password': auth.password }});
      alert('Game variant berhasil dihapus!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal hapus game variant'); }
  };

  const addBulkStock = async (e) => {
    e.preventDefault();
    if (!bulkStock.subId || !bulkStock.keys) return;
    const keysArray = bulkStock.keys.split('\n').filter(k => k.trim() !== '');
    try {
      await axios.post(`${backendUrl}/admin/stock/${bulkStock.subId}`,
        { keys: keysArray },
        { headers: { 'x-admin-password': auth.password }}
      );
      setBulkStock({ subId: '', keys: '' });
      alert(`Sukses menambahkan ${keysArray.length} key!`);
    } catch (err) { alert(err.response?.data?.message || 'Gagal tambah stok'); }
  };

  const saveEmailTemplate = async () => {
    try {
      await axios.post(`${backendUrl}/admin/settings/emailTemplate`,
        { template: emailTemplate },
        { headers: { 'x-admin-password': auth.password }}
      );
      alert('Template email berhasil disimpan!');
    } catch (err) { alert(err.response?.data?.message || 'Gagal simpan template'); }
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setAuth({ ...auth, isAuthed: true });
  };

  const PRESET_TAGS = ['Android', 'iOS', 'PC', 'Windows', 'Mac', 'Free', 'Premium', 'VIP', 'No Root', 'Root'];

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
            <div className="bg-neo-green p-4 border-4 border-neo-dark"><Lock size={40} className="text-neo-dark" strokeWidth={3}/></div>
          </div>
          <h2 className="text-3xl font-black uppercase text-center text-neo-dark">Kunci Admin</h2>
          <input
            type="password" className="neo-input text-center font-bold tracking-widest text-lg" placeholder="Masukkan Password"
            value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} required
          />
          <button className="neo-button-primary mt-2">Masuk Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pt-12 pb-24">

      <button onClick={() => navigate('/')} className="neo-button mb-8 inline-flex animate-fade-in-up">
        <ArrowLeft size={20} strokeWidth={3} className="mr-2" /> Kembali
      </button>

      <div className="neo-card bg-neo-green mb-12 animate-fade-in-up flex items-center justify-center py-8">
        <h1 className="text-4xl md:text-6xl font-black uppercase flex items-center gap-4 text-center">
          <LayoutDashboard size={48} strokeWidth={3} className="hidden md:block text-neo-dark"/>
          Control <span className="bg-white px-4 border-4 border-neo-dark mx-2">Center</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Tambah Produk */}
        <section className="neo-card flex flex-col gap-6 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-dark pb-4">
            <div className="bg-neo-green border-4 border-neo-dark p-2"><Plus size={24} strokeWidth={3}/></div>
            Produk Baru
          </h2>
          <form onSubmit={addProduct} className="flex flex-col gap-5">
            <input
              className="neo-input" placeholder="Nama Aplikasi..."
              value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              required
            />
            <textarea
              className="neo-input min-h-[100px]" placeholder="Deskripsi Singkat..."
              value={newProduct.desc} onChange={e => setNewProduct({...newProduct, desc: e.target.value})}
              required
            />
            <input
              className="neo-input" placeholder="URL Gambar (Opsional)"
              value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})}
            />
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase text-sm flex items-center gap-2 bg-red-200 border-2 border-neo-dark w-fit px-3 py-1 shadow-[2px_2px_0_0_#1e293b]">
                🎬 URL Feature (Gambar/Video)
              </label>
              <input
                className="neo-input text-sm" placeholder="URL gambar atau YouTube (https://youtube.com/watch?v=...)"
                value={newProduct.feature_media} onChange={e => setNewProduct({...newProduct, feature_media: e.target.value})}
              />
              <p className="text-xs font-bold opacity-50">Tampil saat pembeli klik "SEE FEATURES" di halaman toko</p>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label className="font-black uppercase text-sm flex items-center gap-2 bg-pink-200 border-2 border-neo-dark w-fit px-3 py-1 shadow-[2px_2px_0_0_#1e293b]">
                <Tag size={14} strokeWidth={3}/> Tags Platform
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`border-2 border-neo-dark px-3 py-1 text-xs font-black uppercase transition-all
                      ${isTagActive(tag)
                        ? 'bg-neo-dark text-white shadow-none translate-x-0.5 translate-y-0.5'
                        : 'bg-white hover:bg-pink-100 shadow-[2px_2px_0_0_#1e293b]'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <input
                className="neo-input text-sm" placeholder="Atau ketik manual: Android, iOS, PC"
                value={newProduct.tags} onChange={e => setNewProduct({...newProduct, tags: e.target.value})}
              />
            </div>

            <button className="neo-button-primary mt-2">SIMPAN PRODUK</button>
          </form>
        </section>

        {/* Tambah Variasi */}
        <section className="neo-card flex flex-col gap-6 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-dark pb-4">
            <div className="bg-neo-green border-4 border-neo-dark p-2"><Package size={24} strokeWidth={3}/></div>
            Variasi (Bulan/Tahun)
          </h2>
          <form onSubmit={addSubProduct} className="flex flex-col gap-5">
            <select
              className="neo-input font-bold"
              value={newSub.productId} onChange={e => setNewSub({...newSub, productId: e.target.value})}
              required
            >
              <option value="">-- Pilih Produk --</option>
              {Object.entries(products).map(([id, p]) => (
                <option key={id} value={id}>{p.name}</option>
              ))}
            </select>
            <input
              className="neo-input" placeholder="Label (Misal: 1 Bulan)"
              value={newSub.label} onChange={e => setNewSub({...newSub, label: e.target.value})}
              required
            />
            <input
              className="neo-input" type="number" placeholder="Harga (Rp)"
              value={newSub.price} onChange={e => setNewSub({...newSub, price: e.target.value})}
              required
            />
            <button className="neo-button-primary mt-2">SIMPAN VARIASI</button>
          </form>
        </section>

        {/* Tambah Game Variant */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-dark pb-4">
            <div className="bg-yellow-300 border-4 border-neo-dark p-2"><Gamepad2 size={24} strokeWidth={3}/></div>
            Pilihan Game (Free Fire, MLBB, dll)
          </h2>
          <form onSubmit={addGameVariant} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <select
              className="neo-input font-bold"
              value={gameProductId} onChange={e => setGameProductId(e.target.value)}
              required
            >
              <option value="">-- Pilih Produk --</option>
              {Object.entries(products).map(([id, p]) => (
                <option key={id} value={id}>{p.name}</option>
              ))}
            </select>
            <input
              className="neo-input" placeholder="Nama Game (Misal: Free Fire)"
              value={newGame.name} onChange={e => setNewGame({...newGame, name: e.target.value})}
              required
            />
            <input
              className="neo-input" placeholder="Catatan (Opsional, misal: Server Asia)"
              value={newGame.note} onChange={e => setNewGame({...newGame, note: e.target.value})}
            />
            <button className="neo-button-primary md:col-span-3">TAMBAH GAME</button>
          </form>

          {/* Preview game variants per produk */}
          {Object.entries(products).some(([, p]) => p.game_variants) && (
            <div className="flex flex-col gap-4 border-t-4 border-neo-dark pt-4">
              <p className="font-black uppercase text-sm opacity-60">Game yang sudah ditambahkan:</p>
              {Object.entries(products).map(([pid, p]) =>
                p.game_variants ? (
                  <div key={pid} className="flex flex-col gap-2">
                    <p className="font-black text-sm uppercase">{p.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(p.game_variants).map(([gid, g]) => (
                        <div key={gid} className="flex items-center gap-1 bg-yellow-100 border-2 border-neo-dark px-3 py-1 shadow-[2px_2px_0_0_#1e293b]">
                          <span className="font-black text-xs uppercase">{g.name}</span>
                          {g.note && <span className="text-xs opacity-50 ml-1">({g.note})</span>}
                          <button
                            onClick={() => deleteGameVariant(pid, gid, g.name)}
                            className="ml-2 bg-red-400 border-2 border-neo-dark p-0.5 hover:bg-red-500 transition-all"
                          >
                            <X size={10} strokeWidth={3}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </section>

        {/* Bulk Stock */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-dark pb-4">
            <div className="bg-neo-green border-4 border-neo-dark p-2"><ListPlus size={24} strokeWidth={3}/></div>
            Inject Stock Key
          </h2>
          <form onSubmit={addBulkStock} className="flex flex-col gap-5">
            <select
              className="neo-input font-bold"
              value={bulkStock.subId} onChange={e => setBulkStock({...bulkStock, subId: e.target.value})}
              required
            >
              <option value="">-- Pilih Variasi --</option>
              {Object.entries(products).map(([pid, p]) => (
                p.sub_products && Object.entries(p.sub_products).map(([sid, s]) => (
                  <option key={sid} value={sid}>{p.name} - {s.label}</option>
                ))
              ))}
            </select>
            <textarea
              className="neo-input font-mono min-h-[160px]"
              placeholder={"Paste baris key di sini...\nKEY-001\nKEY-002\nKEY-003"}
              value={bulkStock.keys} onChange={e => setBulkStock({...bulkStock, keys: e.target.value})}
              required
            />
            <button className="neo-button bg-neo-dark text-white border-white hover:text-neo-dark mt-2">
              <Zap size={20} fill="currentColor"/> INJECT SEKARANG
            </button>
          </form>
        </section>

        {/* Setting Email */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-dark pb-4">
            <div className="bg-neo-green border-4 border-neo-dark p-2"><Mail size={24} strokeWidth={3}/></div>
            Template Email
          </h2>
          <div className="flex flex-col gap-5">
            <div className="bg-indigo-100 border-4 border-neo-dark p-4 font-bold text-sm shadow-[4px_4px_0px_0px_#1e293b]">
              ℹ️ Gunakan text <span className="bg-neo-dark text-white px-2 py-1 mx-1">{"{stok_key}"}</span> untuk tempat lisensi akan ditampilkan.
            </div>
            <textarea
              className="neo-input min-h-[140px]"
              placeholder="Hi buyer, here is your key: {stok_key}"
              value={emailTemplate} onChange={e => setEmailTemplate(e.target.value)}
            />
            <button onClick={saveEmailTemplate} className="neo-button-primary w-fit">SIMPAN TEMPLATE</button>
          </div>
        </section>

        {/* Kelola & Hapus */}
        <section className="neo-card flex flex-col gap-6 lg:col-span-2 animate-fade-in-up">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-neo-dark pb-4">
            <div className="bg-red-400 border-4 border-neo-dark p-2"><Trash2 size={24} strokeWidth={3}/></div>
            Kelola & Hapus Data
          </h2>

          {Object.keys(products).length === 0 && (
            <p className="font-bold opacity-50 text-center py-4">Belum ada produk.</p>
          )}

          <div className="flex flex-col gap-4">
            {Object.entries(products).map(([pid, product]) => (
              <div key={pid} className="border-4 border-neo-dark shadow-[4px_4px_0px_0px_#1e293b]">
                <div className="flex items-center justify-between p-4 bg-white">
                  <button
                    onClick={() => setExpandedProduct(expandedProduct === pid ? null : pid)}
                    className="flex items-center gap-3 font-black uppercase text-lg flex-1 text-left"
                  >
                    {expandedProduct === pid ? <ChevronUp size={20} strokeWidth={3}/> : <ChevronDown size={20} strokeWidth={3}/>}
                    {product.name}
                    <span className="text-sm font-bold opacity-50 normal-case">
                      ({Object.keys(product.sub_products || {}).length} variasi)
                    </span>
                    {/* Tag preview */}
                    {product.tags && product.tags.split(',').slice(0, 2).map((t, i) => (
                      <span key={i} className="bg-pink-200 border-2 border-neo-dark px-2 py-0.5 text-xs font-black uppercase">{t.trim()}</span>
                    ))}
                  </button>
                  <button
                    onClick={() => deleteProduct(pid, product.name)}
                    className="bg-red-400 border-4 border-neo-dark p-2 shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#1e293b] transition-all ml-3"
                  >
                    <Trash2 size={18} strokeWidth={3}/>
                  </button>
                </div>

                {expandedProduct === pid && product.sub_products && (
                  <div className="border-t-4 border-neo-dark bg-gray-50">
                    {Object.entries(product.sub_products).map(([sid, sub]) => {
                      const subStockKeys = stock[sid] ? Object.entries(stock[sid]) : [];
                      return (
                        <div key={sid} className="border-b-4 border-neo-dark last:border-b-0">
                          <div className="flex items-center justify-between px-6 py-3 bg-gray-100">
                            <button
                              onClick={() => setExpandedSub(expandedSub === sid ? null : sid)}
                              className="flex items-center gap-2 font-black text-base flex-1 text-left"
                            >
                              {expandedSub === sid ? <ChevronUp size={16} strokeWidth={3}/> : <ChevronDown size={16} strokeWidth={3}/>}
                              <span className="bg-neo-green border-2 border-neo-dark px-2 py-0.5 text-sm">{sub.label}</span>
                              <span className="font-bold">Rp {Number(sub.price).toLocaleString('id-ID')}</span>
                              <span className="text-sm opacity-50">— {subStockKeys.length} key</span>
                            </button>
                            <button
                              onClick={() => deleteSubProduct(pid, sid, sub.label)}
                              className="bg-orange-300 border-4 border-neo-dark p-1.5 shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-1 transition-all ml-3"
                            >
                              <Trash2 size={16} strokeWidth={3}/>
                            </button>
                          </div>

                          {expandedSub === sid && (
                            <div className="px-6 py-4 flex flex-col gap-2">
                              {subStockKeys.length === 0 ? (
                                <p className="font-bold opacity-40 text-sm text-center py-2">Stok kosong</p>
                              ) : (
                                subStockKeys.map(([keyId, keyVal]) => (
                                  <div key={keyId} className="flex items-center justify-between bg-white border-2 border-neo-dark px-4 py-2 shadow-[2px_2px_0px_0px_#1e293b]">
                                    <div className="flex items-center gap-2">
                                      <Key size={14} strokeWidth={3} className="opacity-40 shrink-0"/>
                                      <span className="font-mono text-sm font-bold truncate max-w-xs">{keyVal.key || keyVal}</span>
                                    </div>
                                    <button
                                      onClick={() => deleteStockKey(sid, keyId, keyVal.key || keyVal)}
                                      className="bg-red-300 border-2 border-neo-dark p-1 hover:-translate-y-0.5 transition-all ml-3 shrink-0"
                                    >
                                      <Trash2 size={14} strokeWidth={3}/>
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
