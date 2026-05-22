import React, { useState, useEffect } from "react";
import { Row, Col, Card, Spinner, Alert, Form, Button, Pagination, Badge} from "react-bootstrap";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { Doughnut } from "react-chartjs-2";
import maskotImage from "./maskot.png";
import suaraElang from "./suara.mp3";
import logoKampus from "./logo-kampus.png";
import bgStaiku from "./bg-staiku.jpeg";

// 🔹 Register Chart.js components
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 🔹 KOMPONEN LIVE CLOCK DENGAN KARAKTER + GREETING & MOTIVASI
const LiveClockWithCharacter = ({ userName, userGreeting, userIcon, userMotivation }) => {
  const [time, setTime] = useState(new Date());
  const [character, setCharacter] = useState({ emoji: "😊", message: "" });
  const [audio] = useState(new Audio(suaraElang));

  // Update waktu setiap detik
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update karakter berdasarkan jam
  useEffect(() => {
    const hour = time.getHours();
    
    // Format waktu untuk menentukan karakter
    if (hour >= 5 && hour < 7) {
      setCharacter({ 
        emoji: "🌅", 
        message: "Subuh... Semangat pagi!" 
      });
    } else if (hour >= 7 && hour < 10) {
      setCharacter({ 
        emoji: "🧑‍💻", 
        message: "Pagi yang cerah! Saatnya produktif!" 
      });
    } else if (hour >= 10 && hour < 12) {
      setCharacter({ 
        emoji: "🔥", 
        message: "Gas terus! Jaga semangat!" 
      });
    } else if (hour >= 12 && hour < 13) {
      setCharacter({ 
        emoji: "🍱", 
        message: "Bagi yang puasa, semoga lancar. Yang tidak puasa, selamat makan siang!" 
      });
    } else if (hour >= 13 && hour < 15) {
      setCharacter({ 
        emoji: "😴", 
        message: "Ngantuk? Cuci muka yuk!" 
      });
    } else if (hour >= 15 && hour < 16) {
      setCharacter({ 
        emoji: "⏰", 
        message: "Menjelang pulang! Selesaikan tugas!" 
      });
    } else if (hour >= 16 && hour < 17) {
      setCharacter({ 
        emoji: "🏎️", 
        message: "Waktunya pulang! Hati-hati di jalan!" 
      });
    } else if (hour >= 17 && hour < 19) {
      setCharacter({ 
        emoji: "🌇", 
        message: "Selamat sore! Waktunya recharge energi setelah aktivitas" 
      });
    } else if (hour >= 19 && hour < 21) {
      setCharacter({ 
        emoji: "🏠", 
        message: "Waktu berkumpul keluarga" 
      });
    } else if (hour >= 21 && hour < 23) {
      setCharacter({ 
        emoji: "📺", 
        message: "Santai sebentar..." 
      });
    } else if (hour >= 23 || hour < 3) {
      setCharacter({ 
        emoji: "😪", 
        message: "Sudah malam, istirahat!" 
      });
    } else if (hour >= 3 && hour < 5) {
      setCharacter({ 
        emoji: "🐔", 
        message: "Bangun! Subuh sudah tiba!" 
      });
    }
  }, [time]);

  // Format tanggal Indonesia
  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format waktu dengan leading zero
  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
 const getTheme = () => {
  const hour = time.getHours();
  if (hour >= 5 && hour < 10) return { 
    base: '#f59e0b', // Morning Golden
    accent: 'rgba(251, 191, 36, 0.4)',
    mesh: 'radial-gradient(circle at 20% 20%, rgba(251, 191, 36, 0.7) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.5) 0%, transparent 50%)'
  };
  if (hour >= 10 && hour < 16) return { 
    base: '#0ea5e9', // Day Blue Sky
    accent: 'rgba(56, 189, 248, 0.4)',
    mesh: 'radial-gradient(circle at 20% 20%, rgb(225, 237, 58) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)'
  };
  if (hour >= 16 && hour < 18) return { 
    base: '#f43f5e', // Sunset Rose
    accent: 'rgba(244, 229, 22, 0.4)',
    mesh: 'radial-gradient(circle at 20% 20%, rgba(255, 179, 64, 0.7) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.5) 0%, transparent 50%)'
  };
  return { 
    base: '#0f172a', // Midnight Navy
    accent: 'rgba(30, 64, 175, 0.4)',
    mesh: 'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(30, 64, 175, 0.5) 0%, transparent 50%)'
  };
};

const currentTheme = getTheme();

  const playEagleSound = () => {
  audio.currentTime = 0; // Reset ke awal
  audio.play().catch(error => {
    console.log("Gagal main suara:", error);
  });
};


  return (
  <Card className="mb-4 border-0 overflow-hidden" 
      style={{ 
        borderRadius: '40px', 
        background: currentTheme.base, // Fallback color
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.45)',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        transition: 'all 1.2s ease-in-out',
        minHeight: '320px'
      }}>
    <Card.Body className="p-0">
      
      {/* 1. Background Image Layer dengan Overlay Gelap */}
      <div className="position-absolute top-0 start-0 w-100 h-100" 
           style={{ 
             backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8) 5%, rgba(0,0,0,0.2) 100%), url(${bgStaiku})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             zIndex: 0
           }} 
      />

      {/* 2. Glass Shine Effect (Efek Mengkilap Bergerak) */}
      <div className="glass-shine" />

      {/* 3. Grainy Texture Overlay (Tetap dipertahankan untuk kesan estetik) */}
      {/* <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            pointerEvents: 'none', zIndex: 1 
          }} /> */}

      {/* 4. Soft Mesh Lighting (Opsional: kurangi opacity agar foto terlihat) */}
      <div className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: currentTheme.mesh, 
          zIndex: 2,
          opacity: 0.1,
          transition: 'all 1.2s ease-in-out'
        }}
      />

      <div className="position-relative p-4 p-md-5" style={{ zIndex: 10 }}>
        <Row className="align-items-center">
          
          {/* LEFT: Greeting Section */}
          <Col lg={8} className="text-center text-md-start">
            <h1 className="text-white fw-black mb-3" style={{ fontSize: 'calc(2.2rem + 1.8vw)', letterSpacing: '-2px', lineHeight: '1.1', textShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
              {userGreeting},<br />
              <span className="name-gradient">{userName}</span> {userIcon}
            </h1>

            <p className="fs-5 text-white opacity-75 fw-light pe-lg-5 mb-0" style={{ lineHeight: '1.6', maxWidth: '600px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {userMotivation}
            </p>
          </Col>

          {/* RIGHT: University Logo Section */}
          <Col lg={4} className="d-flex justify-content-center justify-content-lg-end mt-4 mt-lg-0">
            <div className="logo-wrapper position-relative">
              <div className="logo-glow" />
              <img 
                src={logoKampus} 
                alt="Logo Kampus"
                style={{ 
                  width: '240px', 
                  height: '240px',
                  objectFit: 'contain',
                  position: 'relative',
                  zIndex: 5,
                  filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))'
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </Card.Body>

    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');

        .fw-black { font-weight: 900; }
        
        /* Efek Kilau Kaca */
        .glass-shine {
          position: absolute;
          top: 0;
          left: -150%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transform: skewX(-20deg);
          animation: shine 8s infinite;
          z-index: 3;
        }

        @keyframes shine {
          0% { left: -150%; }
          20% { left: 150%; }
          100% { left: 150%; }
        }

        /* Name Gradient - Dibuat lebih kontras agar tajam di atas foto */
        .name-gradient {
          background: linear-gradient(to right, #fff 30%, rgba(255,255,255,0.5));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
          z-index: 1;
          animation: logo-pulse 4s ease-in-out infinite;
        }

        @keyframes logo-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
        }

        @media (max-width: 991px) {
          .logo-wrapper img { width: 160px !important; height: 160px !important; }
        }
      `}
    </style>
</Card>
  );
};

const Dashboard1 = () => {
  const [greeting, setGreeting] = useState("");
  const [motivation, setMotivation] = useState("");
  const [balances, setBalances] = useState([]);
  const [filteredBalances, setFilteredBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const { user } = useAuthContext();
  const userName = user?.name || "User";
  const [icon, setIcon] = useState("");

  // 🔹 State untuk Donut Chart - Status Talent
  const [statusDistribusi, setStatusDistribusi] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  // 🔹 State untuk Donut Chart - Jabatan
  const [jabatanDistribusi, setJabatanDistribusi] = useState(null);
  const [jabatanChartLoading, setJabatanChartLoading] = useState(true);

  const motivations = {
    pagi: [
      "Hari baru, peluang baru 🚀, jangan kalah sama malas!",
      "Pagi! Saatnya gas pol dan bikin produktifitas nambah.",
      "Yuk, bangun semangat! Hari ini pasti seru.",
      "Pagi bro/sis! Mari mulai hari dengan vibes positif 🌞💥"
    ],
    siang: [
      "Siang bro/sis! Jangan kalah sama rasa malas.",
      "Halfway there! Stay sharp & finish strong 💪😎",
      "Semangat! masih banyak peluang untuk menyelesaikan yang terbaik.",
      "Gas terus! Siang ini masih banyak yang bisa dicapai."
    ],
    sore: [
      "Terima kasih atas usaha yang sudah kamu berikan hari ini.",
      "Sore guys! Almost done, stay chill tapi finish strong 💪✨",
      "Setiap kontribusimu hari ini sangat berarti.",
      "Sore! Energy mungkin turun, tapi semangat jangan ikut turun 😎."
    ],
    malam: [
      "Kerja kerasmu hari ini patut diapresiasi.",
      "Saatnya mengakhiri hari dengan rasa syukur.",
      "Terima kasih atas dedikasimu hari ini.",
      "Istirahat yang cukup adalah bagian dari produktivitas."
    ]
  };

  const getRandomText = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const filterTidakHadirByMonth = (tidakHadirDetail, targetMonthLabel) => {
    if (!tidakHadirDetail) return [];
    return tidakHadirDetail.filter(detail => {
      if (!detail) return false;
      const detailDate = new Date(detail);
      const detailMonthLabel = detailDate.toLocaleString("id-ID", {
        month: "long",
        year: "numeric"
      });
      return detailMonthLabel === targetMonthLabel;
    });
  };

  // 🔹 Fetch Distribusi Status Talent
  useEffect(() => {
    const fetchStatusDistribusi = async () => {
      try {
        const token = localStorage.getItem("authToken");
        console.log("Mengirim token:", token);
        if (!token) {
          setChartLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/rekap-absen/distribusi-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const data = response.data.data;
          
          const backgroundColors = [
            "#727cf5", "#0acf97", "#fa5c7c", "#ffbc00", 
            "#39afd1", "#6b7280", "#8b5cf6", "#10b981", 
            "#f59e0b", "#ef4444"
          ];

          setStatusDistribusi({
            labels: data.map(item => item.status),
            datasets: [{
              label: 'Jumlah Talent',
              data: data.map(item => item.jumlah),
              backgroundColor: backgroundColors.slice(0, data.length),
              borderColor: 'transparent',
              borderWidth: 1,
            }]
          });
        }
      } catch (err) {
        console.error("❌ Gagal mengambil distribusi status: ", err);
      } finally {
        setChartLoading(false);
      }
    };

    fetchStatusDistribusi();
  }, []);

  // 🔹 Fetch Distribusi Jabatan
  useEffect(() => {
    const fetchJabatanDistribusi = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setJabatanChartLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/rekap-absen/distribusi-jabatan`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const data = response.data.data;
          
          const backgroundColors = [
            "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
            "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1",
            "#f43f5e", "#06b6d4"
          ];

          setJabatanDistribusi({
            labels: data.map(item => item.jabatan),
            datasets: [{
              label: 'Jumlah Talent',
              data: data.map(item => item.jumlah),
              backgroundColor: backgroundColors.slice(0, data.length),
              borderColor: 'transparent',
              borderWidth: 1,
            }]
          });
        }
      } catch (err) {
        console.error("❌ Gagal mengambil distribusi jabatan: ", err);
      } finally {
        setJabatanChartLoading(false);
      }
    };

    fetchJabatanDistribusi();
  }, []);

  // 🔹 Ambil data rekap absen
  useEffect(() => {
    const fetchRekapData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("Token tidak ditemukan. Silakan login ulang.");
          setLoading(false);
          return;
        }

        const rekapRes = await axios.get(`${API_BASE_URL}/rekap-absen/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rekap = rekapRes.data.message || rekapRes.data || [];

        const processedData = rekap.map((r) => ({
          ...r,
          real_name: r.user?.name || r.user_name || "N/A",
          total_telat: parseInt(r.total_telat) || 0,
          tidak_hadir_detail: r.tidak_hadir_detail || []
        }));

        const withMonth = processedData.map((item) => {
          const dateObj = new Date(item.datetime);
          const monthLabel = !isNaN(dateObj)
            ? dateObj.toLocaleString("id-ID", {
                month: "long",
                year: "numeric",
              })
            : "Tidak diketahui";

          return { 
            ...item, 
            monthLabel,
            originalDate: item.datetime,
            dateObj: dateObj
          };
        });

        const months = [
          ...new Set(withMonth.map((item) => item.monthLabel)),
        ].filter((b) => b !== "Tidak diketahui");

        setAvailableMonths(months);

        let defaultMonth = "";
        if (months.length > 0) {
          const sortedByDate = withMonth
            .filter(item => item.monthLabel !== "Tidak diketahui")
            .sort((a, b) => b.dateObj - a.dateObj);
          
          if (sortedByDate.length > 0) {
            defaultMonth = sortedByDate[0].monthLabel;
          }
        } else if (withMonth.length > 0) {
          defaultMonth = withMonth[0].monthLabel;
        }

        setSelectedMonth(defaultMonth);

        const filteredByMonth = withMonth
          .filter((item) => item.monthLabel === defaultMonth && item.total_telat > 0)
          .sort((a, b) => b.total_telat - a.total_telat);

        setBalances(withMonth);
        setFilteredBalances(filteredByMonth);
        
      } catch (err) {
        console.error("❌ Gagal mengambil ", err);
        setError("Gagal memuat data dari server: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRekapData();
  }, []);

  // 🔹 Filter ulang jika bulan berubah
  useEffect(() => {
    if (selectedMonth && balances.length > 0) {
      const newFiltered = balances
        .filter((item) => item.monthLabel === selectedMonth && item.total_telat > 0)
        .sort((a, b) => b.total_telat - a.total_telat);
    
      setFilteredBalances(newFiltered);
    }
  }, [selectedMonth, balances]);

  // 🔹 Greeting + motivasi otomatis
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
      setGreeting("Selamat Pagi");
      setIcon("☀️");
      setMotivation(getRandomText(motivations.pagi));
    } else if (hour >= 11 && hour < 15) {
      setGreeting("Selamat Siang");
      setIcon("🌤️");
      setMotivation(getRandomText(motivations.siang));
    } else if (hour >= 15 && hour < 18) {
      setGreeting("Selamat Sore");
      setIcon("🌇");
      setMotivation(getRandomText(motivations.sore));
    } else {
      setGreeting("Selamat Malam");
      setIcon("🌙");
      setMotivation(getRandomText(motivations.malam));
    }
  }, []);

  // 🔹 Chart Options
  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} talent (${percentage}%)`;
          }
        }
      }
    }
  };

  const calculateTotalTalent = (chartData) => {
    if (!chartData?.datasets?.[0]?.data || !Array.isArray(chartData.datasets[0].data)) {
      return 0;
    }
    return chartData.datasets[0].data.reduce((total, current) => total + current, 0);
  };

  return (
    <>
      {/* GREETING ROW SUDAH DIHAPUS - SUDAH PINDAH KE DALAM CARD */}
      
      {/* 🔹 LIVE CLOCK DENGAN KARAKTER + GREETING & MOTIVASI */}
      <Row className="mt-4 mb-4">
        <Col md={12}>
          <LiveClockWithCharacter 
            userName={userName}
            userGreeting={greeting}
            userIcon={icon}
            userMotivation={motivation}
          />
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p>Memuat data...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          ) : (
            <UsersBalances
              balances={filteredBalances}
              availableMonths={availableMonths}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          )}
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          {!loading && !error && (
            <UsersTidakHadir
              balances={balances}
              availableMonths={availableMonths}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          )}
        </Col>
      </Row>

      {/* 🔹 ROW: DONUT CHARTS HORIZONTAL (Status Talent + Jabatan) */}
      <Row className="mb-4 g-4">
        {/* Kolom 1: Status Talent */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Body className="d-flex flex-column">
              <h4 className="header-title mb-4 text-center">
                Grafik Status Talent
              </h4>
              
              {chartLoading ? (
                <div className="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : !statusDistribusi ? (
                <div className="text-center text-muted py-4 flex-grow-1 d-flex flex-column justify-content-center">
                  <p className="mb-0">Tidak ada data untuk ditampilkan</p>
                </div>
              ) : (
                <>
                  <div className="d-flex flex-column align-items-center flex-grow-1">
                    <div style={{ width: '280px', height: '280px', position: 'relative' }}>
                      <Doughnut 
                        data={statusDistribusi} 
                        options={donutChartOptions} 
                      />
                    </div>
                  </div>
                  
                  <div className="text-center mb-3">
                    <h5 className="text-primary mb-1">
                      Total Semua Talent: <strong>{calculateTotalTalent(statusDistribusi)}</strong>
                    </h5>
                  </div>
                  
                  <StatusSummary data={statusDistribusi} />
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Kolom 2: Jabatan */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Body className="d-flex flex-column">
              <h4 className="header-title mb-4 text-center">
                Grafik Jumlah Jabatan
              </h4>
              
              {jabatanChartLoading ? (
                <div className="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : !jabatanDistribusi ? (
                <div className="text-center text-muted py-4 flex-grow-1 d-flex flex-column justify-content-center">
                  <p className="mb-0">Tidak ada data untuk ditampilkan</p>
                </div>
              ) : (
                <>
                  <div className="d-flex flex-column align-items-center flex-grow-1">
                    <div style={{ width: '280px', height: '280px' }}>
                      <Doughnut 
                        data={jabatanDistribusi} 
                        options={donutChartOptions} 
                      />
                    </div>
                  </div>
                  
                  <StatusSummary data={jabatanDistribusi} />
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

// 🔹 Komponen UsersTidakHadir untuk menampilkan data tidak hadir
const UsersTidakHadir = ({
  balances,
  availableMonths,
  selectedMonth,
  setSelectedMonth,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter data tidak hadir berdasarkan bulan
  const filterTidakHadirByMonth = (tidakHadirDetail, targetMonthLabel) => {
    if (!tidakHadirDetail) return [];
    return tidakHadirDetail.filter(detail => {
      if (!detail) return false;
      const detailDate = new Date(detail);
      const detailMonthLabel = detailDate.toLocaleString("id-ID", {
        month: "long",
        year: "numeric"
      });
      return detailMonthLabel === targetMonthLabel;
    });
  };

  // Format tanggal
  const formatTanggal = (tanggal) => {
    if (!tanggal) return "";
    const date = new Date(tanggal);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Filter balances yang memiliki data tidak hadir
  const tidakHadirBalances = balances.filter(item => 
    filterTidakHadirByMonth(item.tidak_hadir_detail, selectedMonth).length > 0
  );

  const totalPages = rowsPerPage === 'All' ? 1 : Math.ceil(tidakHadirBalances.length / rowsPerPage);
  const indexOfLastRow = rowsPerPage === 'All' ? tidakHadirBalances.length : currentPage * rowsPerPage;
  const indexOfFirstRow = rowsPerPage === 'All' ? 0 : indexOfLastRow - rowsPerPage;
  const currentRows = rowsPerPage === 'All' ? tidakHadirBalances : tidakHadirBalances.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, rowsPerPage]);

  const exportTidakHadirToPDF = () => {
    import('jspdf').then((jsPDFModule) => {
      import('jspdf-autotable').then((autoTableModule) => {
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;

        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text("SISTEM KINERJA - SCI", 105, 15, { align: "center" });

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Laporan Ketidakhadiran Talent", 105, 22, { align: "center" });

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, 28, 190, 28);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Periode: ${selectedMonth}`, 20, 38);

        const tableData = tidakHadirBalances.map((item, idx) => {
          const filteredDetail = filterTidakHadirByMonth(item.tidak_hadir_detail, selectedMonth);
          const detailText = filteredDetail.length > 0
            ? filteredDetail.map((d, i) => 
                `${i + 1}. ${formatTanggal(d)}`
              ).join('\n')
            : "-";

          return [
            idx + 1,
            item.real_name,
            filteredDetail.length.toString(),
            detailText
          ];
        });

        autoTable(doc, {
          startY: 50,
          head: [['No', 'Nama Talent', 'Total', 'Tanggal Tidak Hadir']],
          body: tableData,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 50 },
            2: { cellWidth: 15 },
            3: { cellWidth: 80 },
          },
          headStyles: {
            fillColor: [255, 193, 7],
            textColor: 0,
            fontStyle: "bold"
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          }
        });

        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(9);

        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setTextColor(130);
          doc.text(
            `Sistem Kinerja - SCI • Halaman ${i} dari ${pageCount}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        }

        doc.save(`laporan-tidak-hadir-${selectedMonth.replace(/\s+/g, "-")}.pdf`);
      });
    });
  };

  // return (
  //   <Card className="shadow-sm border-0 mt-4">
  //     <Card.Body>
  //       <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
  //         <div>
  //           <h4 className="header-title mb-1">
  //             Data Tidak Hadir Tanpa Keterangan
  //           </h4>
  //           <p className="text-muted mb-0 small">Periode: {selectedMonth}</p>
  //         </div>

  //         <div className="d-flex align-items-center gap-2">
  //           <Form.Select
  //             size="sm"
  //             value={selectedMonth}
  //             onChange={(e) => setSelectedMonth(e.target.value)}
  //             style={{ width: "200px" }}
  //           >
  //             {availableMonths
  //               .sort((a, b) => new Date(b.replace(' ', ' 1, ')) - new Date(a.replace(' ', ' 1, ')))
  //               .map((bulan, i) => (
  //                 <option key={i} value={bulan}>{bulan}</option>
  //               ))}
  //           </Form.Select>
            
  //           <Button variant="outline-warning" size="sm" onClick={exportTidakHadirToPDF}>
  //             <i className="mdi mdi-file-pdf-outline me-1"></i> PDF
  //           </Button>
  //         </div>
  //       </div>

  //       <div className="d-flex justify-content-between align-items-center mb-3 bg-light p-2 rounded">
  //         <span className="small text-secondary ps-2">
  //           Menampilkan <b>{currentRows.length > 0 ? indexOfFirstRow + 1 : 0}</b> - <b>{Math.min(indexOfLastRow, tidakHadirBalances.length)}</b> dari <b>{tidakHadirBalances.length}</b> talent
  //         </span>
  //         <Form.Select
  //           size="sm"
  //           value={rowsPerPage}
  //           onChange={(e) => setRowsPerPage(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
  //           style={{ width: '150px' }}
  //         >
  //           <option value={10}>10 Baris</option>
  //           <option value={25}>25 Baris</option>
  //           <option value="All">Semua</option>
  //         </Form.Select>
  //       </div>

  //       <div className="table-responsive">
  //         <table className="table table-hover align-middle">
  //           <thead className="table-light">
  //             <tr>
  //               <th className="text-center" style={{ width: '5%' }}>No</th>
  //               <th style={{ width: '25%' }}>Nama Talent</th>
  //               <th style={{ width: '70%' }}>Detail Ketidakhadiran</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {currentRows.length === 0 ? (
  //               <tr>
  //                 <td colSpan={3} className="text-center py-5 text-muted">
  //                   <div className="mb-2 fs-3">📅</div>
  //                   Tidak ada data ketidakhadiran untuk bulan ini.
  //                 </td>
  //               </tr>
  //             ) : (
  //               currentRows.map((item, i) => {
  //                 const filteredDetail = filterTidakHadirByMonth(item.tidak_hadir_detail, selectedMonth);
  //                 return (
  //                   <tr key={item.id || i}>
  //                     <td className="text-center fw-medium text-muted">
  //                       {indexOfFirstRow + i + 1}
  //                     </td>
  //                     <td>
  //                       <div className="fw-bold text-dark">{item.real_name}</div>
  //                     </td>
  //                     <td>
  //                       <div className="d-flex align-items-center gap-3">
  //                         <Badge bg="warning" className="rounded-pill px-3 py-2" style={{ minWidth: '45px' }}>
  //                           {filteredDetail.length}x
  //                         </Badge>
                          
  //                         <div className="d-flex flex-wrap gap-1">
  //                           {filteredDetail.map((tanggal, idx) => {
  //                             const formattedDate = formatTanggal(tanggal);
                              
  //                             return (
  //                               <div 
  //                                 key={idx}
  //                                 className="d-flex flex-column align-items-center border rounded px-2 py-1"
  //                                 style={{ 
  //                                   fontSize: '0.7rem',
  //                                   lineHeight: '1.2',
  //                                   backgroundColor: '#fff3cd',
  //                                   borderColor: '#ffc107',
  //                                   borderLeft: '3px solid #ffc107'
  //                                 }}
  //                               >
  //                                 <i className="mdi mdi-calendar-blank me-1 text-warning"></i>
  //                                 <span className="fw-bold">
  //                                   {formattedDate}
  //                                 </span>
  //                               </div>
  //                             );
  //                           })}
  //                         </div>
  //                       </div>
  //                     </td>
  //                   </tr>
  //                 );
  //               })
  //             )}
  //           </tbody>
  //         </table>
  //       </div>

  //       {totalPages > 1 && (
  //         <div className="d-flex justify-content-center mt-4">
  //           <Pagination size="sm">
  //             <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
  //             <Pagination.Prev onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} />
  //             <Pagination.Item active>{currentPage}</Pagination.Item>
  //             <Pagination.Next onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} />
  //             <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
  //           </Pagination>
  //         </div>
  //       )}
  //     </Card.Body>
  //   </Card>
  // );
};

// 🔹 Komponen StatusSummary (Reusable untuk kedua chart)
const StatusSummary = ({ data }) => {
  const dataset = data?.datasets?.[0];
  
  if (!data?.labels || !Array.isArray(data.labels) || 
      !dataset?.data || !Array.isArray(dataset.data) || 
      data.labels.length === 0 || dataset.data.length === 0) {
    return null;
  }

  const { labels } = data;
  const total = dataset.data.reduce((a, b) => a + b, 0);

  return (
    <div className="mt-3 w-100">
      <div className="row text-center g-2">
        {labels.map((label, idx) => {
          const count = dataset.data[idx] || 0;
          const color = dataset.backgroundColor?.[idx] || '#6b7280';
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          
          return (
            <div key={idx} className="col-6 col-md-4">
              <div className="p-2 bg-light rounded">
                <div className="d-flex align-items-center justify-content-center mb-1">
                  <div 
                    style={{ 
                      width: '10px', 
                      height: '10px', 
                      backgroundColor: color,
                      borderRadius: '50%',
                      display: 'inline-block',
                      marginRight: '6px'
                    }}
                  />
                  <small className="fw-bold">{label}</small>
                </div>
                <div>
                  <span className="h6 fw-bold text-primary">{count}</span>
                  <br />
                  <small className="text-muted">{percentage}%</small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 🔹 Komponen UsersBalances dengan Pagination
const UsersBalances = ({
  balances,
  availableMonths,
  selectedMonth,
  setSelectedMonth,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Helper Functions ---
  const formatTanggalInline = (tanggal) => {
    if (!tanggal) return "";
    const date = new Date(tanggal);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatJamInline = (jam, menit) => {
    return `${String(jam || 0).padStart(2, '0')}.${String(menit || 0).padStart(2, '0')}`;
  };

  const filterDetailByMonth = (telatDetail, targetMonthLabel) => {
    if (!telatDetail) return [];
    return telatDetail.filter(detail => {
      if (!detail.tanggal) return false;
      const detailDate = new Date(detail.tanggal);
      const detailMonthLabel = detailDate.toLocaleString("id-ID", {
        month: "long",
        year: "numeric"
      });
      return detailMonthLabel === targetMonthLabel;
    });
  };

  const filteredBalances = balances.filter(item => 
    filterDetailByMonth(item.telat_detail, selectedMonth).length > 0
  );

  const totalPages = rowsPerPage === 'All' ? 1 : Math.ceil(filteredBalances.length / rowsPerPage);
  const indexOfLastRow = rowsPerPage === 'All' ? filteredBalances.length : currentPage * rowsPerPage;
  const indexOfFirstRow = rowsPerPage === 'All' ? 0 : indexOfLastRow - rowsPerPage;
  const currentRows = rowsPerPage === 'All' ? filteredBalances : filteredBalances.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    setCurrentPage(1);
  }, [balances, selectedMonth, rowsPerPage]);

  const exportToPDF = () => {
    import('jspdf').then((jsPDFModule) => {
      import('jspdf-autotable').then((autoTableModule) => {
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;

        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text("SISTEM KINERJA - SCI", 105, 15, { align: "center" });

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Laporan Rekapitulasi Keterlambatan Talent", 105, 22, { align: "center" });

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, 28, 190, 28);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Periode: ${selectedMonth}`, 20, 38);

        const tableData = balances.map((item, idx) => {
          const filteredDetail = filterDetailByMonth(item.telat_detail, selectedMonth);
          const detailText = filteredDetail.length > 0
            ? filteredDetail.map((d, i) => 
                `${i + 1}. ${formatTanggalInline(d.tanggal)} ${formatJamInline(d.jam_telat, d.menit_telat)}`
              ).join('\n')
            : "-";

          return [
            idx + 1,
            item.real_name,
            filteredDetail.length.toString(),
            detailText
          ];
        });

        autoTable(doc, {
          startY: 50,
          head: [['No', 'Nama Talent', 'Total', 'Detail Keterlambatan']],
          body: tableData,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 50 },
            2: { cellWidth: 15 },
            3: { cellWidth: 80 },
          },
          headStyles: {
            fillColor: [0, 92, 153],
            textColor: 255,
            fontStyle: "bold"
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 3) {
              data.cell.styles.fontSize = 8;
            }
          }
        });

        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(9);

        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setTextColor(130);
          doc.text(
            `Sistem Kinerja - SCI • Halaman ${i} dari ${pageCount}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        }

        doc.save(`laporan-top-terlambat-${selectedMonth.replace(/\s+/g, "-")}.pdf`);
      });
    });
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h4 className="header-title mb-1">Top Terlambat</h4>
            <p className="text-muted mb-0 small">Periode: {selectedMonth}</p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Form.Select
              size="sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: "200px" }}
            >
              {availableMonths
                .sort((a, b) => new Date(b.replace(' ', ' 1, ')) - new Date(a.replace(' ', ' 1, ')))
                .map((bulan, i) => (
                  <option key={i} value={bulan}>{bulan}</option>
                ))}
            </Form.Select>
            
            <Button variant="outline-danger" size="sm" onClick={exportToPDF}>
              <i className="mdi mdi-file-pdf-outline me-1"></i> PDF
            </Button>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3 bg-light p-2 rounded">
          <span className="small text-secondary ps-2">
            Menampilkan <b>{currentRows.length > 0 ? indexOfFirstRow + 1 : 0}</b> - <b>{Math.min(indexOfLastRow, filteredBalances.length)}</b> dari <b>{filteredBalances.length}</b> talent
          </span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
            style={{ width: '150px' }}
          >
            <option value={10}>10 Baris</option>
            <option value={25}>25 Baris</option>
            <option value="All">Semua</option>
          </Form.Select>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-center" style={{ width: '5%' }}>No</th>
                <th style={{ width: '25%' }}>Nama Talent</th>
                <th style={{ width: '70%' }}>Detail Keterlambatan</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-5 text-muted">
                    <div className="mb-2 fs-3">🎉</div>
                    Tidak ada data keterlambatan untuk bulan ini.
                  </td>
                </tr>
              ) : (
                currentRows.map((item, i) => {
                  const filteredDetail = filterDetailByMonth(item.telat_detail, selectedMonth);
                  return (
                    <tr key={item.id || i}>
                      <td className="text-center fw-medium text-muted">
                        {indexOfFirstRow + i + 1}
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{item.real_name}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <Badge bg="danger" className="rounded-pill px-3 py-2" style={{ minWidth: '45px' }}>
                            {filteredDetail.length}x
                          </Badge>
                          
                          <div className="d-flex flex-wrap gap-1">
                            {filteredDetail.map((detail, idx) => {
                              const tanggal = formatTanggalInline(detail.tanggal);
                              const jam = formatJamInline(detail.jam_telat, detail.menit_telat);
                              
                              return (
                                <div 
                                  key={idx}
                                  className="d-flex flex-column align-items-center border rounded bg-light px-1"
                                  style={{ 
                                    fontSize: '0.65rem',
                                    lineHeight: '1.1',
                                    minWidth: '55px',
                                    paddingTop: '2px',
                                    paddingBottom: '2px',
                                    borderLeft: '2px solid #dc3545'
                                  }}
                                >
                                  <span className="text-muted" style={{ fontSize: '0.6rem' }}>
                                    {tanggal}
                                  </span>
                                  <span className="fw-bold text-danger">
                                    {jam}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination size="sm">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
              <Pagination.Prev onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} />
              <Pagination.Item active>{currentPage}</Pagination.Item>
              <Pagination.Next onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} />
              <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default Dashboard1;