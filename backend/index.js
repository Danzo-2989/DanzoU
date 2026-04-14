// Removed firebase-functions for Vercel deployment
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load local .env (hanya untuk local testing dengan firebase emulators)
dotenv.config();

// Inisialisasi Firebase Admin dengan Service Account (Buat Vercel)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  // Fix for PEM formatting issue in env variables
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
  });
} else {
  // Fallback buat local development (kalo udah login via firebase login)
  admin.initializeApp({
    databaseURL: process.env.DATABASE_URL
  });
}

const db = admin.database();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- HELPER: Send Email ---
async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS // Apps Password Gmail
    }
  });

  const mailOptions = {
    from: `"KeyStore" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text
  };

  return transporter.sendMail(mailOptions);
}

// --- ENDPOINT: Create Checkout ---
app.post("/checkout", async (req, res) => {
  const { subProductId, productId, email, whatsapp, price, productName } = req.body;

  try {
    const reference_id = `TRX-${Date.now()}`;
    
    // 1. Hit API Payinaja
    const payinajaRes = await axios.post(`${process.env.PAYINAJA_BASE_URL}/qris/create`, {
      amount: price,
      reference_id: reference_id,
      customer_name: email.split('@')[0]
    }, {
      headers: { 'x-api-key': process.env.PAYINAJA_API_KEY }
    });

    if (payinajaRes.data.success) {
      const trxData = payinajaRes.data.data;

      // 2. Simpan Transaksi Ke RTDB
      await db.ref(`transactions/${trxData.payinaja_trx_id}`).set({
        trx_id: trxData.payinaja_trx_id,
        merchant_ref: reference_id,
        product_id: productId || null,
        sub_product_id: subProductId,
        product_name: productName,
        buyer_email: email,
        buyer_whatsapp: whatsapp || '',
        amount: price,
        status: 'pending',
        created_at: admin.database.ServerValue.TIMESTAMP
      });

      return res.json({ 
        success: true, 
        data: {
          trx_id: trxData.payinaja_trx_id,
          qris_image_url: trxData.qris_image_url,
          fee: trxData.fee,
          total_amount: trxData.total_amount
        }
      });
    }

    res.status(400).json({ success: false, message: "Payinaja initialization failed" });
  } catch (error) {
    console.error("Checkout Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Login ---
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true, message: "Login success" });
  }
  return res.status(401).json({ success: false, message: "Password salah!" });
});

// --- ENDPOINT: Check Status & Fulfill ---
app.get("/status/:trx_id", async (req, res) => {
  const { trx_id } = req.params;

  try {
    // 1. Cek status ke Payinaja
    const payinajaRes = await axios.get(`${process.env.PAYINAJA_BASE_URL}/transaction/${trx_id}`, {
      headers: { 'x-api-key': process.env.PAYINAJA_API_KEY }
    });

    const currentStatus = payinajaRes.data.data.status; // success / pending

    if (currentStatus === 'success') {
      const trxRef = db.ref(`transactions/${trx_id}`);
      const snapshot = await trxRef.get();
      const trx = snapshot.val();

      // Jika status di DB masih pending, tapi di Payinaja sudah success -> Eksekusi Pengiriman!
      if (trx && trx.status === 'pending') {
        // A. Ambil Stok Key
        const stockRef = db.ref(`stock/${trx.sub_product_id}`).limitToFirst(1);
        const stockSnap = await stockRef.get();
        
        if (stockSnap.exists()) {
          const keyId = Object.keys(stockSnap.val())[0];
          const actualKey = stockSnap.val()[keyId];

          // B. Hapus key dari stok (biar gak kepake orang lain)
          await db.ref(`stock/${trx.sub_product_id}/${keyId}`).remove();

          // C. Ambil Email Template dari Settings
          const templateSnap = await db.ref('settings/emailTemplate').get();
          let template = templateSnap.val() || "Terima kasih, berikut key anda: {stok_key}";
          
          let finalMessage = template.replace("{stok_key}", actualKey);

          // C.2. Fetch product download_url if exists
          let productDownloadUrl = '';
          if (trx.product_id) {
            const prodSnap = await db.ref(`products/${trx.product_id}`).get();
            if (prodSnap.exists() && prodSnap.val().download_url) {
              productDownloadUrl = prodSnap.val().download_url;
              if (template.includes('{download_url}')) {
                finalMessage = finalMessage.replace("{download_url}", productDownloadUrl);
              } else {
                finalMessage += `\n\nLink Download Aplikasi: ${productDownloadUrl}`;
              }
            } else {
              finalMessage = finalMessage.replace("{download_url}", "");
            }
          }

          // D. Kirim Email Ke Buyer
          await sendEmail(trx.buyer_email, `LICENSE KEY: ${trx.product_name}`, finalMessage);

          // E. Kirim Notif Ke Owner
          await sendEmail(process.env.OWNER_EMAIL, `ADA CUAN MASUK! - ${trx.product_name}`, 
            `Seseorang baru saja membeli ${trx.product_name} seharga Rp ${trx.amount.toLocaleString()}.\nBuyer Email: ${trx.buyer_email}`
          );

          // F. Update Status di DB
          await trxRef.update({ status: 'success', key_delivered: actualKey });
          
          return res.json({ status: 'success', message: "Order fulfilled!", key: actualKey, download_url: productDownloadUrl });
        } else {
          // Kasus Stok Habis Mendadak
          return res.json({ status: 'out_of_stock', message: "Payment success but stock is empty! Contact admin." });
        }
      }
    }

    res.json({ status: currentStatus });
  } catch (error) {
    console.error("Status Check Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- MIDDLEWARE: Admin Auth ---
const adminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (password && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Unauthorized Admin" });
  }
};

// --- ENDPOINT: Admin Tambah Produk ---
app.post("/admin/products", adminAuth, async (req, res) => {
  try {
    const prodRef = db.ref('products');
    const newProdRef = prodRef.push();
    await newProdRef.set(req.body);
    res.json({ success: true, message: "Produk berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Tambah Sub Produk ---
app.post("/admin/products/:id/sub_products", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const subRef = db.ref(`products/${id}/sub_products`);
    const newSubRef = subRef.push();
    await newSubRef.set(req.body);
    res.json({ success: true, message: "Variasi berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Inject Bulk Stock ---
app.post("/admin/stock/:subId", adminAuth, async (req, res) => {
  try {
    const { subId } = req.params;
    const { keys } = req.body; // Expecting array of strings
    if (!Array.isArray(keys)) return res.status(400).json({ success: false, message: "Invalid keys format" });
    
    const stockRef = db.ref(`stock/${subId}`);
    for (const key of keys) {
      const newKeyRef = stockRef.push();
      await newKeyRef.set(key);
    }
    res.json({ success: true, message: `${keys.length} keys berhasil ditambahkan` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Tambah Game Variant ---
app.post("/admin/products/:id/game_variants", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const gameRef = db.ref(`products/${id}/game_variants`);
    const newGameRef = gameRef.push();
    await newGameRef.set(req.body);
    res.json({ success: true, message: "Game variant berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Hapus Game Variant ---
app.delete("/admin/products/:productId/game_variants/:gameId", adminAuth, async (req, res) => {
  try {
    const { productId, gameId } = req.params;
    await db.ref(`products/${productId}/game_variants/${gameId}`).remove();
    res.json({ success: true, message: "Game variant berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Hapus Produk ---
app.delete("/admin/products/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Hapus stock semua sub_products dulu
    const prodSnap = await db.ref(`products/${id}/sub_products`).get();
    if (prodSnap.exists()) {
      const subIds = Object.keys(prodSnap.val());
      for (const subId of subIds) {
        await db.ref(`stock/${subId}`).remove();
      }
    }
    await db.ref(`products/${id}`).remove();
    res.json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Hapus Sub Produk ---
app.delete("/admin/products/:productId/sub_products/:subId", adminAuth, async (req, res) => {
  try {
    const { productId, subId } = req.params;
    await db.ref(`products/${productId}/sub_products/${subId}`).remove();
    await db.ref(`stock/${subId}`).remove();
    res.json({ success: true, message: "Variasi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Hapus Stock Key ---
app.delete("/admin/stock/:subId/:keyId", adminAuth, async (req, res) => {
  try {
    const { subId, keyId } = req.params;
    await db.ref(`stock/${subId}/${keyId}`).remove();
    res.json({ success: true, message: "Key berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Simpan Template Email ---
app.post("/admin/settings/emailTemplate", adminAuth, async (req, res) => {
  try {
    const { template } = req.body;
    await db.ref('settings/emailTemplate').set(template);
    res.json({ success: true, message: "Template email berhasil disimpan" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// --- ENDPOINT: Admin Edit Produk ---
app.put("/admin/products/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.ref(`products/${id}`).update(req.body);
    res.json({ success: true, message: "Produk berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Edit Sub Produk ---
app.put("/admin/products/:productId/sub_products/:subId", adminAuth, async (req, res) => {
  try {
    const { productId, subId } = req.params;
    await db.ref(`products/${productId}/sub_products/${subId}`).update(req.body);
    res.json({ success: true, message: "Variasi berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Edit Stock Key ---
app.put("/admin/stock/:subId/:keyId", adminAuth, async (req, res) => {
  try {
    const { subId, keyId } = req.params;
    const { key } = req.body;
    await db.ref(`stock/${subId}/${keyId}`).set(key);
    res.json({ success: true, message: "Key berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Simpan Pengumuman Website ---
app.post("/admin/settings/announcement", adminAuth, async (req, res) => {
  try {
    const data = req.body; // { enabled, message, buttonText, buttonUrl }
    await db.ref('settings/announcement').set(data);
    res.json({ success: true, message: "Pengumuman website berhasil disimpan" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ENDPOINT: Admin Resend Key ---
app.post("/admin/transactions/:trx_id/resend", adminAuth, async (req, res) => {
  try {
    const { trx_id } = req.params;
    const trxSnap = await db.ref(`transactions/${trx_id}`).get();
    if (!trxSnap.exists()) {
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }
    const trx = trxSnap.val();
    if (trx.status !== 'success' || !trx.key_delivered) {
      return res.status(400).json({ success: false, message: "Transaksi belum sukses atau key belum terkirim" });
    }

    const templateSnap = await db.ref('settings/emailTemplate').get();
    let template = templateSnap.val() || "Terima kasih, berikut key anda: {stok_key}";
    const finalMessage = template.replace("{stok_key}", trx.key_delivered);

    await sendEmail(trx.buyer_email, `[RESEND] LICENSE KEY: ${trx.product_name}`, finalMessage);
    
    res.json({ success: true, message: "Email berhasil dikirim ulang ke " + trx.buyer_email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export the Express app for Vercel
module.exports = app;

// --- LOCAL DEVELOPMENT ---
// Jalankan server di port 3000 kalau jalan di local (bukan di Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend Admin berjalan di http://localhost:${PORT}`);
  });
}
