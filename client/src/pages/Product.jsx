import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { ArrowLeft, Package, Check, ShoppingCart, Tag, Gamepad2 } from 'lucide-react';

function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [stock, setStock] = useState({});
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    onValue(ref(db, `products/${id}`), (snapshot) => {
      setProduct(snapshot.val());
    });
    onValue(ref(db, 'stock'), (snapshot) => {
      setStock(snapshot.val() || {});
    });
  }, [id]);

  // Auto-select first game variant when product loads
  useEffect(() => {
    if (product?.game_variants && Object.keys(product.game_variants).length > 0) {
      setSelectedGame(Object.keys(product.game_variants)[0]);
    }
  }, [product]);

  const getStockCount = (subId) => {
    if (!stock[subId]) return 0;
    return Object.keys(stock[subId]).length;
  };

  if (product === null) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-2xl text-neo-dark">Memuat...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-2xl text-neo-dark">Produk Tidak Ditemukan</div>;

  const tags = product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const gameVariants = product.game_variants ? Object.entries(product.game_variants) : [];
  const hasGames = gameVariants.length > 0;

  // Tag color map
  const tagColors = {
    android: 'bg-green-300',
    ios: 'bg-sky-300',
    pc: 'bg-purple-300',
    windows: 'bg-blue-300',
    mac: 'bg-gray-300',
    free: 'bg-yellow-300',
    premium: 'bg-orange-300',
    vip: 'bg-pink-300',
  };
  const getTagColor = (tag) => tagColors[tag.toLowerCase()] || 'bg-neo-green';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen pt-12 pb-24 flex flex-col gap-8">
      
      <button onClick={() => navigate('/')} className="neo-button w-fit animate-fade-in-up">
        <ArrowLeft size={20} className="mr-2" strokeWidth={3} /> Kembali
      </button>

      <div className="neo-card bg-white animate-fade-in-up p-0 overflow-hidden flex flex-col md:flex-row shadow-[8px_8px_0px_0px_#1e293b] border-4 border-neo-dark relative">
        
        {/* Gambar Kiri */}
        <div className="md:w-1/2 w-full min-h-[300px] border-b-4 md:border-b-0 md:border-r-4 border-neo-dark relative overflow-hidden bg-rose-100 flex items-center justify-center">
          {product.image ? (
            <>
              <div className="absolute inset-0 bg-cover bg-center blur-lg opacity-40 scale-110 grayscale" style={{ backgroundImage: `url(${product.image})` }}></div>
              <img src={product.image} alt={product.name} className="relative z-10 w-full h-full object-contain p-4 drop-shadow-[4px_4px_0_rgba(30,41,59,1)]" />
            </>
          ) : (
            <span className="font-black text-4xl opacity-30">APP</span>
          )}
        </div>

        {/* Konten Kanan */}
        <div className="md:w-1/2 w-full p-6 md:p-8 flex flex-col items-start bg-white z-20">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-neo-dark mb-3 drop-shadow-sm">
            {product.name}
          </h1>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className={`${getTagColor(tag)} border-2 border-neo-dark px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1e293b]`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="w-full h-1 bg-neo-dark mb-4"></div>

          <p className="font-semibold text-neo-dark opacity-80 whitespace-pre-wrap flex-grow mb-6 text-base">
            {product.desc}
          </p>

          {/* Game Variants Selector */}
          {hasGames && (
            <div className="w-full flex flex-col gap-3 mb-6">
              <h3 className="font-black uppercase text-sm border-2 border-neo-dark bg-yellow-300 w-fit px-3 py-1 shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-2">
                <Gamepad2 size={14} strokeWidth={3}/> Pilih Game:
              </h3>
              <div className="flex flex-wrap gap-2">
                {gameVariants.map(([gid, game]) => (
                  <button
                    key={gid}
                    onClick={() => setSelectedGame(gid)}
                    className={`border-4 border-neo-dark px-4 py-2 font-black uppercase text-sm transition-all duration-150
                      ${selectedGame === gid
                        ? 'bg-neo-dark text-white shadow-none translate-x-0.5 translate-y-0.5'
                        : 'bg-white hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_#1e293b] shadow-[3px_3px_0px_0px_#1e293b]'
                      }`}
                  >
                    {game.name}
                  </button>
                ))}
              </div>
              {selectedGame && product.game_variants[selectedGame]?.note && (
                <p className="text-xs font-bold opacity-60 border-l-4 border-neo-green pl-3">
                  {product.game_variants[selectedGame].note}
                </p>
              )}
            </div>
          )}

          {/* Variasi Harga */}
          <div className="w-full flex flex-col gap-3">
            <h3 className="font-black uppercase text-sm border-2 border-neo-dark bg-neo-green w-fit px-3 py-1 shadow-[2px_2px_0px_0px_#1e293b]">Pilih Variasi:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {product.sub_products ? Object.entries(product.sub_products).map(([sid, sub]) => {
                const count = getStockCount(sid);
                const isAvailable = count > 0;
                const isSelected = selectedSub === sid;

                return (
                  <button
                    key={sid}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSub(sid)}
                    className={`relative flex flex-col items-start p-3 border-4 border-neo-dark font-bold transition-all duration-200 text-left
                    ${!isAvailable ? 'bg-gray-200 cursor-not-allowed opacity-60 grayscale' : ''}
                    ${isAvailable && !isSelected ? 'bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#1e293b]' : ''}
                    ${isSelected ? 'bg-neo-dark text-white translate-x-1 outline outline-4 outline-neo-green outline-offset-[-4px]' : ''}
                    `}
                  >
                    <span className="truncate w-full text-lg border-b-2 border-current pb-1 mb-1">{sub.label}</span>
                    <span className={`text-sm ${isSelected ? 'text-neo-green' : 'text-neo-dark'} mt-1`}>Rp {sub.price.toLocaleString()}</span>
                    {isAvailable ? (
                      <span className={`text-[10px] mt-2 uppercase px-2 py-1 border-2 border-current font-black ${isSelected ? 'bg-white text-neo-dark' : 'bg-neo-green'}`}>Sisa {count}</span>
                    ) : (
                      <span className="text-[10px] mt-2 uppercase bg-neo-dark text-white px-2 py-1 border-2 border-neo-dark">Habis</span>
                    )}
                    {isSelected && <Check size={24} className="absolute right-2 top-3 text-neo-green" strokeWidth={4}/>}
                  </button>
                );
              }) : (
                <p className="text-xs italic opacity-50 font-bold">Belum ada variasi.</p>
              )}
            </div>
          </div>

          <div className="w-full mt-10">
            <button 
              onClick={() => { if (selectedSub) navigate(`/checkout/${selectedSub}`); }}
              disabled={!selectedSub}
              className={`w-full text-xl py-4 border-4 border-neo-dark font-black uppercase flex items-center justify-center gap-3 transition-all ${selectedSub ? 'bg-neo-green hover:-translate-y-1 shadow-[4px_4px_0px_0px_#1e293b] active:translate-y-1 active:shadow-none' : 'bg-gray-300 opacity-60 cursor-not-allowed'}`}
            >
              <ShoppingCart size={24} strokeWidth={3} />
              Lanjut Beli & Isi Email
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Product;
