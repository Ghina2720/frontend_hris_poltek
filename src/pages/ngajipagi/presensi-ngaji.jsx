import { useState, useEffect, useRef } from "react";
import { Card, Col, Row, Button, Modal, Form, Spinner } from "react-bootstrap";
import { FaEdit, FaTrash, FaFileExcel, FaClipboardList } from "react-icons/fa";
import axios from "axios";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { useAuthContext } from "@/context/useAuthContext.jsx";

import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";

/* ==================== Axios baseURL & Interceptor ==================== */
const ENV = import.meta.env.VITE_ENV;
const BASE_RAW =
  import.meta.env.VITE_API_BASE_URL ||
  (ENV === "production"
    ? import.meta.env.VITE_API_URL_PROD
    : import.meta.env.VITE_API_URL_LOCAL) ||
  "http://127.0.0.1:8000";

const BASE = String(BASE_RAW).replace(/\/+$/, "");
const API_PREFIX = /\/api$/i.test(BASE) ? "" : "/api";

const api = axios.create({ baseURL: BASE });
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("authToken");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

/* ==================== UI: Kolom tabel ==================== */
const sizePerPageList = [
  { text: "5", value: 5 },
  { text: "10", value: 10 },
  { text: "25", value: 25 },
];

const pad2 = (n) => String(n).padStart(2, "0");

/* ==================== Helpers parse Excel (DIMODIFIKASI) ==================== */
function parseExcelSerialToParts(num) {
  const o = XLSX.SSF.parse_date_code(num);
  if (!o) return null;
  const S = Math.floor(o.S ?? 0);
  return { y: o.y, m: o.m, d: o.d, H: o.H, M: o.M, S };
}

function parseDDMMYYYY_HHmmss_toParts(str) {
  if (!str) return null;
  const s = String(str).trim();
  const normal = s
    .replace(/(\d{1,2})\.(\d{2})\.(\d{2})$/, "$1:$2:$3")
    .replace(/(\d{1,2})\.(\d{2})$/, "$1:$2");
  const m = normal.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  const H = parseInt(m[4], 10);
  const M = parseInt(m[5], 10);
  const S = m[6] ? parseInt(m[6], 10) : 0;
  return { y, m: mo, d, H, M, S };
}

function partsToTanggalJam(parts) {
  const tanggal = `${parts.y}-${pad2(parts.m)}-${pad2(parts.d)}`;
  const jam = `${pad2(parts.H)}:${pad2(parts.M)}:${pad2(parts.S)}`;
  return { tanggal, jam };
}

// **PARSER SEDERHANA untuk Ngaji (tidak perlu rules telat)**
function parseSimplePresensiNgajiAllSheets(workbook) {
  console.log("DEBUG: Parsing untuk presensi ngaji");
  const out = [];
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (!rows.length) continue;

    // Cek format Excel (bisa "Name" & "Date/Time" atau "Nama" & "Tanggal")
    const firstRow = rows[0];
    const hasNameDateTime = firstRow.hasOwnProperty("Name") && firstRow.hasOwnProperty("Date/Time");
    const hasNamaTanggal = firstRow.hasOwnProperty("Nama") && firstRow.hasOwnProperty("Tanggal");
    
    if (!hasNameDateTime && !hasNamaTanggal) {
      console.log("Format tidak dikenali, skip sheet:", sheetName);
      continue;
    }

    const nameKey = hasNameDateTime ? "Name" : "Nama";
    const dateKey = hasNameDateTime ? "Date/Time" : "Tanggal";

    const grouped = new Map();
    for (const r of rows) {
      const name = String(r[nameKey] ?? "").trim();
      const raw = r[dateKey];
      if (!name || raw === "" || raw == null) continue;

      let parts = null;
      if (typeof raw === "number") parts = parseExcelSerialToParts(raw);
      if (!parts && typeof raw === "string") {
        parts = parseDDMMYYYY_HHmmss_toParts(raw);
        if (!parts) {
          const d = new Date(raw);
          if (!Number.isNaN(d.getTime())) {
            parts = {
              y: d.getFullYear(),
              m: d.getMonth() + 1,
              d: d.getDate(),
              H: d.getHours(),
              M: d.getMinutes(),
              S: d.getSeconds(),
            };
          }
        }
      }
      if (!parts) continue;

      const { tanggal, jam } = partsToTanggalJam(parts);
      const key = `${name}__${tanggal}`;
      
      // **PERUBAHAN: Status selalu "HADIR" untuk presensi ngaji**
      const cur = grouped.get(key) || {
        id: null,
        nama_absen: name,
        tanggal,
        jam_masuk: "",
        jam_pulang: "",
        status: "HADIR", // SELALU HADIR
        created_at: "",
      };

      if (!cur.jam_masuk) cur.jam_masuk = jam;
      else if (!cur.jam_pulang) cur.jam_pulang = jam;

      // **TIDAK ADA LOGIKA TELAT** - status tetap "HADIR"
      grouped.set(key, cur);
    }
    out.push(...Array.from(grouped.values()));
  }
  return out;
}

