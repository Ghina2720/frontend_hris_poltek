import { useEffect, useState } from "react";
import axios from "axios";
import "./Loader.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
const SETTING_API = `${API_BASE}/setting`;

const Loader = () => {
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(SETTING_API)
      .then(res => {
        const data = res.data.message?.[0];
        if (data && data.logo_kecil) {
          setLogo(data.logo_kecil);
        }
      })
      .catch(err => console.error("Error fetching setting:", err))
      .finally(() => {
        // backup stop loading jika gagal load image
        setTimeout(() => setLoading(false), 4000);
      });
  }, []);

  return (
    <div className="loader-wrapper">
      {logo && loading && (
        <img
          src={`${API_BASE.replace("/api", "")}/storage/${logo}`}
          alt="logo kecil"
          className="loader-logo"
          onLoad={() => setLoading(false)}
        />
      )}

      {/* Fallback animasi pelangi untuk spinner */}
      {loading && (
        <div className="loader-fallback"></div>
      )}
    </div>
  );
};

export default Loader;
