import { useEffect, useState } from "react";
import { Card, Col, Row, Form, Alert, Button } from "react-bootstrap";

// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const columns = [
  { Header: "Holding", accessor: "holding", sort: true },
  { Header: "Nama", accessor: "nama_user", sort: true },
  { Header: "Completed Projects", accessor: "projects_done", sort: true },
];

const sizePerPageList = [
  { text: "5", value: 5 },
  { text: "10", value: 10 },
  { text: "25", value: 25 },
  { text: "All", value: 9999 },
];

const Advanced = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false); // State untuk status sync

  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" }
  ];

  const handleExportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    // Title
    doc.setFontSize(14);
    doc.text(
      `Rekap Completed Projects\n${getMonthName(selectedMonth)} ${selectedYear}`,
      105,
      15,
      { align: "center" }
    );

    const tableBody = [];

    rows.forEach((row) => {
      // Baris Holding
      if (row.isHeader) {
        tableBody.push([
          {
            content: row.holding,
            colSpan: 3,
            styles: {
              fillColor: [220, 220, 220],
              fontStyle: "bold",
              halign: "left",
            },
          },
        ]);
      } else {
        tableBody.push([
          "",
          row.nama_user,
          row.projects_done.toString(),
        ]);
      }
    });

    autoTable(doc, {
      startY: 30,
      head: [["Holding", "Nama", "Completed Projects"]],
      body: tableBody,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: 255,
      },
      theme: "grid",
    });

    doc.save(`Rekap_Syntask_${getMonthName(selectedMonth)}_${selectedYear}.pdf`);
  };

  // Generate tahun dari 2023 sampai tahun depan
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  useEffect(() => {
    loadData(selectedMonth, selectedYear); // Gunakan loadData yang baru
  }, []);

  // Fungsi untuk sync data terbaru sebelum fetch
  const syncLatestData = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem("authToken");
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      
      // Sync data terbaru dari board ke rekap_syntask
      console.log('🔄 Syncing data terbaru...');
      const response = await fetch(`${API_BASE}/rekap-syntask/generate-monthly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Data telah di-sync:', result.message);
        return true;
      } else {
        console.warn('⚠️ Sync data gagal:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  // Fungsi manual sync (untuk tombol)
  const handleManualSync = async () => {
    if (window.confirm('Sync data terbaru dari board ke rekap?')) {
      const success = await syncLatestData();
      if (success) {
        alert('✅ Data berhasil di-sync!');
        // refresh data setelah sync
        fetchData(selectedMonth, selectedYear);
      } else {
        alert('❌ Gagal sync data. Coba lagi.');
      }
    }
  };


  // Fungsi load data yang menggabungkan sync + fetch
  const loadData = async (month, year) => {
    setLoading(true);
    await fetchData(month, year); // Hanya fetch
  };

  const fetchData = async (month, year) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      const API_BASE = import.meta.env.VITE_API_BASE_URL;

      // Gunakan endpoint summary
      const response = await fetch(`${API_BASE}/rekap-syntask/summary?month=${month}&year=${year}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error("Unauthorized: Token invalid atau expired");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data");
      }

      // Transform data dari API ke format tabel
      const rekap = [];
      
      // Jika data kosong
      if (!result.data || Object.keys(result.data).length === 0) {
        setRows([]);
        setError(`Tidak ada data untuk ${getMonthName(month)} ${year}`);
        return;
      }

      // Proses data yang sudah di-grouping oleh API
      Object.entries(result.data).forEach(([holdingName, users]) => {
        // Baris holding (judul)
        rekap.push({
          holding: holdingName,
          nama_user: "",
          isHeader: true,
          projects_done: "",
        });

        // Baris User dalam holding
        users.forEach((user) => {
          rekap.push({
            holding: "",
            nama_user: user.user_name,
            projects_done: user.projects_done || 0,
          });
        });
      });

      setRows(rekap);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Terjadi kesalahan saat mengambil data");
      
      // 🔥 Fallback: Cek apakah endpoint summary tidak ada atau data kosong
      if (err.message.includes("404") || err.message.includes("Not Found") || err.message.includes("Tidak ada data")) {
        console.log("Endpoint summary tidak tersedia atau data kosong, hitung ulang dari checklist...");
        // Langsung hitung ulang dari checklist
        await calculateHistoricalData(month, year);
      }
    } finally {
      setLoading(false);
    }
  };

 
  // Fallback ke metode lama jika endpoint baru belum tersedia
  const fetchFallbackData = async (month, year) => {
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE = import.meta.env.VITE_API_BASE_URL;

      // 🔥 CEK APAKAH BULAN INI ADALAH BULAN BERJALAN
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const isCurrentMonth = (month === currentMonth && year === currentYear);

      // 🔥 JIKA BUKAN BULAN BERJALAN, LANGSUNG HITUNG ULANG DARI CHECKLIST
      if (!isCurrentMonth) {
        console.log(`📅 Bukan bulan berjalan, hitung ulang dari checklist...`);
        await calculateHistoricalData(month, year);
        return;
      }

      // 🔥 JIKA BULAN BERJALAN, GUNAKAN DATA DARI BOARD (LEBIH CEPAT)
      console.log(`📅 Bulan berjalan, gunakan data dari board...`);

      // 1. Fetch semua boards
      const boardsRes = await fetch(`${API_BASE}/board`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const boards = await boardsRes.json();

      // 2. Fetch users data
      const usersRes = await fetch(`${API_BASE}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const users = await usersRes.json();

      // 3. Grouping by holding
      const grouped = {};
      users.forEach((u) => {
        const holdingName = u.holding?.name || "Tanpa Holding";

        if (!grouped[holdingName]) {
          grouped[holdingName] = [];
        }

        // Cari board untuk user ini
        const userBoard = boards.find(board => board.user_id === u.id);
        
        grouped[holdingName].push({
          ...u,
          projects_done: userBoard?.projects_done_monthly || 0
        });
      });

      // 4. Generate tabel rekap
      const rekap = [];

      Object.keys(grouped).forEach((holdingName) => {
        // Baris holding (judul)
        rekap.push({
          holding: holdingName,
          nama_user: "",
          isHeader: true,
          projects_done: "",
        });

        // Baris User dalam holding
        grouped[holdingName].forEach((u) => {
          rekap.push({
            holding: "",
            nama_user: u.name,
            projects_done: u.projects_done,
          });
        });
      });

      setRows(rekap);
      setError(null);
      
    } catch (err) {
      console.error("Error fetching fallback data:", err);
      setError("Gagal mengambil data. Periksa koneksi Anda.");
    }
  };

  // Tambahkan fungsi ini setelah fetchFallbackData
  const calculateHistoricalData = async (month, year) => {
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE = import.meta.env.VITE_API_BASE_URL;

      console.log(`🔄 Menghitung ulang data historis untuk ${getMonthName(month)} ${year}...`);

      // Hitung ulang dari checklist
      const response = await fetch(`${API_BASE}/board/calculate-historical`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          month: month,
          year: year
        })
      });

      if (response.status === 401) {
        throw new Error("Unauthorized: Token invalid atau expired");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal menghitung data historis");
      }

      // Transform data ke format tabel
      const rekap = [];

      // Jika data kosong
      if (!result.data || Object.keys(result.data).length === 0) {
        setRows([]);
        setError(`Tidak ada data untuk ${getMonthName(month)} ${year}`);
        return;
      }

      // Proses data yang sudah di-grouping
      Object.entries(result.data).forEach(([holdingName, users]) => {
        // Baris holding (judul)
        rekap.push({
          holding: holdingName,
          nama_user: "",
          isHeader: true,
          projects_done: "",
        });

        // Baris User dalam holding
        users.forEach((user) => {
          rekap.push({
            holding: "",
            nama_user: user.user_name,
            projects_done: user.projects_done || 0,
          });
        });
      });

      setRows(rekap);
      setError(null);
      console.log(`✅ Berhasil menghitung ulang ${result.total_users} user`);

    } catch (err) {
      console.error("Error calculating historical data:", err);
      setError(err.message || "Terjadi kesalahan saat menghitung data historis");
      
      // Jika endpoint calculate-historical belum ada, fallback ke metode lama
      if (err.message.includes("404") || err.message.includes("Not Found")) {
        console.log("Endpoint calculate-historical belum tersedia, fallback ke metode lama...");
        fetchFallbackData(month, year);
      }
    }
  };

  const handleMonthChange = (e) => {
    const month = parseInt(e.target.value);
    setSelectedMonth(month);
    loadData(month, selectedYear); // Gunakan loadData, bukan fetchData
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    loadData(selectedMonth, year); // Gunakan loadData, bukan fetchData
  };

  const getMonthName = (monthNumber) => {
    return months.find(m => m.value === monthNumber)?.label || "";
  };

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Rekap My Task", path: "/features/tables/advanced", active: true },
        ]}
        title={"Rekap My Task Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title mb-0">
                  Rekap Completed Projects ({getMonthName(selectedMonth)} {selectedYear})
                </h4>
                
                <div className="d-flex gap-2">
                  <Form.Select 
                    value={selectedMonth} 
                    onChange={handleMonthChange}
                    style={{ width: '150px' }}
                    disabled={loading || syncing}
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </Form.Select>
                  
                  <Form.Select 
                    value={selectedYear} 
                    onChange={handleYearChange}
                    style={{ width: '120px' }}
                    disabled={loading || syncing}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Form.Select>

                  <button
                    className="btn btn-warning"
                    onClick={handleManualSync}
                    disabled={loading || syncing}
                  >
                    {syncing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <i className="mdi mdi-sync me-1"></i>
                        Sync Data
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={handleExportPDF}
                    disabled={loading || syncing || rows.length === 0}
                  >
                    <i className="mdi mdi-file-pdf-outline me-1"></i>
                    Export PDF
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="warning" className="mb-3">
                  <i className="mdi mdi-alert-circle-outline me-2"></i>
                  {error}
                </Alert>
              )}

              {(loading || syncing) ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">
                    {syncing ? 'Menyinkronkan data terbaru...' : 'Memuat data completed projects...'}
                  </p>
                </div>
              ) : (
                <>
                  {rows.length === 0 && !error ? (
                    <Alert variant="info">
                      <div className="text-center py-4">
                        <i className="mdi mdi-information-outline fs-1 text-info"></i>
                        <h5 className="mt-3">Data Kosong</h5>
                        <p>
                          Tidak ada data completed projects untuk {getMonthName(selectedMonth)} {selectedYear}.
                        </p>
                        <Button 
                          variant="primary" 
                          onClick={() => loadData(selectedMonth, selectedYear)}
                          className="mt-2"
                        >
                          <i className="mdi mdi-refresh me-1"></i>
                          Coba Muat Ulang
                        </Button>
                      </div>
                    </Alert>
                  ) : (
                    <>
                      {syncing && (
                        <Alert variant="info" className="mb-3">
                          <i className="mdi mdi-sync me-2"></i>
                          Data sedang di-sync dengan nilai terbaru dari board...
                        </Alert>
                      )}
                      <Table
                        columns={columns}
                        data={rows}
                        pageSize={5}
                        sizePerPageList={sizePerPageList}
                        isSortable={true}
                        pagination={true}
                        isSearchable={true}
                      />
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Advanced;