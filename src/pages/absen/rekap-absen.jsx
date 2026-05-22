import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, Col, Row, Spinner, Alert, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaFilter } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Dropdown, DropdownButton } from "react-bootstrap";
import headerImgFile from "./header.jpg";
import footerImgFile from "./footer.jpg";


// 🔹 Ambil token dari localStorage
const token = localStorage.getItem("authToken");

// 🔹 Buat instance axios dengan token Bearer
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));

const Advanced = () => {
  const { hasPermission } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [showHapus, setShowHapus] = useState(false);
  const [hapusValue, setHapusValue] = useState("ALL");
  const [bulanTahunList, setBulanTahunList] = useState([]);
  const [filterBulan, setFilterBulan] = useState("ALL");

  const [showTelatModal, setShowTelatModal] = useState(false);
  const [telatDates, setTelatDates] = useState([]);
  const [telatUserName, setTelatUserName] = useState('');

  const [exportFilterBulan, setExportFilterBulan] = useState("ALL");


  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data: payload } = await api.get("/rekap-absen");
        const list = Array.isArray(payload)
          ? payload
          : payload?.message ?? payload?.data ?? [];

        // buat daftar bulan-tahun unik
        const btSet = new Map();
        list.forEach((item) => {
          if (item.datetime) {
            const dt = new Date(item.datetime);
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
            const label = dt.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
            if (!btSet.has(key)) btSet.set(key, { key, label });
          }
        });

        setBulanTahunList(Array.from(btSet.values()));

        const normalized = list.map((item, idx) => ({
          ...item,
          no: idx + 1,
          gaji: item.gaji,
          total_denda: item.total_denda,
        }));

        setRows(normalized);
        setAllRows(normalized);
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Gagal memuat data rekap absen.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (filterBulan === "ALL") {
      setRows(allRows);
    } else {
      const filtered = allRows.filter((item) => {
        if (!item.datetime) return false;
        const dt = new Date(item.datetime);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        return key === filterBulan;
      });
      setRows(filtered.map((item, idx) => ({ ...item, no: idx + 1 })));
    }
  }, [filterBulan, allRows]);

  const handleHapus = async () => {
    try {
      setLoading(true);
      await api.delete("/rekap-absen", { data: { periode: hapusValue } });

      const { data: payload } = await api.get("/rekap-absen");
      const list = Array.isArray(payload)
        ? payload
        : payload?.message ?? payload?.data ?? [];

      const normalized = list.map((item, idx) => ({ ...item, no: idx + 1 }));
      setRows(normalized);
      setAllRows(normalized);

      // update bulanTahunList
      const btSet = new Map();
      list.forEach((item) => {
        if (item.datetime) {
          const dt = new Date(item.datetime);
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
          const label = dt.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
          if (!btSet.has(key)) btSet.set(key, { key, label });
        }
      });
      setBulanTahunList(Array.from(btSet.values()));

      setShowHapus(false);
      setHapusValue("ALL");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Gagal menghapus data.");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { Header: "NO", accessor: "no", sort: true },
      { Header: "Name", accessor: "user.name", sort: true },
      { Header: "Gaji", accessor: "gaji", sort: true, Cell: ({ value }) => rupiah(value) },
      { Header: "Total Hari", accessor: "total_hari", sort: true },
      { Header: "Total Libur", accessor: "total_libur", sort: true },
      { Header: "Total Hadir", accessor: "total_hadir", sort: true },
      { Header: "Total Izin", accessor: "total_izin", sort: true },
      { Header: "Total Cuti", accessor: "total_cuti", sort: true },
      { Header: "Total Sakit", accessor: "total_sakit", sort: true },
      {
        Header: "Total Telat",
        accessor: "total_telat",
        Cell: ({ row }) => {
          const count = row.original.total_telat;
          if (!count) return "-";

          return (
            <Button
              variant="link"
              className="p-0"
              onClick={() => {
                setTelatDates(row.original.telat_detail ?? []);
                setTelatUserName(row.original.user?.name ?? row.original.user_name ?? '');
                setShowTelatModal(true);
              }}
            >
              <strong>{count}</strong> <small className="text-muted">Lihat</small>
            </Button>
          );
        },
      },


      // { Header: "Tidak Hadir Tanpa Keterangan", accessor: "total_tidakhadir", sort: true },
      { Header: "Total Pulang Cepat", accessor: "total_pulang_cepat", sort: true },
      // { Header: "Total Denda", accessor: "total_denda", sort: true, Cell: ({ value }) => rupiah(value) },
      // { Header: "Gaji Bersih", accessor: "gaji_bersih", sort: true, Cell: ({ value }) => <span className="text-success fw-bold">{rupiah(value)}</span> },
      { Header: "Datetime", accessor: "datetime", sort: true },
    ],
    []
  );

  const sizePerPageList = useMemo(
    () => [
      { text: "5", value: 5 },
      { text: "10", value: 10 },
      { text: "25", value: 25 },
      { text: "All", value: rows.length || 1 },
    ],
    [rows.length]
  );

  // const role = localStorage.getItem("role");
  //   if (role !== "Superadmin") {
  //     return (
  //       <div className="p-5 text-center">
  //         <h3 className="text-danger">Akses Ditolak</h3>
  //         <p>Halaman ini hanya dapat diakses oleh Superadmin.</p>
  //       </div>
  //     );
  //   }

