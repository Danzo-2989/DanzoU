import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, CircleAlert, KeyRound, DollarSign, Lock, Clock } from 'lucide-react';

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

  const waNumber = import.meta.env.VITE_WA_NUMBER || '6281234567890';
  const tgUsername = import.meta.env.VITE_TG_USERNAME || 'username';

  const features = [
    {
      icon: <DollarSign size={32} strokeWidth={2.5} />,
      color: 'bg-neo-green',
      title: 'Harga Termurah',
      desc: 'Harga murah & kompetitif',
    },
    {
      icon: <Zap size={32} strokeWidth={2.5} />,
      color: 'bg-yellow-300',
      title: 'Proses Kilat',
      desc: 'Pengerjaan cepat',
    },
    {
      icon: <Lock size={32} strokeWidth={2.5} />,
      color: 'bg-sky-300',
      title: 'Aman',
      desc: 'Trusted seller & aman',
    },
    {
      icon: <Clock size={32} strokeWidth={2.5} />,
      color: 'bg-purple-300',
      title: 'Open 24/7',
      desc: 'Siap melayani kapan saja',
    },
  ];

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

      {/* ===== SECTION: KEUNGGULAN ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
        {features.map((f, i) => (
          <div
            key={i}
            className="neo-card bg-white flex flex-col items-center text-center gap-3 py-6"
          >
            <div className={`${f.color} border-4 border-neo-dark p-3 shadow-neo`}>
              {f.icon}
            </div>
            <h3 className="font-black uppercase text-base leading-tight">{f.title}</h3>
            <p className="text-sm font-semibold opacity-70">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ===== SECTION: KONTAK ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="neo-card bg-green-400 flex items-center justify-center gap-3 py-5 font-black uppercase text-xl tracking-wider hover:-translate-y-2 hover:shadow-neo-heavy transition-all duration-200 text-neo-dark"
        >
          {/* WhatsApp Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WHATSAPP
        </a>
        <a
          href={`https://t.me/${tgUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="neo-card bg-sky-400 flex items-center justify-center gap-3 py-5 font-black uppercase text-xl tracking-wider hover:-translate-y-2 hover:shadow-neo-heavy transition-all duration-200 text-neo-dark"
        >
          {/* Telegram Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          TELEGRAM
        </a>
      </div>

      {/* ===== SECTION: METODE PEMBAYARAN ===== */}
      <div className="neo-card bg-white animate-fade-in-up">
        <h2 className="text-center font-black uppercase tracking-[0.3em] text-sm opacity-60 mb-6">
          METODE PEMBAYARAN RESMI
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-4">
          {/* QRIS */}
          <div className="border-4 border-neo-dark px-5 py-3 shadow-[4px_4px_0px_0px_#1e293b] bg-white font-black text-lg tracking-wider flex items-center gap-2">
            <span className="text-neo-dark">▣</span> QRIS
          </div>
          {/* DANA */}
          <div className="border-4 border-neo-dark px-5 py-3 shadow-[4px_4px_0px_0px_#1e293b] bg-[#108EE9] text-white font-black text-lg tracking-wider">
            DANA
          </div>
          {/* GoPay */}
          <div className="border-4 border-neo-dark px-5 py-3 shadow-[4px_4px_0px_0px_#1e293b] bg-[#00AED6] text-white font-black text-lg tracking-wider">
            GoPay
          </div>
          {/* OVO */}
          <div className="border-4 border-neo-dark px-5 py-3 shadow-[4px_4px_0px_0px_#1e293b] bg-[#4C3494] text-white font-black text-lg tracking-wider">
            OVO
          </div>
          {/* ShopeePay */}
          <div className="border-4 border-neo-dark px-5 py-3 shadow-[4px_4px_0px_0px_#1e293b] bg-[#EE4D2D] text-white font-black text-lg tracking-wider">
            ShopeePay
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center font-bold text-xs uppercase tracking-widest opacity-40 pb-8">
        © {new Date().getFullYear()} {import.meta.env.VITE_STORE_NAME || 'KEYSTORE'} — All Rights Reserved
      </footer>

    </div>
  );
}

export default Home;
