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

/* ==================== Helpers parse Excel ==================== */
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

function findDayHeaderRow(sheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (let r = 0; r <= range.e.r; r++) {
    const nums = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      const v = String(cell.v ?? "").trim();
      if (/^\d{1,2}(\.0)?$/.test(v)) nums.push(parseInt(v));
    }
    if (nums.length >= 5 && nums[0] === 1) return r;
  }
  return null;
}

function extractYearMonth(workbook, dayHeaderRow) {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws["!ref"]);
  let text = "";
  for (let r = 0; r <= Math.min(dayHeaderRow ?? 8, range.e.r); r++) {
    for (let c = 0; c <= Math.min(40, range.e.c); c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.v) text += " " + String(cell.v);
    }
  }
  const m = text.match(/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  const start = new Date(m[1]);
  return { year: start.getFullYear(), month: start.getMonth() + 1 };
}

function extractNameFromRow(sheet, rowIdx) {
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (let c = 0; c <= Math.min(12, range.e.c); c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c })];
    if (!cell) continue;
    const v = String(cell.v ?? "").trim().toLowerCase();
    if (v === "nama:" || v === "nama") {
      for (let k = c + 1; k <= c + 5 && k <= range.e.c; k++) {
        const right = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: k })];
        if (right && String(right.v ?? "").trim()) return String(right.v).trim();
      }
    }
  }
  return null;
}

function splitTimes(raw) {
  if (!raw) return [null, null];
  
  if (typeof raw === 'number' && raw < 1) {
    const totalSeconds = Math.floor(raw * 24 * 3600);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return [`${pad2(hours)}:${pad2(minutes)}`, null];
  }

  const s = String(raw).replace(/\s+/g, "");
  const matches = [...s.matchAll(/(\d{1,2}):(\d{2})/g)];
  
  if (matches.length >= 2) {
    const first = matches[0][0];
    const last = matches[matches.length - 1][0];
    return [first, last];
  }
  
  const m = s.match(/(\d{1,2}:\d{2})(?:.*?(\d{1,2}:\d{2}))?/);
  return m ? [m[1] || null, m[2] || null] : [null, null];
}

