# JUDGEAI — Trading Judgment Engine

DevHacks S3 · Track 2

An AI-powered trading assistant that analyzes market trends using technical indicators and simulation models to generate buy/sell insights.

---

## Features

* Interactive price charts using HTML5 Canvas
* 12+ technical indicators (RSI, MACD, Bollinger Bands, ATR, VWAP, etc.)
* Signal aggregation for trading recommendations
* GBM (Geometric Brownian Motion) price simulation
* Lightweight UI with no external component libraries

---

## Demo

(Add a screenshot, GIF, or live demo link here)

---

## Quick Start (Local)

```bash id="a1b2c3"
npm install
npm run dev
```

Runs at: http://localhost:3000

---

## Build for Production

```bash id="d4e5f6"
npm run build
```

Output goes to `/dist`

---

## Deployment Options

### Vercel (Recommended)

* Push repo to GitHub
* Go to vercel.com → New Project
* Import your repository
* Build command: npm run build
* Output directory: dist

---

### Netlify

* Drag and drop the `/dist` folder at netlify.com/drop
* Instant live demo

---

### GitHub Pages

```bash id="g7h8i9"
npm install gh-pages --save-dev
```

Add to `package.json`:

```json id="j1k2l3"
"deploy": "gh-pages -d dist"
```

Then run:

```bash id="m4n5o6"
npm run build && npm run deploy
```

---

### Any Static Host

* Run `npm run build`
* Upload contents of `/dist` to your `public_html`

---

## Tech Stack

* React 18 + Vite
* HTML5 Canvas
* JavaScript (custom indicator logic)

---

## Project Structure

```id="p7q8r9"
judgeai/
├── index.html          
├── vite
```
