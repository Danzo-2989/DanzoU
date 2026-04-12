import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { LayoutDashboard, Plus, Package, Mail, ListPlus, ArrowLeft, Zap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Admin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [emailTemplate, setEmailTemplate] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', desc: '', image: '' });
  const [newSub, setNewSub] = useState({ productId: '', label: '', price: '' });
  const [bulkStock, setBulkStock] = useState({ subId: '', keys: '' });
  const [auth, setAuth] = useState({ isAuthed: false, password: '' });

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    onValue(ref(db, 'products'), (snapshot) => {
      setProducts(snapshot.val() || {});
    });
    onValue(ref(db, 'settings/emailTemplate'), (snapshot) => {
      setEmailTemplate(snapshot.val() || '');
    });
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${backendUrl}/admin/products`, newProduct, { headers: { 'x-admin-password': auth.password }});
      setNewProduct({ name: '', desc: '', image: '' });
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
      
      <button 
        onClick={() => navigate('/')}
        className="neo-button mb-8 inline-flex animate-fade-in-up"
      >
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
              placeholder="Paste baris key di sini...&#10;KEY-001&#10;KEY-002&#10;KEY-003"
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

      </div>
    </div>
  );
}

export default Admin;
