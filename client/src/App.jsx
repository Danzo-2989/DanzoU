import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Product from './pages/Product';

function App() {
  return (
    <div className="min-h-screen bg-neon-green text-black-solid font-sans antialiased selection:bg-black-solid selection:text-neon-green">
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
