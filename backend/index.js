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
  const { subProductId, email, price, productName } = req.body;

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
        sub_product_id: subProductId,
        product_name: productName,
        buyer_email: email,
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
          
          const finalMessage = template.replace("{stok_key}", actualKey);

          // D. Kirim Email Ke Buyer
          await sendEmail(trx.buyer_email, `LICENSE KEY: ${trx.product_name}`, finalMessage);

          // E. Kirim Notif Ke Owner
          await sendEmail(process.env.OWNER_EMAIL, `ADA CUAN MASUK! - ${trx.product_name}`, 
            `Seseorang baru saja membeli ${trx.product_name} seharga Rp ${trx.amount.toLocaleString()}.\nBuyer Email: ${trx.buyer_email}`
          );

          // F. Update Status di DB
          await trxRef.update({ status: 'success', key_delivered: actualKey });
          
          return res.json({ status: 'success', message: "Order fulfilled!" });
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