// **PARSER VENDOR untuk Ngaji (dimodifikasi)**
function parseVendorAttendanceNgaji(workbook) {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  
  // Cari header tanggal (1..31)
  const range = XLSX.utils.decode_range(ws["!ref"]);
  let dayHeaderRow = null;
  
  for (let r = 0; r <= range.e.r; r++) {
    const nums = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      const v = String(cell.v ?? "").trim();
      if (/^\d{1,2}(\.0)?$/.test(v)) nums.push(parseInt(v));
    }
    if (nums.length >= 5 && nums[0] === 1) {
      dayHeaderRow = r;
      break;
    }
  }
  
  if (dayHeaderRow == null) {
    throw new Error("Header tanggal (1..31) tidak ditemukan.");
  }

  // Ekstrak tahun & bulan dari teks di header
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  
  // Coba cari tahun & bulan dari teks di atas header
  for (let r = 0; r < dayHeaderRow; r++) {
    for (let c = 0; c <= Math.min(10, range.e.c); c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.v) {
        const text = String(cell.v);
        const m = text.match(/(\d{4})[\/\-](\d{1,2})/);
        if (m) {
          year = parseInt(m[1]);
          month = parseInt(m[2]);
          break;
        }
      }
    }
  }

  const dayCols = [];
  for (let c = 0; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: dayHeaderRow, c })];
    const v = String(cell?.v ?? "").trim();
    if (/^\d{1,2}(\.0)?$/.test(v)) {
      dayCols.push({ col: c, day: parseInt(v) });
    }
  }

  const records = [];
  let currentName = null;

  // Helper: extract name dari row
  const extractNameFromRow = (rowIdx) => {
    for (let c = 0; c <= Math.min(12, range.e.c); c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: rowIdx, c })];
      if (!cell) continue;
      const v = String(cell.v ?? "").trim().toLowerCase();
      if (v === "nama:" || v === "nama" || v === "name") {
        for (let k = c + 1; k <= c + 5 && k <= range.e.c; k++) {
          const right = ws[XLSX.utils.encode_cell({ r: rowIdx, c: k })];
          if (right && String(right.v ?? "").trim()) {
            return String(right.v).trim();
          }
        }
      }
    }
    return null;
  };

  // Helper: split jam masuk/pulang
  const splitTimes = (raw) => {
    if (!raw) return [null, null];
    const s = String(raw).replace(/\s+/g, "");
    const m = s.match(/(\d{1,2}:\d{2})(?:.*?(\d{1,2}:\d{2}))?/);
    if (!m) return [null, null];
    return [m[1] || null, m[2] || null];
  };

  for (let r = dayHeaderRow + 1; r <= range.e.r; r++) {
    const maybeName = extractNameFromRow(r);
    if (maybeName) {
      currentName = maybeName;
      continue;
    }
    if (!currentName) continue;

    let hasAnyTime = false;
    const perDay = [];
    
    for (const { col, day } of dayCols) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: col })];
      const raw = cell?.v;
      if (!raw || String(raw).trim() === "" || String(raw).toLowerCase() === "nan") {
        perDay.push({ day, in: null, out: null });
        continue;
      }
      const [tIn, tOut] = splitTimes(raw);
      if (tIn || tOut) hasAnyTime = true;
      perDay.push({ day, in: tIn, out: tOut });
    }

    if (!hasAnyTime) continue;
    
    for (const d of perDay) {
      if (!d.in && !d.out) continue;
      const tanggal = `${year}-${pad2(month)}-${pad2(d.day)}`;
      
      // **PERUBAHAN: Status selalu "HADIR"**
      records.push({
        id: null,
        nama_absen: currentName,
        tanggal,
        jam_masuk: d.in || "",
        jam_pulang: d.out || "",
        status: "HADIR", // SELALU HADIR
        created_at: "",
      });
    }
  }
  return records;
}

