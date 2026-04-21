import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { Zap, CircleAlert, KeyRound, DollarSign, Lock, Clock, X, Play, Search, Moon, Sun, Smartphone, Monitor, Gamepad2 } from 'lucide-react';

function Home() {
  const [products, setProducts] = useState({});
  const [stock, setStock] = useState({});
  const [activeDevice, setActiveDevice] = useState('ALL');
  const [activeGame, setActiveGame] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewProduct, setPreviewProduct] = useState(null); // { name, mediaUrl, mediaType }
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    onValue(ref(db, 'products'), (snapshot) => { setProducts(snapshot.val() || {}); });
    onValue(ref(db, 'stock'), (snapshot) => { setStock(snapshot.val() || {}); });
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const uniqueTags = Array.from(
    new Set(Object.values(products).flatMap(p =>
      p.tags ? p.tags.split(',').map(t => t.trim().toUpperCase()).filter(Boolean) : []
    ))
  );

  const KNOWN_DEVICES = ['ANDROID', 'IOS', 'PC', 'WINDOWS', 'MAC'];
  const deviceFilters = uniqueTags.filter(tag => KNOWN_DEVICES.includes(tag));
  const gameFilters = uniqueTags.filter(tag => !KNOWN_DEVICES.includes(tag));

  const filteredProducts = Object.entries(products)
    .filter(([, product]) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (product.desc && product.desc.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      const pTags = product.tags ? product.tags.split(',').map(t => t.trim().toUpperCase()) : [];
      
      const matchDevice = activeDevice === 'ALL' || pTags.includes(activeDevice);
      const matchGame = activeGame === 'ALL' || pTags.includes(activeGame);
      
      return matchDevice && matchGame;
    })
    .map(([id, product], idx) => ({ id, ...product, sortOrder: product.order !== undefined ? product.order : idx }))
    .sort((a,b) => a.sortOrder - b.sortOrder)
    .map(product => [product.id, product]);

  const tagColorMap = {
    ANDROID: 'bg-green-400', IOS: 'bg-sky-400', PC: 'bg-purple-400',
    WINDOWS: 'bg-blue-400', MAC: 'bg-gray-400', FREE: 'bg-yellow-300',
    PREMIUM: 'bg-orange-400', VIP: 'bg-pink-400', FREEFIRE: 'bg-orange-500',
    MLBB: 'bg-blue-500', RESELLER: 'bg-violet-400',
  };
  const getBadgeColor = (tag) => tagColorMap[tag.toUpperCase()] || 'bg-neo-green text-slate-900';

  // Deteksi apakah URL adalah YouTube
  const getYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || url.match(/\.(mp4|webm|ogg)$/i);
  };

  const openPreview = (product) => {
    const mediaUrl = product.feature_media || product.image;
    const mediaType = isVideoUrl(mediaUrl) ? 'video' : 'image';
    setPreviewProduct({ name: product.name, mediaUrl, mediaType });
  };

  const features = [
    { icon: <DollarSign size={22} strokeWidth={2.5} />, color: 'bg-neo-green text-slate-900',  title: 'Harga Termurah', desc: 'Harga murah & kompetitif' },
    { icon: <Zap        size={22} strokeWidth={2.5} />, color: 'bg-yellow-300', title: 'Proses Kilat',   desc: 'Pengerjaan cepat' },
    { icon: <Lock       size={22} strokeWidth={2.5} />, color: 'bg-sky-300',    title: 'Aman',           desc: 'Trusted seller & aman' },
    { icon: <Clock      size={22} strokeWidth={2.5} />, color: 'bg-purple-300', title: 'Open 24/7',      desc: 'Siap melayani kapan saja' },
  ];

  return (
    <div className="px-3 py-4 md:px-8 md:py-8 max-w-7xl mx-auto min-h-screen flex flex-col gap-6 md:gap-12">

      {/* ── HEADER ── */}
      <header className="flex items-center gap-3 neo-card bg-neo-surface animate-fade-in-up py-3 px-4 md:py-6 md:px-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-neo-green text-slate-900 border-4 border-neo-border p-2 md:p-3 shadow-neo shrink-0">
            <KeyRound size={24} className="text-slate-900" strokeWidth={2.5}/>
          </div>
          <div>
            <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter leading-none text-neo-dark">
              {import.meta.env.VITE_STORE_NAME || 'KEYSTORE'}
            </h1>
            <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs opacity-70 text-neo-dark">
              {import.meta.env.VITE_STORE_SLOGAN || 'Premium License Market'}
            </p>
          </div>
        </div>
        <button onClick={toggleTheme} title="Toggle Dark/Light Mode"
          className="bg-neo-surface border-4 border-neo-border p-2 md:p-3 shadow-neo hover:-translate-y-1 hover:shadow-neo-heavy transition-all cursor-pointer">
          {isDark ? <Sun size={24} className="text-neo-dark" strokeWidth={3}/> : <Moon size={24} className="text-neo-dark" strokeWidth={3}/>}
        </button>
      </header>

      {/* ── PENCARIAN & FILTER KATEGORI ── */}
      <div className="flex flex-col gap-3 animate-fade-in-up">
        {/* Kolom Pencarian */}
        <div className="flex bg-neo-surface border-4 border-neo-border shadow-[3px_3px_0px_0px_var(--color-neo-border)] flex-1 focus-within:-translate-y-1 focus-within:shadow-[4px_4px_0_0_var(--color-neo-border)] transition-all h-10 md:h-12">
          <div className="bg-neo-green text-slate-900 px-3 border-r-4 border-neo-border flex items-center justify-center ">
            <Search size={18} strokeWidth={3}/>
          </div>
          <input type="text" placeholder="CARI PRODUK..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 font-bold uppercase text-neo-dark outline-none bg-transparent placeholder:opacity-50 text-xs md:text-sm"/>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="px-3 flex items-center justify-center text-neo-dark hover:bg-red-200 border-l-4 border-neo-border">
              <X size={16} strokeWidth={3}/>
            </button>
          )}
        </div>

        {/* Filter Device & Kategori (Games) */}
        <div className="flex flex-col gap-2 w-full">
          {/* Device Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 items-center">
            <button onClick={() => setActiveDevice('ALL')}
              className={`flex items-center gap-1 shrink-0 border-4 border-neo-border px-3 py-1.5 md:px-5 md:py-1.5 font-black uppercase text-xs md:text-sm tracking-wider transition-all duration-150 h-10 md:h-12
                ${activeDevice === 'ALL' ? 'bg-neo-dark text-neo-surface shadow-none translate-x-0.5 translate-y-0.5' : 'bg-neo-surface hover:-translate-y-1 shadow-[3px_3px_0px_0px_var(--color-neo-border)] hover:shadow-[4px_4px_0px_0px_var(--color-neo-border)]'}`}>
              SEMUA DEVICE
            </button>
            {deviceFilters.map((cat) => {
              const isAndroidIOS = cat === 'ANDROID' || cat === 'IOS';
              return (
              <button key={cat} onClick={() => setActiveDevice(cat)}
                className={`flex items-center gap-1 shrink-0 border-4 border-neo-border px-3 py-1.5 md:px-5 md:py-1.5 font-black uppercase text-xs md:text-sm tracking-wider transition-all duration-150 h-10 md:h-12
                  ${activeDevice === cat ? 'bg-neo-dark text-neo-surface shadow-none translate-x-0.5 translate-y-0.5' : 'bg-neo-surface hover:-translate-y-1 shadow-[3px_3px_0px_0px_var(--color-neo-border)] hover:shadow-[4px_4px_0px_0px_var(--color-neo-border)]'}`}>
                {isAndroidIOS ? <Smartphone size={16} className="text-neo-green" strokeWidth={3}/> : <Monitor className="text-neo-green" size={16} strokeWidth={3}/>} {cat}
              </button>
              );
            })}
          </div>
          
          {/* Game Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 items-center">
            <button onClick={() => setActiveGame('ALL')}
              className={`flex items-center gap-1 shrink-0 border-4 border-neo-border px-3 py-1.5 md:px-5 md:py-1.5 font-black uppercase text-xs md:text-sm tracking-wider transition-all duration-150 h-10 md:h-12
                ${activeGame === 'ALL' ? 'bg-neo-dark text-neo-surface shadow-none translate-x-0.5 translate-y-0.5' : 'bg-neo-surface hover:-translate-y-1 shadow-[3px_3px_0px_0px_var(--color-neo-border)] hover:shadow-[4px_4px_0px_0px_var(--color-neo-border)]'}`}>
              SEMUA GAME
            </button>
            {gameFilters.map((cat) => (
              <button key={cat} onClick={() => setActiveGame(cat)}
                className={`flex items-center gap-1 shrink-0 border-4 border-neo-border px-3 py-1.5 md:px-5 md:py-1.5 font-black uppercase text-xs md:text-sm tracking-wider transition-all duration-150 h-10 md:h-12
                  ${activeGame === cat ? 'bg-neo-dark text-neo-surface shadow-none translate-x-0.5 translate-y-0.5' : 'bg-neo-surface hover:-translate-y-1 shadow-[3px_3px_0px_0px_var(--color-neo-border)] hover:shadow-[4px_4px_0px_0px_var(--color-neo-border)]'}`}>
                <Gamepad2 size={16} className="text-yellow-300" strokeWidth={3}/> {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRID PRODUK ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
        {filteredProducts.map(([id, product]) => {
          const firstTag = product.tags ? product.tags.split(',')[0].trim() : null;
          const hasMedia = !!(product.feature_media || product.image);
          return (
            <div key={id} className="neo-card flex flex-col gap-2 md:gap-4 animate-fade-in-up bg-neo-surface p-3 md:p-6">
              {/* Gambar */}
              <div className="h-28 md:h-48 border-4 border-neo-border bg-rose-100 flex items-center justify-center overflow-hidden relative font-black uppercase text-2xl">
                {product.image ? (
                  <>
                    <div className="absolute inset-0 bg-cover bg-center blur-lg opacity-40 scale-110 grayscale"
                      style={{ backgroundImage: `url(${product.image})` }}/>
                    <img src={product.image} alt={product.name}
                      className="relative z-10 w-full h-full object-contain p-1 drop-shadow-[4px_4px_0_rgba(30,41,59,1)]"/>
                  </>
                ) : (
                  <span className="opacity-30 text-2xl">APP</span>
                )}
                {firstTag && (
                  <span className={`absolute top-0 left-0 z-20 ${getBadgeColor(firstTag)} border-r-4 border-b-4 border-neo-border px-2 py-0.5 text-[9px] md:text-xs font-black uppercase text-slate-900`}>
                    {firstTag}
                  </span>
                )}
                {/* Video indicator */}
                {product.feature_media && isVideoUrl(product.feature_media) && (
                  <div className="absolute top-0 right-0 z-20 bg-red-500 border-l-4 border-b-4 border-neo-border p-1">
                    <Play size={10} fill="white" className="text-neo-surface"/>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1">
                <h2 className="text-sm md:text-2xl font-black uppercase leading-tight line-clamp-1">{product.name}</h2>
                <p className="font-semibold text-[11px] md:text-sm opacity-75 line-clamp-2">{product.desc}</p>
                {product.tags && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags.split(',').map((t, i) => (
                      <span key={i} className={`${getBadgeColor(t.trim())} text-slate-900 border-2 border-neo-border px-1.5 py-0.5 text-[8px] md:text-[10px] font-black uppercase`}>
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tombol 2 baris */}
              <div className="mt-auto flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/product/${id}`)}
                  className="w-full text-xs md:text-base py-2 md:py-3 border-4 border-neo-border font-black uppercase flex items-center justify-center gap-1 transition-all bg-neo-green text-slate-900 hover:-translate-y-1 shadow-[4px_4px_0px_0px_var(--color-neo-border)] active:translate-y-1 active:shadow-none"
                >
                  🛒 BELI
                </button>
                {hasMedia && (
                  <button
                    onClick={() => openPreview(product)}
                    className="w-full text-xs md:text-sm py-1.5 md:py-2 border-4 border-neo-border font-black uppercase flex items-center justify-center gap-1 transition-all bg-neo-dark text-neo-surface hover:-translate-y-1 shadow-[4px_4px_0px_0px_var(--color-neo-border)] active:translate-y-1 active:shadow-none"
                  >
                    <Play size={12} fill="currentColor"/> SEE FEATURES
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="neo-card text-center py-12 animate-fade-in-up flex flex-col items-center justify-center max-w-2xl mx-auto w-full bg-neo-surface text-neo-dark">
          <div className="bg-neo-green text-slate-900 p-3 border-4 border-neo-border shadow-neo mb-4">
            <CircleAlert size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black uppercase mb-2">
            {(activeDevice === 'ALL' && activeGame === 'ALL') ? 'Wow, Kosong!' : 'Tidak ditemukan.'}
          </h2>
          <p className="font-bold opacity-75 text-sm">
            {(activeDevice === 'ALL' && activeGame === 'ALL') ? 'Belum ada produk.' : 'Coba hapus filter atau cari yang lain.'}
          </p>
        </div>
      )}

      {/* ── BENEFIT BELI DI KAMI ── */}
      <div className="flex flex-col gap-3 animate-fade-in-up">
        <p className="font-black uppercase text-center text-xs md:text-sm tracking-[0.25em] opacity-50">BENEFIT BELI DI KAMI</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {features.map((f, i) => (
            <div key={i} className="neo-card bg-neo-surface flex flex-col items-center text-center gap-3 py-5 px-3 md:py-6 md:px-6">
              <div className={`${f.color} border-4 border-neo-border p-3 shadow-neo`}>{f.icon}</div>
              <div>
                <h3 className="font-black uppercase text-xs md:text-base leading-tight">{f.title}</h3>
                <p className="text-[10px] md:text-sm font-semibold opacity-60 mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTACT OWNER ── */}
      <div className="flex flex-col gap-3 animate-fade-in-up">
        <p className="font-black uppercase text-center text-xs md:text-sm tracking-[0.25em] opacity-50">CONTACT OWNER</p>
        <div className="grid grid-cols-2 gap-3">
          <a href="https://wa.me/6289685410080" target="_blank" rel="noopener noreferrer"
            className="neo-card bg-green-400 flex items-center justify-center gap-2 py-4 font-black uppercase text-sm tracking-wider hover:-translate-y-2 hover:shadow-neo-heavy transition-all duration-200 text-neo-dark">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WHATSAPP
          </a>
          <a href="https://t.me/DanzoStoreID" target="_blank" rel="noopener noreferrer"
            className="neo-card bg-sky-400 flex items-center justify-center gap-2 py-4 font-black uppercase text-sm tracking-wider hover:-translate-y-2 hover:shadow-neo-heavy transition-all duration-200 text-neo-dark">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            TELEGRAM
          </a>
        </div>
      </div>

      {/* ── METODE PEMBAYARAN ── */}
      <div className="neo-card bg-neo-surface animate-fade-in-up py-5 md:py-6 px-4 md:px-6">
        <p className="text-center font-black uppercase tracking-[0.25em] text-xs md:text-sm opacity-50 mb-5">
          ✦ METODE PEMBAYARAN RESMI ✦
        </p>
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
          <div className="border-4 border-neo-border px-3 md:px-5 py-2 md:py-3 shadow-[4px_4px_0px_0px_var(--color-neo-border)] bg-neo-surface font-black text-sm md:text-lg flex items-center gap-1"><span className="text-neo-dark">▣</span> QRIS</div>
          <div className="border-4 border-neo-border px-3 md:px-5 py-2 md:py-3 shadow-[4px_4px_0px_0px_var(--color-neo-border)] bg-[#108EE9] text-white font-black text-sm md:text-lg">DANA</div>
          <div className="border-4 border-neo-border px-3 md:px-5 py-2 md:py-3 shadow-[4px_4px_0px_0px_var(--color-neo-border)] bg-[#00AED6] text-white font-black text-sm md:text-lg">GoPay</div>
          <div className="border-4 border-neo-border px-3 md:px-5 py-2 md:py-3 shadow-[4px_4px_0px_0px_var(--color-neo-border)] bg-[#4C3494] text-white font-black text-sm md:text-lg">OVO</div>
          <div className="border-4 border-neo-border px-3 md:px-5 py-2 md:py-3 shadow-[4px_4px_0px_0px_var(--color-neo-border)] bg-[#EE4D2D] text-white font-black text-sm md:text-lg">ShopeePay</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="text-center font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-40 pb-4 md:pb-8">
        © {new Date().getFullYear()} {import.meta.env.VITE_STORE_NAME || 'KEYSTORE'} — All Rights Reserved
      </footer>

      {/* ── MODAL PREVIEW FEATURES ── */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewProduct(null)}
        >
          <div
            className="relative w-full max-w-2xl border-4 border-neo-border shadow-[8px_8px_0px_0px_#34d399] bg-neo-dark"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b-4 border-neo-border bg-neo-green text-slate-900">
              <span className="font-black uppercase text-sm tracking-wider text-neo-dark">
                REVIEW {previewProduct.name}
              </span>
              <button
                onClick={() => setPreviewProduct(null)}
                className="bg-neo-dark text-neo-surface border-2 border-neo-border p-1 hover:bg-red-500 transition-all"
              >
                <X size={18} strokeWidth={3}/>
              </button>
            </div>

            {/* Konten */}
            <div className="w-full">
              {previewProduct.mediaType === 'video' ? (
                (() => {
                  const ytId = getYoutubeId(previewProduct.mediaUrl);
                  return ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={previewProduct.mediaUrl} controls autoPlay className="w-full aspect-video"/>
                  );
                })()
              ) : (
                <img src={previewProduct.mediaUrl} alt={previewProduct.name} className="w-full object-contain max-h-[70vh]"/>
              )}
            </div>

            <p className="text-center text-xs font-bold opacity-40 text-neo-surface py-2 uppercase tracking-widest">
              Klik area luar untuk menutup
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
