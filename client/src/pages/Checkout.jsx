import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import axios from 'axios';
import { ArrowLeft, Wallet, Loader2, CheckCircle2, Mail, AlertTriangle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function Checkout() {
  const { subProductId } = useParams();
  const navigate = useNavigate();
  
  const [subProduct, setSubProduct] = useState(null);
  const [product, setProduct] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    onValue(ref(db, 'products'), (snapshot) => {
      const allProducts = snapshot.val() || {};
      for (const pid in allProducts) {
        if (allProducts[pid].sub_products && allProducts[pid].sub_products[subProductId]) {
          setProduct(allProducts[pid]);
          setSubProduct(allProducts[pid].sub_products[subProductId]);
          break;
        }
      }
    });
  }, [subProductId]);

  useEffect(() => {
    let interval;
    if (status === 'pending' && paymentData?.trx_id) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/status/${paymentData.trx_id}`);
          if (res.data.status === 'success') {
            setStatus('success');
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [status, paymentData]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!email) return alert("Email wajib diisi ya kak!");
    
    setLoading(true);
    setStatus('loading');

    try {
      const res = await axios.post(`${API_BASE_URL}/checkout`, {
        subProductId,
        email,
        price: subProduct.price,
        productName: `${product.name} - ${subProduct.label}`
      });

      if (res.data.success) {
        setPaymentData(res.data.data);
        setStatus('pending');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (!subProduct) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-2xl text-neo-dark">Memuat...</div>;

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center py-12">
      <div className="max-w-xl w-full flex flex-col gap-6">
        
        <button 
          onClick={() => navigate('/')}
          className="neo-button w-fit animate-fade-in-up"
        >
          <ArrowLeft size={20} className="mr-2"/> Kembali
        </button>

        <div className="neo-card bg-white animate-fade-in-up">
          {status === 'success' ? (
            <div className="text-center py-12 flex flex-col items-center gap-6">
              <div className="bg-neo-green p-6 border-4 border-neo-dark shadow-neo">
                <CheckCircle2 size={64} strokeWidth={2.5} className="text-neo-dark" />
              </div>
              <h2 className="text-4xl font-black uppercase mb-2">Pembayaran Sukses!</h2>
              <p className="font-bold opacity-80 mb-6">
                Lisensi dikirimkan ke: <br/>
                <span className="font-mono bg-neo-dark text-neo-green px-3 py-1 mt-2 inline-block">{email}</span>
              </p>
              <button onClick={() => navigate('/')} className="neo-button-primary w-full text-neo-dark">
                Kembali ke Toko
              </button>
            </div>
          ) : (
            <>
              <div className="border-b-4 border-neo-dark pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black uppercase leading-none line-clamp-1 text-neo-dark">{product?.name}</h1>
                  <p className="font-bold opacity-60 text-lg uppercase text-neo-dark">{subProduct.label}</p>
                </div>
                <div className="bg-neo-green border-4 border-neo-dark px-3 py-1 shadow-neo text-neo-dark shrink-0">
                  <span className="font-black">Rp {subProduct.price.toLocaleString()}</span>
                </div>
              </div>

              {status === 'pending' ? (
                <div className="flex flex-col items-center gap-6 py-4 animate-fade-in-up">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-neo-dark">Scan QRIS Untuk Bayar</h2>
                  <div className="p-4 bg-white border-4 border-neo-dark shadow-neo-heavy flex flex-col gap-4">
                    <img src={paymentData.qris_image_url} alt="QRIS" className="w-64 h-64 object-contain mx-auto" />
                    
                    {paymentData.total_amount && (
                      <div className="w-full flex flex-col gap-2 border-t-4 border-neo-dark pt-4 font-bold uppercase text-neo-dark text-sm">
                        <div className="flex justify-between">
                          <span>Harga Aplikasi</span>
                          <span>Rp {subProduct.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between opacity-80">
                          <span>Biaya Layanan (QRIS)</span>
                          <span>Rp {paymentData.fee.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1 bg-neo-dark my-1"></div>
                        <div className="flex justify-between text-lg font-black text-neo-green bg-neo-dark px-2 py-1 shadow-[2px_2px_0_0_#1e293b]">
                          <span>Total</span>
                          <span>Rp {paymentData.total_amount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-neo-dark text-white p-4 w-full text-center font-mono font-bold border-4 border-neo-dark shadow-neo">
                    STATUS: {status.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-3 font-bold text-sm opacity-70 text-neo-dark">
                    <Loader2 className="animate-spin" size={18} /> Verifikasi Otomatis...
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePayment} className="flex flex-col gap-8 animate-fade-in-up">
                  <div className="flex flex-col gap-3">
                    <label className="font-black flex items-center gap-2 bg-neo-green border-4 border-neo-dark w-fit px-4 py-2 shadow-neo text-neo-dark">
                      <Mail size={18} /> EMAIL PENERIMA
                    </label>
                    <input 
                      type="email" 
                      className="neo-input text-lg text-neo-dark" 
                      placeholder="contoh: budi@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="bg-orange-50 border-4 border-neo-dark p-4 flex gap-4 text-neo-dark shadow-[4px_4px_0px_0px_#1e293b]">
                    <AlertTriangle className="shrink-0 text-orange-500" size={24} />
                    <p className="text-xs font-bold uppercase opacity-80 mt-1">
                      Barang digital tidak dapat direfund. Membeli = setuju.
                    </p>
                  </div>

                  <button 
                    disabled={loading}
                    className="neo-button-primary text-xl py-5 text-neo-dark"
                  >
                    {loading ? <Loader2 className="animate-spin" size={28}/> : <Wallet size={28}/>}
                    {loading ? 'MEMPROSES...' : 'BAYAR SEKARANG'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Checkout;
