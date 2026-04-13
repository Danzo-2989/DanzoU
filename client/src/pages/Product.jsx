import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { ArrowLeft, Check, ShoppingCart, Gamepad2 } from 'lucide-react';

function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [stock, setStock] = useState({});
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    onValue(ref(db, `products/${id}`), (snapshot) => { setProduct(snapshot.val()); });
    onValue(ref(db, 'stock'), (snapshot) => { setStock(snapshot.val() || {}); });
  }, [id]);

  useEffect(() => {
    if (product?.game_variants && Object.keys(product.game_variants).length > 0) {
      setSelectedGame(Object.keys(product.game_variants)[0]);
    }
  }, [product]);

  const getStockCount = (subId) => {
    if (!stock[subId]) return 0;
    return Object.keys(stock[subId]).length;
  };

  if (product === null) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-xl">Memuat...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-xl">Produk Tidak Ditemukan</div>;

  const tags = product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const gameVariants = product.game_variants ? Object.entries(product.game_variants) : [];

  const tagColors = {
    android: 'bg-green-300', ios: 'bg-sky-300', pc: 'bg-purple-300',
    windows: 'bg-blue-300', mac: 'bg-gray-300', free: 'bg-yellow-300',
    premium: 'bg-orange-300', vip: 'bg-pink-300',
  };
  const getTagColor = (tag) => tagColors[tag.toLowerCase()] || 'bg-neo-green text-slate-900';

  return (
    <div className="px-3 py-4 md:p-8 max-w-4xl mx-auto min-h-screen pb-16 flex flex-col gap-4 md:gap-8">

      <button onClick={() => navigate('/')} className="neo-button w-fit animate-fade-in-up text-sm py-2 px-3 md:text-base md:py-3 md:px-6">
        <ArrowLeft size={16} className="mr-1" strokeWidth={3}/> Kembali
      </button>

      <div className="neo-card bg-neo-surface animate-fade-in-up p-0 overflow-hidden flex flex-col md:flex-row border-4 border-neo-border shadow-[6px_6px_0px_0px_var(--color-neo-border)] md:shadow-[8px_8px_0px_0px_var(--color-neo-border)]">

        {/* Gambar */}
        <div className="md:w-2/5 w-full h-48 md:h-auto border-b-4 md:border-b-0 md:border-r-4 border-neo-border relative overflow-hidden bg-rose-100 flex items-center justify-center">
          {product.image ? (
            <>
              <div className="absolute inset-0 bg-cover bg-center blur-lg opacity-40 scale-110 grayscale" style={{ backgroundImage: `url(${product.image})` }}/>
              <img src={product.image} alt={product.name} className="relative z-10 w-full h-full object-contain p-3 drop-shadow-[4px_4px_0_rgba(30,41,59,1)]"/>
            </>
          ) : (
            <span className="font-black text-4xl opacity-30">APP</span>
          )}
        </div>

        {/* Konten */}
        <div className="flex-1 p-4 md:p-8 flex flex-col gap-3 md:gap-4">

          {/* Nama + Tags */}
          <div>
            <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter leading-none text-neo-dark mb-2">
              {product.name}
            </h1>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span key={i} className={`${getTagColor(tag)} border-2 border-neo-border px-2 py-0.5 text-[10px] md:text-xs font-black uppercase shadow-[2px_2px_0px_0px_var(--color-neo-border)]`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-1 bg-neo-dark"/>

          <p className="font-semibold text-neo-dark opacity-80 text-xs md:text-base whitespace-pre-wrap line-clamp-3 md:line-clamp-none">
            {product.desc}
          </p>

          {/* Pilih Game */}
          {gameVariants.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="font-black uppercase text-xs border-2 border-neo-border bg-yellow-300 w-fit px-2 py-1 shadow-[2px_2px_0px_0px_var(--color-neo-border)] flex items-center gap-1">
                <Gamepad2 size={12} strokeWidth={3}/> Pilih Game:
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {gameVariants.map(([gid, game]) => (
                  <button key={gid} onClick={() => setSelectedGame(gid)}
                    className={`border-4 border-neo-border px-3 py-1.5 font-black uppercase text-xs transition-all
                      ${selectedGame === gid ? 'bg-neo-dark text-neo-surface shadow-none' : 'bg-neo-surface hover:-translate-y-0.5 shadow-[3px_3px_0px_0px_var(--color-neo-border)]'}`}>
                    {game.name}
                  </button>
                ))}
              </div>
              {selectedGame && product.game_variants[selectedGame]?.note && (
                <p className="text-[10px] font-bold opacity-60 border-l-4 border-neo-green pl-2">
                  {product.game_variants[selectedGame].note}
                </p>
              )}
            </div>
          )}

          {/* Pilih Variasi */}
          <div className="flex flex-col gap-2">
            <h3 className="font-black uppercase text-xs border-2 border-neo-border bg-neo-green text-slate-900 w-fit px-2 py-1 shadow-[2px_2px_0px_0px_var(--color-neo-border)]">
              Pilih Variasi:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
              {product.sub_products ? Object.entries(product.sub_products).map(([sid, sub]) => {
                const count = getStockCount(sid);
                const isAvailable = count > 0;
                const isSelected = selectedSub === sid;
                return (
                  <button key={sid} disabled={!isAvailable} onClick={() => setSelectedSub(sid)}
                    className={`relative flex flex-col items-start p-2 md:p-3 border-4 border-neo-border font-bold transition-all text-left
                      ${!isAvailable ? 'bg-gray-200 cursor-not-allowed opacity-60 grayscale' : ''}
                      ${isAvailable && !isSelected ? 'bg-neo-surface hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--color-neo-border)]' : ''}
                      ${isSelected ? 'bg-neo-dark text-neo-surface outline outline-4 outline-neo-green outline-offset-[-4px]' : ''}`}>
                    <span className="w-full text-xs md:text-base font-black border-b-2 border-current pb-1 mb-1 truncate">{sub.label}</span>
                    <span className={`text-xs ${isSelected ? 'text-neo-green' : ''}`}>Rp {sub.price.toLocaleString()}</span>
                    {isAvailable
                      ? <span className={`text-[9px] mt-1 uppercase px-1.5 py-0.5 border-2 border-current font-black ${isSelected ? 'bg-neo-surface text-neo-dark' : 'bg-neo-green text-slate-900'}`}>Sisa {count}</span>
                      : <span className="text-[9px] mt-1 uppercase bg-neo-dark text-neo-surface px-1.5 py-0.5 border-2 border-neo-border font-black">Habis</span>
                    }
                    {isSelected && <Check size={16} className="absolute right-1.5 top-2 text-neo-green" strokeWidth={4}/>}
                  </button>
                );
              }) : <p className="text-xs italic opacity-50 font-bold col-span-2">Belum ada variasi.</p>}
            </div>
          </div>

          {/* Tombol Beli */}
          <button
            onClick={() => { if (selectedSub) navigate(`/checkout/${selectedSub}`); }}
            disabled={!selectedSub}
            className={`w-full text-sm md:text-xl py-3 md:py-4 border-4 border-neo-border font-black uppercase flex items-center justify-center gap-2 transition-all mt-auto
              ${selectedSub ? 'bg-neo-green text-slate-900 hover:-translate-y-1 shadow-[4px_4px_0px_0px_var(--color-neo-border)] active:translate-y-1 active:shadow-none' : 'bg-gray-300 opacity-60 cursor-not-allowed'}`}
          >
            <ShoppingCart size={18} strokeWidth={3}/>
            Lanjut Beli & Isi Email
          </button>

        </div>
      </div>
    </div>
  );
}

export default Product;
