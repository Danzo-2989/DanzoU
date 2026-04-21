import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { Zap, CircleAlert, KeyRound, DollarSign, Lock, Clock, X, Play, Search, Moon, Sun, MoreVertical, MessageCircle, Send, Music } from 'lucide-react';

function Home() {
  const [products, setProducts] = useState({});
  const [stock, setStock] = useState({});
  const [activeDeviceFilter, setActiveDeviceFilter] = useState('ALL');
  const [activeGameFilter, setActiveGameFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewProduct, setPreviewProduct] = useState(null); // { name, mediaUrl, mediaType }
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const deviceCategories = ['ALL', ...Array.from(
    new Set(Object.values(products).flatMap(p =>
      p.tags ? p.tags.split(',').map(t => t.trim().toUpperCase()).filter(Boolean) : []
    ))
  )];

  const gameCategories = ['ALL', ...Array.from(
    new Set(Object.values(products).flatMap(p =>
      p.game_category ? p.game_category.split(',').map(t => t.trim().toUpperCase()).filter(Boolean) : []
    ))
  )];

  const filteredProducts = Object.entries(products).filter(([, product]) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.desc && product.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    const matchDevice = activeDeviceFilter === 'ALL' || (
      product.tags && product.tags.split(',').map(t => t.trim().toUpperCase()).includes(activeDeviceFilter)
    );

    const matchGame = activeGameFilter === 'ALL' || (
      product.game_category && product.game_category.split(',').map(t => t.trim().toUpperCase()).includes(activeGameFilter)
    );

    return matchDevice && matchGame;
  });

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
      <header className="flex items-center gap-3 neo-card bg-neo-surface animate-fade-in-up py-3 px-4 md:py-6 md:px-6 justify-between relative z-50">
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
        <div className="flex gap-2">
          <button onClick={toggleTheme} title="Toggle Dark/Light Mode"
            className="bg-neo-surface border-4 border-neo-border p-2 md:p-3 shadow-neo hover:-translate-y-1 hover:shadow-neo-heavy transition-all cursor-pointer">
            {isDark ? <Sun size={24} className="text-neo-dark" strokeWidth={3}/> : <Moon size={24} className="text-neo-dark" strokeWidth={3}/>}
          </button>
          <button onClick={() => setIsMenuOpen(true)} title="Menu Saluran & Kontak"
            className="bg-yellow-400 border-4 border-neo-border p-2 md:p-3 shadow-neo hover:-translate-y-1 hover:shadow-neo-heavy transition-all cursor-pointer">
            <MoreVertical size={24} className="text-slate-900" strokeWidth={3}/>
          </button>
        </div>
      </header>

      {/* ── PENCARIAN & FILTER KATEGORI ── */}
      <div className="flex flex-col gap-5 animate-fade-in-up">
        {/* Kolom Pencarian */}
        <div className="flex bg-neo-surface border-4 border-neo-border shadow-[4px_4px_0px_0px_var(--color-neo-border)] focus-within:-translate-y-1 focus-within:shadow-[6px_6px_0_0_var(--color-neo-border)] transition-all h-12 md:h-14 w-full shrink-0">
          <div className="bg-neo-green text-slate-900 px-4 border-r-4 border-neo-border flex items-center justify-center">
            <Search size={20} strokeWidth={3}/>
          </div>
          <input type="text" placeholder="CARI PRODUK (NAMA ATAU DESKRIPSI)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 font-black uppercase text-neo-dark outline-none bg-transparent placeholder:opacity-50 text-sm md:text-base"/>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="px-4 flex items-center justify-center text-neo-dark hover:bg-red-200 border-l-4 border-neo-border">
              <X size={20} strokeWidth={3}/>
            </button>
          )}
        </div>

        {/* Filter Group */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Filter Kategori Device */}
          {deviceCategories.length > 1 && (
            <div className="flex flex-col gap-2 overflow-hidden flex-1">
              <span className="text-[10px] md:text-xs font-black opacity-50 block uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-neo-dark rounded-full"></div> Filter Device / Platform
              </span>
              <div className="flex gap-2 overflow-x-auto pb-3 items-center custom-scrollbar pr-6 md:pr-2">
                {deviceCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveDeviceFilter(cat)}
                    className={`shrink-0 border-2 md:border-4 border-neo-border px-3 py-1.5 md:px-4 md:py-2 font-black uppercase text-[10px] md:text-sm tracking-widest md:tracking-wider transition-all duration-150
                      ${activeDeviceFilter === cat
                        ? 'bg-neo-dark text-neo-surface shadow-none translate-x-0.5 translate-y-0.5 md:translate-x-1 md:translate-y-1'
                        : 'bg-neo-surface hover:-translate-y-0.5 md:hover:-translate-y-1 shadow-[2px_2px_0px_0px_var(--color-neo-border)] md:shadow-[4px_4px_0px_0px_var(--color-neo-border)] hover:shadow-[3px_3px_0px_0px_var(--color-neo-border)] md:hover:shadow-[6px_6px_0px_0px_var(--color-neo-border)]'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Kategori Game */}
          {gameCategories.length > 1 && (
            <div className="flex flex-col gap-2 overflow-hidden flex-1">
              <span className="text-[10px] md:text-xs font-black opacity-50 block uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 border-2 border-neo-border rounded-full"></div> Filter Kategori Game
              </span>
              <div className="flex gap-2 overflow-x-auto pb-3 items-center custom-scrollbar pr-6 md:pr-2">
                {gameCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveGameFilter(cat)}
                    className={`shrink-0 border-2 md:border-4 border-neo-border px-3 py-1.5 md:px-4 md:py-2 font-black uppercase text-[10px] md:text-sm tracking-widest md:tracking-wider transition-all duration-150
                      ${activeGameFilter === cat
                        ? 'bg-yellow-300 text-neo-dark shadow-none translate-x-0.5 translate-y-0.5 md:translate-x-1 md:translate-y-1'
                        : 'bg-neo-surface hover:-translate-y-0.5 md:hover:-translate-y-1 shadow-[2px_2px_0px_0px_var(--color-neo-border)] md:shadow-[4px_4px_0px_0px_var(--color-neo-border)] hover:shadow-[3px_3px_0px_0px_var(--color-neo-border)] md:hover:shadow-[6px_6px_0px_0px_var(--color-neo-border)]'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── GRID PRODUK ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
        {filteredProducts.sort((a,b) => (a[1].order || 0) - (b[1].order || 0)).map(([id, product]) => {
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
            {activeDeviceFilter === 'ALL' && activeGameFilter === 'ALL' ? 'Wow, Kosong!' : 'Tidak ada produk'}
          </h2>
          <p className="font-bold opacity-75 text-sm">
            {activeDeviceFilter === 'ALL' && activeGameFilter === 'ALL' ? 'Belum ada produk.' : 'Coba kategori lain.'}
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

      {/* ── SIDEBAR MENU ── */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay */}
          <div className="absolute inset-0 bg-neo-dark/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMenuOpen(false)}></div>
          
          {/* Sidebar Drawer */}
          <div className="relative w-[300px] max-w-[80vw] bg-neo-surface h-full border-l-8 border-neo-border p-6 shadow-[-8px_0_0_0_var(--color-neo-border)] animate-slide-in-right flex flex-col gap-5 overflow-y-auto">
            <div className="flex justify-between items-center border-b-4 border-neo-border pb-4">
              <h2 className="text-xl font-black uppercase text-neo-dark tracking-wider flex items-center gap-2">
                 Menu
              </h2>
              <button onClick={() => setIsMenuOpen(false)} className="border-4 border-neo-border bg-red-400 text-slate-900 p-1 hover:-translate-y-1 transition-all shadow-[2px_2px_0_0_var(--color-neo-border)] active:translate-y-0 active:shadow-none">
                <X size={20} strokeWidth={3}/>
              </button>
            </div>
            
            <div className="flex flex-col gap-3 mt-2">
              <a href="https://t.me/DanzoStoreID" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-sky-400 border-4 border-neo-border p-3 shadow-[4px_4px_0_0_var(--color-neo-border)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-neo-border)] active:translate-y-0 transition-all text-slate-900 font-black uppercase text-sm">
                <Send size={18} strokeWidth={3}/> Telegram
              </a>
              <a href="https://wa.me/6289685410080" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-emerald-400 border-4 border-neo-border p-3 shadow-[4px_4px_0_0_var(--color-neo-border)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-neo-border)] active:translate-y-0 transition-all text-slate-900 font-black uppercase text-sm">
                <MessageCircle size={18} strokeWidth={3}/> WhatsApp Chat
              </a>
              <a href="https://whatsapp.com/channel/0029VauSJKG4o7qSMawZwE10" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-emerald-300 border-4 border-neo-border p-3 shadow-[4px_4px_0_0_var(--color-neo-border)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-neo-border)] active:translate-y-0 transition-all text-slate-900 font-black uppercase text-sm">
                <MessageCircle size={18} strokeWidth={3}/> Saluran WA
              </a>
              <a href="https://www.youtube.com/@danzoxiterz" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-red-500 border-4 border-neo-border p-3 shadow-[4px_4px_0_0_var(--color-neo-border)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-neo-border)] active:translate-y-0 transition-all text-slate-900 font-black uppercase text-sm">
                <Play size={18} strokeWidth={3} fill="currentColor"/> YouTube
              </a>
              <a href="https://www.tiktok.com/@danzoxiterznew" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-purple-400 border-4 border-neo-border p-3 shadow-[4px_4px_0_0_var(--color-neo-border)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-neo-border)] active:translate-y-0 transition-all text-slate-900 font-black uppercase text-sm">
                <Music size={18} strokeWidth={3}/> TikTok
              </a>
            </div>
            
            <div className="mt-auto opacity-50 text-center text-[10px] font-black uppercase tracking-widest pt-4 border-t-4 border-neo-border text-neo-dark">
              &copy; {new Date().getFullYear()} DANZO STORE
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
