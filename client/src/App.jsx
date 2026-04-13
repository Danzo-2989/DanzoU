import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';
import { X, Megaphone } from 'lucide-react';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Product from './pages/Product';

function App() {
  const [announcement, setAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Cek tema 
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }

    onValue(ref(db, 'settings/announcement'), (snapshot) => {
      const data = snapshot.val();
      setAnnouncement(data);
      
      if (data && data.enabled && !sessionStorage.getItem('hasSeenAnnouncement')) {
        setShowModal(true);
      } else if (!data?.enabled) {
        setShowModal(false);
      }
    });
  }, []);

  const closeAnnouncement = () => {
    setShowModal(false);
    sessionStorage.setItem('hasSeenAnnouncement', 'true');
  };

  const handleAction = () => {
    closeAnnouncement();
    if (announcement?.buttonUrl) {
      window.open(announcement.buttonUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-neon-green text-black-solid font-sans antialiased selection:bg-black-solid selection:text-neon-green">
      {/* PENGUMUMAN POPUP */}
      {showModal && announcement && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-md border-4 border-neo-dark bg-neo-surface shadow-[8px_8px_0px_0px_var(--color-neo-dark)] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-4 border-neo-dark bg-sky-300">
              <span className="font-black uppercase text-sm tracking-widest flex items-center gap-2 text-neo-dark">
                <Megaphone size={18} strokeWidth={3}/>
                PENGUMUMAN
              </span>
              <button
                onClick={closeAnnouncement}
                className="bg-neo-surface border-2 border-neo-dark p-1 hover:bg-red-400 transition-all shadow-[2px_2px_0_0_var(--color-neo-dark)]"
              >
                <X size={18} strokeWidth={3} className="text-neo-dark" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-6 text-center text-neo-dark">
              <p className="font-bold text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                {announcement.message}
              </p>
              
              <button
                onClick={handleAction}
                className="w-full text-sm md:text-base py-3 border-4 border-neo-dark font-black uppercase flex items-center justify-center gap-2 transition-all bg-neo-green hover:-translate-y-1 shadow-[4px_4px_0px_0px_var(--color-neo-dark)] active:translate-y-1 active:shadow-none"
              >
                {announcement.buttonText || 'TUTUP'}
              </button>
            </div>

          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/checkout/:subProductId" element={<Checkout />} />
      </Routes>
    </div>
  );
}

export default App;