/* ==================== Komponen ==================== */
const Advanced = () => {
  const { hasPermission } = useAuthContext(); 
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const fileInputRef = useRef(null);

  const [rules, setRules] = useState(null);
  const [periodeList, setPeriodeList] = useState([]); // 🔥 State untuk periode khusus

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
    status: ""
  });

  // Loading state untuk import Excel
  const [isImporting, setIsImporting] = useState(false);

  // 🔥 Fungsi untuk mendapatkan rules berdasarkan tanggal
  // 
  
  // 🔥 Fungsi untuk mendapatkan rules berdasarkan tanggal
  const getRulesForDate = (tanggal) => {
    if (!tanggal || !periodeList.length) return rules;

    const tanggalBersih = tanggal.split('T')[0];
    
    // Cari SEMUA periode yang mencakup tanggal ini
    const periodeYangCocok = periodeList.filter(p => {
      const mulai = p.tanggal_mulai.split('T')[0];
      const selesai = p.tanggal_selesai.split('T')[0];
      return tanggalBersih >= mulai && tanggalBersih <= selesai;
    });
    
    if (periodeYangCocok.length === 0) return rules;
    
    // 🔥 PRIORITAS: Periode dengan rentang TERSEMPIT (paling spesifik)
    if (periodeYangCocok.length > 1) {
      periodeYangCocok.sort((a, b) => {
        const rentangA = new Date(a.tanggal_selesai) - new Date(a.tanggal_mulai);
        const rentangB = new Date(b.tanggal_selesai) - new Date(b.tanggal_mulai);
        return rentangA - rentangB; // Semakin kecil rentang, semakin prioritas
      });
      console.log(`📅 Tanggal ${tanggalBersih} masuk ${periodeYangCocok.length} periode, pakai: ${periodeYangCocok[0].nama_periode}`);
    }
    
    return {
      jam_telat: periodeYangCocok[0].jam_telat,
      jam_masuk: periodeYangCocok[0].jam_masuk,
      jam_pulang: periodeYangCocok[0].jam_pulang
    };
  };

  // 🔥 Fungsi status dengan dukungan periode
  const statusDariJamMasuk = (jamIn, tanggal, rules) => {
    if (!jamIn) return "HADIR (OUT SAJA)";
    
    const activeRules = getRulesForDate(tanggal);
    
    if (!activeRules?.jam_telat) return "HADIR";

    const [jamInH, jamInM] = jamIn.split(":").map(Number);
    const [ruleH, ruleM] = activeRules.jam_telat.split(":").map(Number);

    if (jamInH > ruleH || (jamInH === ruleH && jamInM > ruleM)) {
      return "TELAT";
    } else {
      return "HADIR";
    }
  };

  useEffect(() => {
    // Fetch rules default
    api
      .get(`${API_PREFIX}/rules-absen`)
      .then((res) => {
        const data = res?.data?.message?.[0];
        if (data) setRules(data);
      })
      .catch((err) => console.error("Gagal fetch rules absen:", err));

    // 🔥 Fetch periode khusus
    api
      .get(`${API_PREFIX}/rules-absen-periode`)
      .then((res) => {
        setPeriodeList(res.data.data || []);
      })
      .catch((err) => console.error("Gagal fetch periode khusus:", err));
  }, []);

  // Rekap
  const now = new Date();
  const [showRekap, setShowRekap] = useState(false);
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  // Hapus
  const [showHapus, setShowHapus] = useState(false);
  const [hapusValue, setHapusValue] = useState("ALL");

  // Kolom tabel dengan fungsi edit
  const columns = [
    { Header: "Nama", accessor: "nama_absen", sort: true },
    { Header: "Tanggal", accessor: "tanggal", sort: true },
    { Header: "Jam masuk", accessor: "jam_masuk", sort: true },
    { Header: "Jam Pulang", accessor: "jam_pulang", sort: true },
    { Header: "Status", accessor: "status", sort: true },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        const canUpdate = hasPermission("absen-list.update");
        
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
      .get(`${API_PREFIX}/absen`)
      .then((res) => {
        const data = res?.data?.message ?? [];
        setData(data);
        setFilteredData(data);
      })
      .catch((err) => console.error("Gagal fetch data absen", err));
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

  // 🔥 Parser yang dimodifikasi untuk mendukung periode
  function parseSimplePresensiAllSheets(workbook, rules) {
    // console.log("DEBUG rules:", rules);
    const out = [];
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) continue;

      const hasCols =
        rows[0].hasOwnProperty("Name") && rows[0].hasOwnProperty("Date/Time");
      if (!hasCols) continue;

      const grouped = new Map();
      for (const r of rows) {
        const name = String(r["Name"] ?? "").trim();
        const raw = r["Date/Time"];
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
        const cur = grouped.get(key) || {
          id: null,
          nama_absen: name,
          tanggal,
          jam_masuk: "",
          jam_pulang: "",
          status: "",
          created_at: "",
        };

        if (!cur.jam_masuk) cur.jam_masuk = jam;
        else if (!cur.jam_pulang) cur.jam_pulang = jam;

        // 🔥 Panggil status dengan parameter tanggal
        cur.status = statusDariJamMasuk(cur.jam_masuk, cur.tanggal, rules);
        grouped.set(key, cur);
      }
      out.push(...Array.from(grouped.values()));
    }
    return out;
  }

  // 🔥 Parser vendor yang dimodifikasi
  function parseVendorAttendance(workbook, rules) {
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const dayHeaderRow = findDayHeaderRow(ws);
    if (dayHeaderRow == null) throw new Error("Header tanggal (1..31) tidak ditemukan.");
    const ym = extractYearMonth(workbook, dayHeaderRow);
    const range = XLSX.utils.decode_range(ws["!ref"]);

    const dayCols = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: dayHeaderRow, c })];
      const v = String(cell?.v ?? "").trim();
      if (/^\d{1,2}(\.0)?$/.test(v)) dayCols.push({ col: c, day: parseInt(v) });
    }

    const records = [];
    let currentName = null;

    for (let r = dayHeaderRow + 1; r <= range.e.r; r++) {
      const maybeName = extractNameFromRow(ws, r);
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
        const tanggal = ym ? `${ym.year}-${pad2(ym.month)}-${pad2(d.day)}` : null;
        // 🔥 Panggil status dengan parameter tanggal
        const status = statusDariJamMasuk(d.in, tanggal, rules);
        records.push({
          id: null,
          nama_absen: currentName,
          tanggal,
          jam_masuk: d.in || "",
          jam_pulang: d.out || "",
          status,
          created_at: "",
        });
      }
    }
    return records;
  }

  function parseExcelAuto(arrayBuffer, rules) {
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    try {
      const v = parseVendorAttendance(wb, rules);
      if (v.length) return v;
    } catch {}
    return parseSimplePresensiAllSheets(wb, rules);
  }

  const uploadFileFallback = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`${API_PREFIX}/absen/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const buf = await file.arrayBuffer();
      const rows = parseExcelAuto(buf, rules);

      // 🔥 Debug: Lihat data hasil parse
      // console.log("📊 DATA HASIL PARSE:", rows);
      if (rows.length > 0) {
        // console.log("📊 CEK PERIODE UNTUK TANGGAL PERTAMA:");
        rows.slice(0, 3).forEach(row => {
          const activeRules = getRulesForDate(row.tanggal);
          // console.log(`   Tanggal: ${row.tanggal}, Status: ${row.status}, Pakai Rules: ${activeRules?.jam_telat}`);
        });
      }

      if (!rows.length) {
        await uploadFileFallback(file);
        alert("Import sukses.");
        fetchData();
        return;
      }

      setData(rows);

      try {
        await api.post(`${API_PREFIX}/absen/import-json`, rows);
        alert("Import sukses.");
        fetchData();
      } catch (jsonErr) {
        console.warn("Import JSON gagal, fallback upload file:", jsonErr?.message);
        await uploadFileFallback(file);
        alert("Import Gagal.");
        fetchData();
      }
    } catch (err) {
      console.error("Gagal import excel (parse/upload):", err);
      alert("Gagal import excel!");
    } finally {
      setIsImporting(false);
      e.target.value = "";
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
      if (!formData.nama_absen.trim()) {
        alert("Nama tidak boleh kosong");
        return;
      }
      if (!formData.tanggal) {
        alert("Tanggal tidak boleh kosong");
        return;
      }

      await api.put(`${API_PREFIX}/absen/${editingData.id}`, formData);
      
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
        await api.delete(`${API_PREFIX}/absen`);
        alert("Semua data berhasil dihapus.");
      } else {
        const [y, m] = hapusValue.split("-");
        await api.delete(`${API_PREFIX}/absen`, {
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

  /* ================== REKAP ================== */
  const handleProsesRekap = async () => {
    try {
      const res = await api.post(`${API_PREFIX}/rekap-absen`, {
        bulan,
        tahun,
      });
      if (res.data?.success) {
        alert("Rekap absen berhasil!");
        setShowRekap(false);
        fetchData();
      } else {
        alert("Rekap absen gagal: " + (res.data?.message ?? "Unknown error"));
      }
    } catch (err) {
      console.error("Gagal rekap absen:", err.response?.data ?? err.message ?? err);
      alert("Gagal rekap absen: " + (err.response?.data?.message || err.message || "Lihat console untuk detail"));
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

  const handleResetFilter = () => {
    setSelectedBulan("");
    setSelectedTahun("");
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <PageTitle title={"Absen Table"} />
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <h4 className="header-title">Absen Data</h4>
                </Col>
                <Col md={6}>
                  <div className="d-flex gap-2 justify-content-end">
                    {hasPermission("absen-list.create") && (
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

                    {hasPermission("absen-list.delete") && (
                      <Button
                        variant="danger"
                        onClick={openHapusModal}
                        title={
                          bulanTahunList.length
                            ? "Hapus per-bulan atau semua"
                            : "Hapus semua (tidak ada grup bulan terdeteksi)"
                        }
                        disabled={isImporting}
                      >
                        <FaTrash className="me-2" /> Hapus
                      </Button>
                    )}

                    {hasPermission("absen-list.create") && (
                      <Button
                        variant="info"
                        onClick={() => setShowRekap(true)}
                        disabled={!bulanTahunList.length || isImporting}
                        title={bulanTahunList.length ? "Rekap data" : "Belum ada data untuk direkap"}
                      >
                        <FaClipboardList className="me-2" /> Rekap Absen
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>

              {isImporting && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75">
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-2">Memproses file Excel...</div>
                  </div>
                </div>
              )}

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
              </Row>

              <Table
                columns={columns}
                data={filteredData}
                pageSize={5}
                sizePerPageList={sizePerPageList}
                isSortable
                pagination
                isSearchable
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Edit Absen */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Data Absen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama</Form.Label>
              <Form.Control
                type="text"
                name="nama_absen"
                value={formData.nama_absen}
                onChange={handleFormChange}
                placeholder="Masukkan nama"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tanggal</Form.Label>
              <Form.Control
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Jam Masuk</Form.Label>
              <Form.Control
                type="time"
                name="jam_masuk"
                value={formData.jam_masuk}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Jam Pulang</Form.Label>
              <Form.Control
                type="time"
                name="jam_pulang"
                value={formData.jam_pulang}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
              >
                <option value="HADIR">HADIR</option>
                <option value="TELAT">TELAT</option>
                <option value="IZIN">IZIN</option>
                <option value="SAKIT">SAKIT</option>
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

      {/* Modal Rekap Absen */}
      <Modal show={showRekap} onHide={() => setShowRekap(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rekap Absen</Modal.Title>
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
                <small className="text-muted">Belum ada data "tanggal" di tabel. Import dulu yaa.</small>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRekap(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleProsesRekap} disabled={!bulanTahunList.length}>
            Proses Rekap
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Hapus Data */}
      <Modal show={showHapus} onHide={() => setShowHapus(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hapus Data Absen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Pilih Periode</Form.Label>
              <Form.Select value={hapusValue} onChange={(e) => setHapusValue(e.target.value)}>
                <option value="ALL">— Semua Bulan —</option>
                {bulanTahunList.map((bt) => (
                  <option key={bt.key} value={bt.key}>
                    {bt.label}
                  </option>
                ))}
              </Form.Select>
              <div className="mt-2">
                <small className="text-muted">
                  Pilih "Semua Bulan" untuk menghapus seluruh data, atau pilih bulan tertentu.
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
            Hapus
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Advanced;