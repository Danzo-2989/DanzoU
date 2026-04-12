import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, CircleAlert, KeyRound } from 'lucide-react';

function Home() {
  const [products, setProducts] = useState({});
  const [stock, setStock] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    onValue(ref(db, 'products'), (snapshot) => {
      setProducts(snapshot.val() || {});
    });
    onValue(ref(db, 'stock'), (snapshot) => {
      setStock(snapshot.val() || {});
    });
  }, []);

  const getStockCount = (subId) => {
    if (!stock[subId]) return 0;
    return Object.keys(stock[subId]).length;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col gap-12 pt-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center neo-card bg-white animate-fade-in-up z-10 relative">
        <div className="flex items-center gap-4">
          <div className="bg-neo-green border-4 border-neo-dark p-3 shadow-neo">
            <KeyRound size={40} className="text-neo-dark" strokeWidth={2.5}/>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-neo-dark">
              {import.meta.env.VITE_STORE_NAME || 'KEYSTORE'}
            </h1>
            <p className="mt-1 font-bold uppercase tracking-widest text-xs opacity-70">
              {import.meta.env.VITE_STORE_SLOGAN || 'Premium License Market'}
            </p>
          </div>
        </div>

      </header>

      {/* Grid Produk */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(products).map(([id, product], index) => (
          <div 
            key={id} 
            className="neo-card flex flex-col gap-6 animate-fade-in-up bg-white"
          >
            {/* Area Gambar */}
            <div className="h-48 border-4 border-neo-dark bg-rose-100 flex items-center justify-center overflow-hidden relative group font-black uppercase text-4xl">
               {product.image ? (
                 <>
                   <div 
                     className="absolute inset-0 bg-cover bg-center blur-lg opacity-40 scale-110 grayscale" 
                     style={{ backgroundImage: `url(${product.image})` }}
                   ></div>
                   <img src={product.image} alt={product.name} className="relative z-10 w-full h-full object-contain p-2 drop-shadow-[4px_4px_0_rgba(30,41,59,1)]" />
                 </>
               ) : (
                 <span className="opacity-30">APP</span>
               )}
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black uppercase leading-tight line-clamp-1">{product.name}</h2>
              <p className="font-semibold text-sm opacity-75 line-clamp-2">{product.desc}</p>
            </div>

            <button
              onClick={() => navigate(`/product/${id}`)}
              className="mt-auto w-full text-lg py-3 border-4 border-neo-dark font-black uppercase flex items-center justify-center gap-2 transition-all bg-neo-green hover:-translate-y-1 shadow-[4px_4px_0px_0px_#1e293b] active:translate-y-1 active:shadow-none"
            >
              Lihat Detail
            </button>
          </div>
        ))}
      </div>

      {Object.keys(products).length === 0 && (
        <div className="neo-card text-center py-24 animate-fade-in-up flex flex-col items-center justify-center max-w-2xl mx-auto w-full bg-white text-neo-dark">
          <div className="bg-neo-green p-4 border-4 border-neo-dark shadow-neo mb-6">
            <CircleAlert size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black uppercase mb-2">Wow, Kosong!</h2>
          <p className="font-bold opacity-75">Toko ini masih belum punya produk buat dijual.</p>

        </div>
      )}
    </div>
  );
}

export default Home;
