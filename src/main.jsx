import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

import axios from "axios";

// 🔹 Ambil base URL dari .env
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

// 🔹 Fungsi untuk mengganti favicon dari API
async function updateFavicon() {
  try {
    const res = await axios.get(`${API_BASE}/setting`);
    const company = res.data.message[0];

    if (company?.logo_kecil) {
      const favicon = document.getElementById("dynamic-favicon");
      if (favicon) {
        favicon.href = `${API_BASE.replace("/api", "/storage")}/${company.logo_kecil}`;
      }
    }
  } catch (error) {
    console.warn("⚠️ Gagal memuat logo kecil, gunakan logosci.png sebagai default.");
  }
}

// Jalankan setelah load
updateFavicon();

createRoot(document.getElementById('root')).render(<StrictMode>
        <BrowserRouter basename="/">
            <App />
        </BrowserRouter>
    </StrictMode>);