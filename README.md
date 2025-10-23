# 📊 Algo Webserver — Algorithmic Backtester server (Proprietary)
> ⚠️ **All Rights Reserved** — This repository and its source code are the property of **Kevin Sodhi**.  
> No permission is granted to copy, modify, or redistribute without explicit written consent.

📁 Folder Structure
public/
  ├── style.css
  ├── StockMarket.png
  ├── sample.csv
  └── errors/
      ├── 404error.jpeg
      └── 500error.png

AlgoBacktester.js   # Main Express server
index.html          # Frontend UI
404.html / 500.html # Error templates
package.json        # Scripts & dependencies
.gitignore
UNLICENSED.txt


## 🚀 Overview
A full-stack **Node.js + Express** webserver that powers an algorithmic trading backtester.  
It provides an interface to upload or use sample CSV stock data, validate moving-average parameters,  
and handle AJAX-based previews and custom 404/500 error routes.

This project serves as the backend for an upcoming Java-based algorithmic engine and MongoDB analytics layer.

---

## 🧩 Features
- Static file serving for `index.html`, `style.css`, and assets
- CSV file upload via **Multiparty**
- Parameter validation through **AJAX (fetch POST)**
- Query & route parameter handling
- Custom **404** and **500** error pages
- Modular structure for easy backend expansion

---

## 🛠️ Quickstart

```bash
# Install dependencies
npm install

# Start the server (with autoreload)
npm run dev

# or run normally
npm start


