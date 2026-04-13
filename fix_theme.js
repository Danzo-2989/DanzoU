const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'client/src/pages/Product.jsx')
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');

  // Convert border colors
  c = c.replace(/border-neo-dark/g, 'border-neo-border');
  
  // Convert explicit shadows using text or hex
  c = c.replace(/shadow-\[([0-9px_-]+)_(var\(--color-neo-dark\)|#1e293b)\]/g, 'shadow-[$1_var(--color-neo-border)]');

  // Active Tag buttons (Home & Admin)
  c = c.replace(/text-white/g, 'text-neo-surface');

  // Beli Button & Action Buttons on neo-green
  // We add text-slate-900 to ensure readability on neon green.
  c = c.replace(/bg-neo-green/g, 'bg-neo-green text-slate-900');

  // But we have to fix duplicated text-slate-900 if any
  c = c.replace(/text-slate-900 text-slate-900/g, 'text-slate-900');

  // Sometimes we also have text-neo-dark inside bg-neo-green, let's remove it if text-slate-900 is added
  c = c.replace(/bg-neo-green text-slate-900(.*?)(text-neo-dark|text-neo-surface)/g, 'bg-neo-green text-slate-900$1');

  fs.writeFileSync(f, c);
});

console.log('Dark mode components adapted!');