const exportPDF = (bulan = exportFilterBulan) => {
  if (!rows || rows.length === 0) return;

  const dataToExport =
    bulan === "ALL"
      ? rows
      : rows.filter((item) => {
          if (!item.datetime) return false;
          const dt = new Date(item.datetime);
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
          return key === bulan;
        });

  if (!dataToExport.length) {
    alert("Tidak ada data untuk bulan yang dipilih.");
    return;
  }

  const doc = new jsPDF("p", "pt", "a4"); 
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const headerHeight = 70; 
  const footerHeight = 50;

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });

  const drawPDF = async () => {
    const headerImg = await loadImage(headerImgFile);
    const footerImg = await loadImage(footerImgFile);

    const labelBulan = bulan === "ALL" ? "Semua Periode" : (bulanTahunList.find(b => b.key === bulan)?.label || bulan);

    // 🔹 KOLOM PDF GAJI
    const tableColumn = ["No", "Nama", "Gaji Pokok", "Telat", "Denda", "Gaji Bersih", "Tanggal & Jam Telat"];
    const tableRows = [];

    dataToExport.forEach((item, index) => {
      const jumlahTelat = Number(item.total_telat || 0);

      // 🔴 PERBAIKAN: DETAIL TELAT DENGAN JAM
      let detailTelat = "-";

      if (jumlahTelat > 0 && item.telat_detail && item.telat_detail.length > 0) {
        const dtRekap = new Date(item.datetime);
        const monthRekap = dtRekap.getMonth();
        const yearRekap = dtRekap.getFullYear();

        // filter telat_detail sesuai bulan & tahun datetime
        const filteredTelat = item.telat_detail.filter((telatItem) => {
          // 🔴 HANDLE BENTUK OBJECT ATAU STRING
          const tanggal = telatItem.tanggal || telatItem;
          const dt = new Date(tanggal);
          return dt.getMonth() === monthRekap && dt.getFullYear() === yearRekap;
        });

        if (filteredTelat.length > 0) {
          detailTelat = filteredTelat
            .map((telatItem) => {
              // 🔴 HANDLE BENTUK OBJECT ATAU STRING
              const tanggal = telatItem.tanggal || telatItem;
              const dt = new Date(tanggal);
              const tanggalFormatted = dt.getDate();
              const hari = dt.toLocaleDateString("id-ID", { weekday: "short" });
              
              // 🔴 TAMBAHKAN JAM TELAT JIKA ADA
              let jamText = "";
              if (telatItem.jam_telat) {
                // Format jam: "08:45:00" -> "08:45"
                const jam = telatItem.jam_telat.substring(0, 5);
                jamText = ` (${jam})`;
              }
              
              return `${tanggalFormatted} ${hari}${jamText}`;
            })
            .join(", ");
        }
      }

      tableRows.push([
        index + 1,
        item.user?.name || item.user_name || "-",
        rupiah(item.gaji),
        jumlahTelat,
        rupiah(item.total_denda),
        rupiah(item.gaji_bersih),
        detailTelat,
      ]);
    });

    autoTable(doc, {
      startY: headerHeight + 65,
      head: [tableColumn],
      body: tableRows,
      theme: "grid", 
      styles: { 
        fontSize: 8, 
        cellPadding: 4,
        valign: 'middle' 
      },
      headStyles: { 
        fillColor: [44, 62, 80], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      // 🔴 PERBAIKAN: SESUAIKAN INDEKS KOLOM
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },    // No
        1: { cellWidth: 80 },                      // Nama
        2: { halign: 'right', cellWidth: 65 },     // Gaji Pokok
        3: { halign: 'center', cellWidth: 30 },    // Telat
        4: { halign: 'right', cellWidth: 60 },     // Denda
        5: { halign: 'right', cellWidth: 70, fontStyle: 'bold' }, // Gaji Bersih
        6: { fontSize: 7, cellWidth: 'auto' }      // Tanggal & Jam Telat
      },
      margin: { 
        top: headerHeight + 65, 
        bottom: footerHeight + 40, 
        left: 20, 
        right: 20 
      },
      didDrawPage: (data) => {
        if (headerImg) doc.addImage(headerImg, "JPEG", 0, 0, pageWidth, headerHeight);
        if (footerImg) doc.addImage(footerImg, "JPEG", 0, pageHeight - footerHeight, pageWidth, footerHeight);

        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("LAPORAN REKAPITULASI GAJI", pageWidth / 2, headerHeight + 30, { align: "center" });
        
        doc.setFontSize(10);
        doc.text(`Periode: ${labelBulan}`, pageWidth / 2, headerHeight + 45, { align: "center" });

        const pageNumber = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Halaman ${pageNumber}`, pageWidth - 30, pageHeight - 15, { align: "right" });
      },
    });

    doc.save(`Rekap_Gaji_${labelBulan.replace(/ /g, "_")}.pdf`);
  };

  drawPDF();
};

  const exportPDFpresensi = async (bulan = exportFilterBulan) => {
    if (!rows || rows.length === 0) return;

    // 1. Filter data terlebih dahulu
    const dataToExport = bulan === "ALL" 
      ? [...rows] 
      : rows.filter((item) => {
          if (!item.datetime) return false;
          const dt = new Date(item.datetime);
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
          return key === bulan;
        });

    if (!dataToExport.length) {
      alert("Tidak ada data untuk periode ini.");
      return;
    }

    // 2. Inisialisasi Dokumen
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const headerHeight = 70;
    const footerHeight = 50;

    // Helper Load Image (Promisified)
    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });

    // Load aset gambar di awal sekali saja
    const [headerImg, footerImg] = await Promise.all([
      loadImage(headerImgFile),
      loadImage(footerImgFile)
    ]);

    const labelBulan = bulan === "ALL" 
      ? "Semua Periode" 
      : (bulanTahunList.find(b => b.key === bulan)?.label || bulan);

    // 3. Transformasi & Grouping Data
    const groupedByHolding = dataToExport.reduce((acc, item) => {
      const holding = item.user?.holding || "TIDAK ADA HOLDING";
      if (!acc[holding]) acc[holding] = [];
      acc[holding].push(item);
      return acc;
    }, {});

    const tableRows = [];
    Object.entries(groupedByHolding).forEach(([holdingName, items]) => {
      items.forEach((item, idxInGroup) => {
        const dtRekap = new Date(item.datetime);
        const mRekap = dtRekap.getMonth();
        const yRekap = dtRekap.getFullYear();

        // Optimasi Detail Telat
        let detailTelat = "-";
        if (item.total_telat > 0 && item.telat_detail?.length > 0) {
          detailTelat = item.telat_detail
            .filter(t => {
              const d = new Date(t.tanggal || t);
              return d.getMonth() === mRekap && d.getFullYear() === yRekap;
            })
            .map(t => {
              const d = new Date(t.tanggal || t);
              const jam = t.jam_telat ? `(${t.jam_telat.substring(0, 5)})` : "";
              return `${d.getDate()}${jam}`;
            }).join(", ");
        }

        // Optimasi Detail Tanpa Keterangan
        let detailTidakHadir = "-";
        if (item.total_tidakhadir > 0 && item.tidak_hadir_detail?.length > 0) {
          detailTidakHadir = item.tidak_hadir_detail
            .filter(dateStr => {
              const d = new Date(dateStr);
              return d.getMonth() === mRekap && d.getFullYear() === yRekap;
            })
            .map(dateStr => new Date(dateStr).getDate()).join(", ");
        }

        tableRows.push([
          idxInGroup === 0 ? holdingName.toUpperCase() : "", // Rowspanning effect
          item.user?.name || "-",
          item.user?.jabatan || "-",
          item.total_telat || 0,
          item.total_tidakhadir || 0,
          rupiah(item.total_denda),
          detailTelat,
          detailTidakHadir
        ]);
      });
    });

    // 4. Render Table
    autoTable(doc, {
      startY: headerHeight + 65,
      margin: { top: headerHeight + 65, bottom: footerHeight + 40, left: 20, right: 20 },
      head: [["Holding", "Nama", "Jabatan", "Telat", "Absen", "Denda", "Tanggal telat", "Tanggal absen"]],
      body: tableRows,
      theme: "grid",
      rowPageBreak: 'auto', // Mencegah baris terpotong di tengah
      styles: {
        fontSize: 7,
        cellPadding: 4,
        overflow: 'linebreak', // Teks otomatis pindah baris jika panjang
        valign: 'middle'
      },
      headStyles: {
        fillColor: [44, 62, 80],
        halign: 'center',
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold', fillColor: [245, 245, 245] }, // Holding
        1: { cellWidth: 80 }, // Nama
        2: { cellWidth: 50 }, // Jabatan
        3: { cellWidth: 25, halign: 'center' }, // Telat
        4: { cellWidth: 30, halign: 'center' }, // Absen
        5: { cellWidth: 50, halign: 'right' }, // Denda
        6: { cellWidth: 130, fontSize: 6.5 }, // Detail Telat
        7: { cellWidth: 'auto', fontSize: 6.5 }  // Detail Absen
      },
      didDrawPage: (data) => {
        // Header
        if (headerImg) doc.addImage(headerImg, "JPEG", 0, 0, pageWidth, headerHeight);
        
        doc.setFontSize(13);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text("LAPORAN REKAPITULASI PRESENSI", pageWidth / 2, headerHeight + 25, { align: "center" });
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Periode: ${labelBulan}`, pageWidth / 2, headerHeight + 40, { align: "center" });

        // Footer
        if (footerImg) doc.addImage(footerImg, "JPEG", 0, pageHeight - footerHeight, pageWidth, footerHeight);
        
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 20, pageHeight - 15);
        doc.text(`Halaman ${pageCount}`, pageWidth - 20, pageHeight - 15, { align: "right" });
      },
    });

    doc.save(`Rekap_Presensi_${labelBulan.replace(/\s/g, "_")}.pdf`);
  };

  const exportExcelPresensi = (bulan = exportFilterBulan) => {
  // ✅ Cek data awal
  if (!rows || rows.length === 0) {
    alert("Data presensi kosong, Bro!");
    return;
  }

  // ✅ Filter data berdasarkan bulan (pakai data lokal)
  const dataToExport = bulan === "ALL" 
    ? [...rows] 
    : rows.filter((item) => {
        if (!item.datetime) return false;
        const dt = new Date(item.datetime);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        return key === bulan;
      });

  if (!dataToExport.length) {
    alert("Tidak ada data untuk periode ini.");
    return;
  }

  const labelBulan = bulan === "ALL" 
    ? "Semua Periode" 
    : (bulanTahunList.find(b => b.key === bulan)?.label || bulan);

  // ✅ Grouping by Holding (client-side)
  const groupedByHolding = dataToExport.reduce((acc, item) => {
    const holding = item.user?.holding || "TIDAK ADA HOLDING";
    if (!acc[holding]) acc[holding] = [];
    acc[holding].push(item);
    return acc;
  }, {});

  // ✅ Siapkan array untuk Excel
  const excelData = [];
  
  // Header Table
  excelData.push([
    "HOLDING", "NAMA KARYAWAN", "JABATAN", 
    "TOTAL TELAT", "TOTAL ABSEN",
    //  "TOTAL DENDA", 
    "TANGGAL TELAT", "TANGGAL ABSEN"
  ]);
  excelData.push([]); // Spacer

  // ✅ Isi data row-by-row
  Object.entries(groupedByHolding).forEach(([holdingName, items]) => {
    items.forEach((item, idxInGroup) => {
      const dtRekap = new Date(item.datetime);
      const mRekap = dtRekap.getMonth();
      const yRekap = dtRekap.getFullYear();

      // 📍 Detail Telat (dengan jam)
      let detailTelat = "-";
      if (item.total_telat > 0 && item.telat_detail?.length > 0) {
        detailTelat = item.telat_detail
          .filter(t => {
            const d = new Date(t.tanggal || t);
            return d.getMonth() === mRekap && d.getFullYear() === yRekap;
          })
          .map(t => {
            const d = new Date(t.tanggal || t);
            const jam = t.jam_telat ? `(${t.jam_telat.substring(0, 5)})` : "";
            return `${d.getDate()} ${d.toLocaleDateString("id-ID", { weekday: "short" })}${jam}`;
          }).join(", ");
      }

      // 📍 Detail Absen/Tidak Hadir
      let detailTidakHadir = "-";
      if (item.total_tidakhadir > 0 && item.tidak_hadir_detail?.length > 0) {
        detailTidakHadir = item.tidak_hadir_detail
          .filter(dateStr => {
            const d = new Date(dateStr);
            return d.getMonth() === mRekap && d.getFullYear() === yRekap;
          })
          .map(dateStr => {
            const d = new Date(dateStr);
            return `${d.getDate()} ${d.toLocaleDateString("id-ID", { weekday: "short" })}`;
          }).join(", ");
      }

      excelData.push([
        idxInGroup === 0 ? holdingName.toUpperCase() : "", // Holding name only first row
        item.user?.name || "-",
        item.user?.jabatan || "-",
        item.total_telat || 0,
        item.total_tidakhadir || 0,
        // item.total_denda || 0, // Numeric value for Excel calculation
        detailTelat,
        detailTidakHadir
      ]);
    });
    excelData.push([]); // Spacer antar holding
  });

  // ✅ Buat Worksheet & Workbook
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // ✅ Set column width biar rapi
  ws['!cols'] = [
    { wch: 25 }, // Holding
    { wch: 30 }, // Nama
    { wch: 20 }, // Jabatan
    { wch: 12, halign: "center" }, // Total Telat
    { wch: 12, halign: "center" }, // Total Absen
    // { wch: 15, halign: "right" },  // Denda
    { wch: 40 }, // Detail Telat
    { wch: 40 }  // Detail Absen
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi");

  // ✅ Generate & Download file
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  const filename = `Rekap_Presensi_${labelBulan.replace(/\s/g, "_")}.xlsx`;
  saveAs(blob, filename);
};

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Presensi", path: "/features/tables/advanced" },
          { label: "Rekap", path: "/features/tables/advanced", active: true },
        ]}
        title={"Rekap Absen Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
                <h4 className="header-title mb-0">Rekap Absen Data</h4>

                <div className="d-flex flex-wrap align-items-center gap-2">
                  {/* Select Filter Bulan */}
                  <Form.Select
                    className="flex-grow-1 flex-md-grow-0"
                    style={{ minWidth: "180px", width: "auto" }}
                    value={filterBulan}
                    onChange={(e) => setFilterBulan(e.target.value)}
                  >
                    <option value="ALL">— Semua Bulan —</option>
                    {bulanTahunList.map((bt) => (
                      <option key={bt.key} value={bt.key}>
                        {bt.label}
                      </option>
                    ))}
                  </Form.Select>

                  {/* Tombol Hapus */}
                  {hasPermission("rekap-absen.delete") && (
                    <Button variant="danger" onClick={() => setShowHapus(true)}>
                      <FaTrash className="me-1" /> Hapus
                    </Button>
                  )}

                   

                  {/* Tombol Export */}
                  {/* <DropdownButton
                    id="dropdown-export-pdf"
                    title="Export PDF Gaji"
                    variant="success"
                    onSelect={(key) => {
                      setExportFilterBulan(key);
                      exportPDF(key);
                    }}
                     >
                    <Dropdown.Item eventKey="ALL">— Semua Bulan —</Dropdown.Item>
                    {bulanTahunList.map((bt) => (
                      <Dropdown.Item key={bt.key} eventKey={bt.key}>
                        {bt.label}
                      </Dropdown.Item>
                    ))}
                  </DropdownButton> */}

                  {/* <DropdownButton
                    id="dropdown-export-pdf"
                    title="Export PDF Presensi"
                    variant="warning"
                    onSelect={(key) => {
                      setExportFilterBulan(key);
                      exportPDFpresensi(key);
                    }}
                    >
                    <Dropdown.Item eventKey="ALL">— Semua Bulan —</Dropdown.Item>
                    {bulanTahunList.map((bt) => (
                      <Dropdown.Item key={bt.key} eventKey={bt.key}>
                        {bt.label}
                      </Dropdown.Item>
                    ))}
                  </DropdownButton> */}
                  <DropdownButton
                    id="dropdown-export-excel-presensi"
                    title="Export Excel Presensi"
                    variant="outline-warning"
                    className="border-warning text-warning"
                    onSelect={(key) => {
                      setExportFilterBulan(key);
                      exportExcelPresensi(key);
                    }}
                  >
                    <Dropdown.Item eventKey="ALL">— Semua Bulan —</Dropdown.Item>
                    {bulanTahunList.map((bt) => (
                      <Dropdown.Item key={bt.key} eventKey={bt.key}>
                        {bt.label}
                      </Dropdown.Item>
                    ))}
                  </DropdownButton>
                </div>
              </div>

              {loading && (
                <div className="d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  <span>Memuat data…</span>
                </div>
              )}

              {err && <Alert variant="danger" className="mt-2">{err}</Alert>}

              {!loading && !err && (
                <Table
                  columns={columns}
                  data={rows}
                  pageSize={5}
                  sizePerPageList={sizePerPageList}
                  isSortable={true}
                  pagination={true}
                  isSearchable={true}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showHapus} onHide={() => setShowHapus(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hapus Data Absen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Pilih Periode</Form.Label>
              <Form.Select
                value={hapusValue}
                onChange={(e) => setHapusValue(e.target.value)}
              >
                <option value="ALL">— Semua Bulan —</option>
                {bulanTahunList.map((bt) => (
                  <option key={bt.key} value={bt.key}>
                    {bt.label}
                  </option>
                ))}
              </Form.Select>
              <div className="mt-2">
                <small className="text-muted">
                  Pilih “Semua Bulan” untuk menghapus seluruh data, atau pilih bulan tertentu.
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
      
      <Modal show={showTelatModal} onHide={() => setShowTelatModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Tanggal Telat - {telatUserName}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          {telatDates.length === 0 ? (
            <p className="text-muted">Tidak ada tanggal telat.</p>
          ) : (
            <ul>
              {(() => {
                const currentRow = rows.find(row => 
                  row.user?.name === telatUserName || 
                  row.user_name === telatUserName
                );
                
                if (!currentRow || !currentRow.datetime) {
                  return <li>Tidak dapat menentukan periode</li>;
                }
                
                const rowDate = new Date(currentRow.datetime);
                const rowMonth = rowDate.getMonth();
                const rowYear = rowDate.getFullYear();
                
                // 🔥 FILTER DAN UNIKKAN BERDASARKAN TANGGAL
                const uniqueTelat = new Map();
                
                telatDates.forEach(item => {
                  // Handle object atau string
                  const tanggal = item.tanggal || item;
                  const date = new Date(tanggal);
                  
                  // Cek apakah dalam bulan/tahun yang sama
                  if (date.getMonth() === rowMonth && date.getFullYear() === rowYear) {
                    const tanggalKey = tanggal;
                    
                    // Hanya simpan yang pertama kali muncul
                    if (!uniqueTelat.has(tanggalKey)) {
                      uniqueTelat.set(tanggalKey, {
                        tanggal: tanggal,
                        jam_telat: item.jam_telat || ''
                      });
                    }
                  }
                });
                
                // Konversi ke array dan sort
                const filteredDates = Array.from(uniqueTelat.values())
                  .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
                
                if (filteredDates.length === 0) {
                  return <li>Tidak ada tanggal telat untuk periode ini</li>;
                }
                
                return filteredDates.map((item, idx) => {
                  const date = new Date(item.tanggal);
                  const jamTelat = item.jam_telat ? ` (${item.jam_telat.substring(0, 5)})` : '';
                  
                  return (
                    <li key={idx}>
                      {date.toLocaleDateString("id-ID", { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                      {jamTelat}
                    </li>
                  );
                });
              })()}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTelatModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Advanced;
