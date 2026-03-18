# JUDGEAI — Trading Judgment Engine
### DevHacks S3 · Track 2

## Quick Start (Local)

```bash
npm install
npm run dev
```
Opens at http://localhost:3000

## Build for Production

```bash
npm run build
```
Output goes to `/dist` folder — deploy that to any static host.

## Deploy Options

### Vercel (easiest — free)
1. Push to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Framework: Vite · Build: `npm run build` · Output: `dist`
4. Deploy → done

### Netlify (free)
1. Drag and drop the `/dist` folder at netlify.com/drop
2. Live instantly — no signup needed for a quick demo

### GitHub Pages
```bash
npm install gh-pages --save-dev
```
Add to package.json scripts:
```json
"deploy": "gh-pages -d dist"
```
```bash
npm run build && npm run deploy
```

### Any Static Host (Hostinger, cPanel etc.)
- Run `npm run build`
- Upload everything inside the `/dist` folder to your `public_html`

## Tech Stack
- React 18 + Vite
- HTML5 Canvas (charts)
- GBM price simulation
- 12 TA indicators (RSI, MACD, BB, Stoch, ATR, Williams %R, CCI, OBV, VWAP, SMA, EMA)
- Zero external UI libraries

## Project Structure
```
judgeai/
├── index.html          ← entry HTML
├── vite.config.js      ← Vite config
├── src/
│   ├── main.jsx        ← React root mount
│   ├── App.jsx         ← entire app (all components)
│   └── index.css       ← minimal reset
└── dist/               ← production build output
```
