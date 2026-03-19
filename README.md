# JUDGEAI — Trading Judgment Engine
### DevHacks S3 · Track 2

An AI-powered investment recommendation platform that analyzes market trends and technical indicators to generate trading insights.

## My Contribution
- Implemented technical indicators such as RSI and MACD  
- Worked on chart visualization using HTML5 Canvas  
- Contributed to frontend development using React  

## Quick Start (Local)

```bash
npm install
npm run dev

Opens at http://localhost:3000

Build for Production
npm run build

Output goes to /dist folder — deploy that to any static host.

Tech Stack

React 18 + Vite

HTML5 Canvas (charts)

GBM price simulation

12 TA indicators (RSI, MACD, BB, Stoch, ATR, Williams %R, CCI, OBV, VWAP, SMA, EMA)

Zero external UI libraries

Project Structure
judgeai/
├── index.html          
├── vite.config.js      
├── src/
│   ├── main.jsx        
│   ├── App.jsx         
│   └── index.css       
└── dist/     
