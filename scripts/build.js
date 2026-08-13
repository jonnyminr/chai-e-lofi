/**
 * Optional static copy step — site is already deployable from /public.
 * Kept for npm run build compatibility with hosts that expect a build script.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const required = ['index.html', 'config.js', 'css/main.css', 'js/app.js'];

var missing = required.filter(function (f) {
  return !fs.existsSync(path.join(pub, f));
});

if (missing.length) {
  console.error('Build failed. Missing:', missing.join(', '));
  process.exit(1);
}

console.log('chai-e-lofi: public/ is ready to deploy.');