function parseExcelAutoNgaji(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  try {
    const v = parseVendorAttendanceNgaji(wb);
    if (v.length) {
      console.log("DEBUG: Parsing vendor format, ditemukan", v.length, "records");
      return v;
    }
  } catch (e) {
    console.log("DEBUG: Parsing vendor gagal, coba simple format:", e.message);
  }
  
  const simple = parseSimplePresensiNgajiAllSheets(wb);
  console.log("DEBUG: Parsing simple format, ditemukan", simple.length, "records");
  return simple;
}

/* ==================== Komponen PresensiNgaji ==================== */
const PresensiNgaji = () => {
  const { hasPermission } = useAuthContext(); 
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const fileInputRef = useRef(null);

  // Filter state
  const [selectedBulan, setSelectedBulan] = useState("");
  const [selectedTahun, setSelectedTahun] = useState("");

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [formData, setFormData] = useState({
    nama_absen: "",
    tanggal: "",
    jam_masuk: "",
    jam_pulang: "",
    status: "HADIR" // Default HADIR
  });

  // Loading state untuk import Excel
  const [isImporting, setIsImporting] = useState(false);

  // Rekap
  const now = new Date();
  const [showRekap, setShowRekap] = useState(false);
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  // Hapus
  const [showHapus, setShowHapus] = useState(false);
  const [hapusValue, setHapusValue] = useState("ALL");

  // Kolom tabel dengan fungsi edit (DIMODIFIKASI)
  const columns = [
    { Header: "Nama", accessor: "nama_absen", sort: true },
    { Header: "Tanggal", accessor: "tanggal", sort: true },
    { Header: "Jam Masuk", accessor: "jam_masuk", sort: true },
    { Header: "Jam Pulang", accessor: "jam_pulang", sort: true },
    { 
      Header: "Status", 
      accessor: "status", 
      sort: true,
      Cell: ({ value }) => (
        <span className={`badge bg-${value === 'HADIR' ? 'success' : 'secondary'}`}>
          {value}
        </span>
      )
    },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        // Cek permission update - ganti permission name sesuai kebutuhan
        const canUpdate = hasPermission("presensi-ngaji.update") || hasPermission("absen-list.update");
        
        // Jika tidak ada permission, tampilkan "-"
        if (!canUpdate) {
          return <span className="text-muted">-</span>;
        }
        
        return (
          <div className="d-flex gap-2">
            <FaEdit
              className="text-warning"
              style={{ cursor: "pointer" }}
              onClick={() => handleEdit(row.original)}
              title="Edit"
            />
          </div>
        );
      },
    },
  ];

  const fetchData = () => {
    api
      .get(`${API_PREFIX}/presensi-ngaji`)
      .then((res) => {
        const data = res?.data?.message ?? [];
        setData(data);
        setFilteredData(data);
      })
      .catch((err) => console.error("Gagal fetch data presensi ngaji", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data berdasarkan bulan dan tahun
  useEffect(() => {
    let result = data;
    
    if (selectedBulan) {
      result = result.filter(item => {
        if (!item.tanggal) return false;
        const itemBulan = new Date(item.tanggal).getMonth() + 1;
        return itemBulan === parseInt(selectedBulan);
      });
    }
    
    if (selectedTahun) {
      result = result.filter(item => {
        if (!item.tanggal) return false;
        const itemTahun = new Date(item.tanggal).getFullYear();
        return itemTahun === parseInt(selectedTahun);
      });
    }
    
    setFilteredData(result);
  }, [data, selectedBulan, selectedTahun]);

  const uploadFileFallback = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`${API_PREFIX}/presensi-ngaji/import-excel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const buf = await file.arrayBuffer();
      const rows = parseExcelAutoNgaji(buf);

      if (!rows.length) {
        console.warn("Tidak ada data yang bisa diparsing, coba fallback");
        await uploadFileFallback(file);
        alert("Import sukses (fallback).");
        fetchData();
        return;
      }

      console.log("DEBUG: Data yang akan diimport:", rows.slice(0, 3));

      // Kirim ke backend
      try {
        await api.post(`${API_PREFIX}/presensi-ngaji/import-json`, rows);
        alert(`Import sukses. data berhasil diproses.`);
        fetchData();
      } catch (jsonErr) {
        console.warn("Import JSON gagal, fallback upload file:", jsonErr?.message);
        await uploadFileFallback(file);
        alert("Import selesai (fallback).");
        fetchData();
      }
    } catch (err) {
      console.error("Gagal import excel (parse/upload):", err);
      alert("Gagal import excel! Periksa format file.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /* ================== EDIT ================== */
  const handleEdit = (data) => {
    setEditingData(data);
    setFormData({
      nama_absen: data.nama_absen || "",
      tanggal: data.tanggal || "",
      jam_masuk: data.jam_masuk || "",
      jam_pulang: data.jam_pulang || "",
      status: data.status || "HADIR"
    });
    setShowEdit(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    if (!editingData?.id) {
      alert("Data tidak valid untuk diupdate");
      return;
    }

    try {
      // Validasi form
      if (!formData.nama_absen.trim()) {
        alert("Nama tidak boleh kosong");
        return;
      }
      if (!formData.tanggal) {
        alert("Tanggal tidak boleh kosong");
        return;
      }

      // Update data
      await api.put(`${API_PREFIX}/presensi-ngaji/${editingData.id}`, formData);
      
      alert("Data berhasil diupdate");
      setShowEdit(false);
      setEditingData(null);
      fetchData();
    } catch (err) {
      console.error("Gagal update data:", err?.response?.data ?? err);
      alert("Gagal update data! Lihat console.");
    }
  };

  /* ================== HAPUS ================== */
  const openHapusModal = () => {
    if (bulanTahunList.length) {
      setHapusValue(bulanTahunList[0].key);
    } else {
      setHapusValue("ALL");
    }
    setShowHapus(true);
  };

  const handleHapus = async () => {
    try {
      if (hapusValue === "ALL") {
        await api.delete(`${API_PREFIX}/presensi-ngaji`);
        alert("Semua data berhasil dihapus.");
      } else {
        const [y, m] = hapusValue.split("-");
        await api.delete(`${API_PREFIX}/presensi-ngaji`, {
          data: { bulan: Number(m), tahun: Number(y) },
        });
        alert(
          `Data bulan ${new Date(y, m - 1).toLocaleString("id-ID", {
            month: "long",
          })} ${y} dihapus.`
        );
      }
      setShowHapus(false);
      fetchData();
    } catch (err) {
      console.error("Gagal hapus data:", err?.response?.data ?? err);
      alert("Gagal hapus data! Lihat console.");
    }
  };

  
  /* ================== REKAP NGAJI (Simpan ke tabel) ================== */
  const handleProsesRekap = async () => {
    try {
      const res = await api.post(`${API_PREFIX}/rekap-ngaji/rekap`, {
        bulan,
        tahun,
      });
      
      if (res.data?.success) {
        alert(`Rekap ngaji berhasil!`);
        setShowRekap(false);
        
        
    
        
        fetchData(); // Refresh data presensi
      } else {
        alert("Rekap gagal: " + (res.data?.message ?? "Unknown error"));
      }
    } catch (err) {
      console.error("Gagal rekap:", err.response?.data ?? err.message ?? err);
      alert("Gagal rekap: " + (err.response?.data?.message || err.message || "Lihat console untuk detail"));
    }
  };

  /* ================== Bulan–Tahun dari data ================== */
  const bulanTahunList = Array.from(
    new Set(
      data
        .map((item) => {
          if (!item.tanggal) return null;
          const d = new Date(item.tanggal);
          if (isNaN(d)) return null;
          const b = d.getMonth() + 1;
          const y = d.getFullYear();
          return `${y}-${String(b).padStart(2, "0")}`;
        })
        .filter(Boolean)
    )
  )
    .map((val) => {
      const [y, m] = val.split("-");
      return {
        label: `${new Date(y, m - 1).toLocaleString("id-ID", { month: "long" })} ${y}`,
        value: { bulan: Number(m), tahun: Number(y) },
        key: `${y}-${m}`,
      };
    })
    .sort((a, b) => (a.key < b.key ? 1 : -1));

  // Get unique bulan dan tahun untuk filter
  const uniqueBulan = Array.from(new Set(
    data
      .map(item => {
        if (!item.tanggal) return null;
        return new Date(item.tanggal).getMonth() + 1;
      })
      .filter(Boolean)
  )).sort((a, b) => a - b);

  const uniqueTahun = Array.from(new Set(
    data
      .map(item => {
        if (!item.tanggal) return null;
        return new Date(item.tanggal).getFullYear();
      })
      .filter(Boolean)
  )).sort((a, b) => b - a);

  // Sinkronisasi default rekap selection ke data terbaru
  useEffect(() => {
    if (!bulanTahunList.length) return;
    const exists = bulanTahunList.some(
      (bt) => bt.value.bulan === Number(bulan) && bt.value.tahun === Number(tahun)
    );
    if (!exists) {
      setBulan(bulanTahunList[0].value.bulan);
      setTahun(bulanTahunList[0].value.tahun);
    }
  }, [data]);

  // Reset filter
  const handleResetFilter = () => {
    setSelectedBulan("");
    setSelectedTahun("");
  };

  // Permission untuk presensi ngaji (sesuaikan dengan backend)
  const canCreate = hasPermission("presensi-ngaji.create") || hasPermission("absen-list.create");
  const canDelete = hasPermission("presensi-ngaji.delete") || hasPermission("absen-list.delete");

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <PageTitle title={"Presensi Ngaji"} />
      <Row>
        <Col>
          <Card>
            <Card.Body>
              {/* Header Section - Title kiri, tombol kanan */}
              <Row className="mb-3">
                <Col md={6}>
                  <h4 className="header-title">Data Presensi Ngaji</h4>
                  <p className="text-muted">Catatan kehadiran kegiatan ngaji</p>
                </Col>
                <Col md={6}>
                  <div className="d-flex gap-2 justify-content-end">
                    {canCreate && (
                      <Button 
                        variant="success" 
                        onClick={() => fileInputRef.current.click()}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FaFileExcel className="me-2" /> Import Excel
                          </>
                        )}
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        variant="danger"
                        onClick={openHapusModal}
                        title={
                          bulanTahunList.length
                            ? "Hapus per-bulan atau semua"
                            : "Hapus semua data"
                        }
                        disabled={isImporting}
                      >
                        <FaTrash className="me-2" /> Hapus
                      </Button>
                    )}

                    {canCreate && (
                      <Button
                        variant="info"
                        onClick={() => setShowRekap(true)}
                        disabled={!bulanTahunList.length || isImporting}
                        title={bulanTahunList.length ? "Rekap data" : "Belum ada data untuk direkap"}
                      >
                        <FaClipboardList className="me-2" /> Rekap
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Loading Overlay saat Import */}
              {isImporting && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75" style={{zIndex: 1050}}>
                  <div className="text-center bg-white p-4 rounded shadow">
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-2 fw-bold">Memproses file Excel...</div>
                    <small className="text-muted">Harap tunggu</small>
                  </div>
                </div>
              )}

              {/* Filter Section */}
              <Row className="mb-3">
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Filter Bulan</Form.Label>
                    <Form.Select
                      value={selectedBulan}
                      onChange={(e) => setSelectedBulan(e.target.value)}
                      disabled={isImporting}
                    >
                      <option value="">Semua Bulan</option>
                      {uniqueBulan.map(bulan => (
                        <option key={bulan} value={bulan}>
                          {new Date(2000, bulan - 1).toLocaleString('id-ID', { month: 'long' })}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Filter Tahun</Form.Label>
                    <Form.Select
                      value={selectedTahun}
                      onChange={(e) => setSelectedTahun(e.target.value)}
                      disabled={isImporting}
                    >
                      <option value="">Semua Tahun</option>
                      {uniqueTahun.map(tahun => (
                        <option key={tahun} value={tahun}>
                          {tahun}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleResetFilter}
                    disabled={isImporting || (!selectedBulan && !selectedTahun)}
                  >
                    Reset Filter
                  </Button>
                </Col>
              </Row>

              {/* Info Summary */}
              <Row className="mb-3">
                <Col>
                  
                    <small>
                      <strong>Info:</strong> Sistem presensi ngaji mencatat kehadiran saja. 
                      Status selalu "HADIR" jika ada data presensi.
                    </small>
                  
                </Col>
              </Row>

              <Table
                columns={columns}
                data={filteredData}
                pageSize={5}
                sizePerPageList={sizePerPageList}
                isSortable
                pagination
                isSearchable
                searchPlaceholder="Cari nama atau tanggal..."
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= Modal Edit Presensi Ngaji ================= */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Data Presensi Ngaji</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Peserta</Form.Label>
              <Form.Control
                type="text"
                name="nama_absen"
                value={formData.nama_absen}
                onChange={handleFormChange}
                placeholder="Masukkan nama"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tanggal Ngaji</Form.Label>
              <Form.Control
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleFormChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Jam Masuk</Form.Label>
                  <Form.Control
                    type="time"
                    name="jam_masuk"
                    value={formData.jam_masuk}
                    onChange={handleFormChange}
                  />
                  <Form.Text className="text-muted">
                    Kosongkan jika tidak ada
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Jam Pulang</Form.Label>
                  <Form.Control
                    type="time"
                    name="jam_pulang"
                    value={formData.jam_pulang}
                    onChange={handleFormChange}
                  />
                  <Form.Text className="text-muted">
                    Kosongkan jika tidak ada
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Status Kehadiran</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                required
              >
                <option value="HADIR">HADIR</option>
                <option value="TIDAK_HADIR">TIDAK HADIR</option>
                {/* Sesuaikan dengan backend */}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Update Data
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= Modal Rekap Presensi Ngaji ================= */}
      <Modal show={showRekap} onHide={() => setShowRekap(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rekap Presensi Ngaji</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Pilih Bulan &amp; Tahun</Form.Label>
              <Form.Select
                value={`${tahun}-${String(bulan).padStart(2, "0")}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split("-");
                  setBulan(Number(m));
                  setTahun(Number(y));
                }}
              >
                {bulanTahunList.map((bt) => (
                  <option
                    key={`${bt.value.tahun}-${String(bt.value.bulan).padStart(2, "0")}`}
                    value={`${bt.value.tahun}-${String(bt.value.bulan).padStart(2, "0")}`}
                  >
                    {bt.label}
                  </option>
                ))}
              </Form.Select>
              {!bulanTahunList.length && (
                <div className="alert alert-warning mt-2 p-2">
                  <small>Belum ada data presensi. Import data terlebih dahulu.</small>
                </div>
              )}
            </Form.Group>
            
            {bulanTahunList.length > 0 && (
              <div className="mt-3">
                <div className="alert alert-info p-2">
                  <small>
                    <strong>Catatan:</strong> Rekap akan menghitung jumlah hadir per peserta 
                    dan menghasilkan file Excel.
                  </small>
                </div>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRekap(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleProsesRekap} 
            disabled={!bulanTahunList.length}
          >
            Proses Rekap
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= Modal Hapus Data ================= */}
      <Modal show={showHapus} onHide={() => setShowHapus(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hapus Data Presensi Ngaji</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Pilih Periode</Form.Label>
              <Form.Select 
                value={hapusValue} 
                onChange={(e) => setHapusValue(e.target.value)}
              >
                <option value="ALL">— Semua Data —</option>
                {bulanTahunList.map((bt) => (
                  <option key={bt.key} value={bt.key}>
                    {bt.label}
                  </option>
                ))}
              </Form.Select>
              <div className="mt-3 alert alert-warning p-2">
                <small>
                  <strong>PERHATIAN:</strong> Tindakan ini akan menghapus data secara permanen. 
                  Data yang sudah dihapus tidak dapat dikembalikan.
                </small>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHapus(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleHapus}>
            Ya, Hapus Data
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PresensiNgaji;