import { useState, useEffect } from "react";
import {
  Card,
  Spinner,
  Button,
  Modal,
  Form,
  Alert,
  Image,
  Table,
  Badge,
  Row,
  Col,
  Tabs,
  Tab,
} from "react-bootstrap";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { 
  FaFileInvoiceDollar, FaCalendarAlt, FaMoneyBillWave, 
  FaReceipt, FaDownload, FaExclamationCircle, FaInfoCircle,
  FaUser, FaIdCard 
} from "react-icons/fa";
import { FiUser, FiBriefcase, FiDollarSign } from "react-icons/fi";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from './logo-syntax.png';
import qrBuNova from './QR-SYNTAX-BU-NOVA.png';
import qrPakPreskom from './QR-SYNTAX-PAK-PRESKOM.png';
import ttdBuEvi from './ttd-bu-evi.jpeg';
import PersonalInfo from "./PersonalInfo"; // Import komponen baru

const Profile = () => {
  const { user, setUser } = useAuthContext();
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [rekapData, setRekapData] = useState(null);
  const [loadingRekap, setLoadingRekap] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [showTelatModal, setShowTelatModal] = useState(false);
  const [telatDates, setTelatDates] = useState([]);
  const [logoKecil, setLogoKecil] = useState(null);
  const [selectedTelatDate, setSelectedTelatDate] = useState(null);
  const [showComplainModal, setShowComplainModal] = useState(false);
  const [komplainData, setKomplainData] = useState([]);
  const [complainForm, setComplainForm] = useState({
    tanggal: '',
    alasan: '',
    bukti_foto: null,
    keterangan: ''
  });
  const [submittingComplain, setSubmittingComplain] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // State untuk tab aktif

  // === FILTER BULAN & TAHUN ===
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);

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
    { value: 12, label: "Desember" },
  ];

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i); // 2020–2030

  const handleFilterChange = (newMonth, newYear) => {
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    fetchRekapData(newMonth, newYear);
  };

  const handleOpenComplainModal = (tanggal) => {
    setSelectedTelatDate(tanggal);
    setComplainForm({
      tanggal: tanggal,
      alasan: '',
      bukti_foto: null,
      keterangan: ''
    });
    setShowComplainModal(true);
  };

  const fetchKomplainData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/komplain-telat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKomplainData(res.data);
    } catch (error) {
      console.error("Gagal mengambil data komplain:", error);
    }
  };

  const handleSubmitComplain = async (e) => {
    e.preventDefault();
    setSubmittingComplain(true);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append('user_id', mappedUser.id);
      formData.append('tanggal', complainForm.tanggal);
      formData.append('alasan', complainForm.alasan);
      formData.append('keterangan', complainForm.keterangan);
      if (complainForm.bukti_foto) {
        formData.append('bukti_foto', complainForm.bukti_foto);
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/komplain-telat`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 🔥 TAMBAHKAN DATA KOMPLAIN BARU KE STATE
      const komplainBaru = {
        id: response.data.id || Date.now(), // ID sementara jika tidak ada dari response
        user_id: mappedUser.id,
        tanggal: complainForm.tanggal,
        alasan: complainForm.alasan,
        keterangan: complainForm.keterangan,
        status: 'pending', // Status awal selalu pending
        bukti_foto: response.data.bukti_foto || null,
        created_at: new Date().toISOString()
      };

      setKomplainData(prevData => [...prevData, komplainBaru]);

      setAlert({
        type: 'success',
        message: 'Komplain berhasil dikirim! Tim HRD akan meninjau permohonan Anda.'
      });
      
      setShowComplainModal(false);
      
      // Masih tetap fetch rekap untuk update data terbaru (opsional)
      fetchRekapData(selectedMonth, selectedYear);
      
    } catch (error) {
      setAlert({
        type: 'danger',
        message: error.response?.data?.message || 'Gagal mengirim komplain. Silakan coba lagi.'
      });
    } finally {
      setSubmittingComplain(false);
    }
  };

  const handleDownloadPDF = async () => {
  if (!rekapData) return;
  setDownloadingPDF(true);
  
  try {
    const element = document.querySelector('#slip-gaji-container .card');
    if (!element) throw new Error('Element not found');
    
    const pdfElement = element.cloneNode(true);
    const buttons = pdfElement.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());
    
    pdfElement.classList.add('pdf-version');
    pdfElement.style.width = '210mm';
    pdfElement.style.margin = '0';
    pdfElement.style.boxShadow = 'none';
    pdfElement.style.padding = '20px';
    
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.appendChild(pdfElement);
    document.body.appendChild(tempContainer);
    
    const canvas = await html2canvas(pdfElement, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });
    
    document.body.removeChild(tempContainer);
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    const heightLeft = imgHeight;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const position = 0;
    
    // Jika konten lebih panjang dari 1 halaman A4
    if (imgHeight > pageHeight) {
      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 1;
      
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        pageCount++;
      }
    } else {
      // Jika muat dalam 1 halaman
      pdf.addImage(canvas, 'PNG', 0, 0, imgWidth, imgHeight);
    }
    
    const fileName = `Slip-Gaji-${mappedUser.nama_absen || mappedUser.name}-${formatMonthYear(rekapData.datetime).replace(' ', '-')}.pdf`;
    pdf.save(fileName);
    
    setAlert({
      type: 'success',
      message: 'PDF berhasil diunduh!'
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    setAlert({
      type: 'danger',
      message: 'Gagal membuat PDF. Silakan coba lagi.'
    });
  } finally {
    setDownloadingPDF(false);
  }
};

  const mappedUser = user
    ? { ...user, status_talent: user.status_talent }
    : null;

  // === FETCH REKAP DENGAN FILTER ===
  const fetchRekapData = async (month = selectedMonth, year = selectedYear) => {
    if (!mappedUser) return;
    setLoadingRekap(true);
    try {
      const token = localStorage.getItem("authToken");
      const rekapResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rekap-absen/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let filteredRekap = null;

      if (Array.isArray(rekapResponse.data) && rekapResponse.data.length > 0) {
        const matching = rekapResponse.data.find(item => {
          const itemDate = new Date(item.datetime);
          return itemDate.getMonth() + 1 === month && itemDate.getFullYear() === year;
        });
        filteredRekap = matching || null;
      }

      if (!filteredRekap) {
        setRekapData(null);
        setLoadingRekap(false);
        return;
      }

      // Ambil payroll jika ada
      let matchingPayroll = null;
      const rekapDate = new Date(filteredRekap.datetime);
      const rekapMonth = rekapDate.getMonth() + 1;
      const rekapYear = rekapDate.getFullYear();

      try {
        const payrollResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/payrolls?user_id=${mappedUser.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (payrollResponse.data.success && payrollResponse.data.data) {
          const payrollData = Array.isArray(payrollResponse.data.data)
            ? payrollResponse.data.data
            : payrollResponse.data.data.data || [];

          matchingPayroll = payrollData.find(p => {
            const payrollMonth = parseInt(p.bulan || p.month || 0);
            const payrollYear = parseInt(p.tahun || p.year || 0);
            return payrollMonth === rekapMonth && payrollYear === rekapYear;
          });
        }
      } catch (payrollError) {
        console.warn("Error fetching payroll:", payrollError);
      }

      // Proses data
      if (matchingPayroll) {
        // Cari income dengan kategori "Gaji"
        const gajiIncomes = matchingPayroll.payrollIncomes.filter(income =>
          income.category?.name.toLowerCase().includes('gaji')
        );

        // Ambil gaji pokok: jika ada di payroll, pakai net_amount; jika tidak, fallback ke rekap
        let total_gaji_pokok = 0;
        let total_potongan_dari_gaji = 0;

        if (gajiIncomes.length > 0) {
          // Jumlahkan semua income "Gaji" (jika ada lebih dari satu)
          total_gaji_pokok = gajiIncomes.reduce((sum, inc) => sum + (Number(inc.net_amount) || 0), 0);
          total_potongan_dari_gaji = gajiIncomes.reduce((sum, inc) =>
            sum + (inc.deductions?.reduce((dSum, d) => dSum + (Number(d.amount) || 0), 0) || 0), 0
          );
        } else {
          // Tidak ada income "Gaji" di payroll → ambil dari rekap
          total_gaji_pokok = Number(filteredRekap.gaji) || 0;
        }

        // Ambil income NON-GAJI
        const nonGajiIncomes = matchingPayroll.payrollIncomes.filter(income =>
          !income.category?.name.toLowerCase().includes('gaji')
        );

        // Hitung tunjangan & potongan dari non-gaji
        let total_tunjangan_prestasi = 0;
        let total_tunjangan_kinerja = 0;
        let total_tunjangan_lainnya = 0;
        let total_potongan_non_gaji = 0;

        const tunjangan_prestasi = [];
        const tunjangan_kinerja = [];
        const tunjangan_lainnya = [];
        const potongan_lainnya = [];

        nonGajiIncomes.forEach(income => {
          const categoryName = income.category?.name || "";
          const grossAmount = Number(income.gross_amount) || 0;
          const netAmount = Number(income.net_amount) || 0;
          const deductions = income.deductions?.map(d => ({
            name: d.deduction_type?.name || "Potongan Lainnya",
            amount: Number(d.amount) || 0
          })) || [];
          const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

          if (categoryName.toLowerCase().includes('prestasi')) {
            tunjangan_prestasi.push({ name: categoryName, gross_amount: grossAmount, deductions, net_amount: netAmount });
            total_tunjangan_prestasi += netAmount;
          } else if (categoryName.toLowerCase().includes('kinerja')) {
            tunjangan_kinerja.push({ name: categoryName, gross_amount: grossAmount, deductions, net_amount: netAmount });
            total_tunjangan_kinerja += netAmount;
          } else {
            tunjangan_lainnya.push({ name: categoryName, gross_amount: grossAmount, deductions, net_amount: netAmount });
            total_tunjangan_lainnya += netAmount;
          }

          total_potongan_non_gaji += totalDeductions;
          deductions.forEach(deduction => potongan_lainnya.push({ name: deduction.name, amount: deduction.amount }));
        });

        // Total potongan = denda (dari rekap) + potongan dari gaji + potongan dari non-gaji
        const total_potongan_denda = Number(filteredRekap.total_denda) || 0;
        const total_potongan_lainnya = total_potongan_dari_gaji + total_potongan_non_gaji;
        const total_semua_potongan = total_potongan_denda + total_potongan_lainnya;

        const total_pendapatan_kotor = total_gaji_pokok +
          tunjangan_prestasi.reduce((sum, item) => sum + item.gross_amount, 0) +
          tunjangan_kinerja.reduce((sum, item) => sum + item.gross_amount, 0) +
          tunjangan_lainnya.reduce((sum, item) => sum + item.gross_amount, 0);

        const gaji_bersih = total_pendapatan_kotor - total_semua_potongan;

        setRekapData({
          ...filteredRekap,
          payroll: matchingPayroll,
          hasPayroll: true,
          gaji_pokok: total_gaji_pokok,
          total_tunjangan_prestasi,
          total_tunjangan_kinerja,
          total_tunjangan_lainnya,
          total_potongan_denda,
          total_potongan_lainnya,
          total_pendapatan_kotor,
          total_semua_potongan,
          gaji_bersih,
          tunjangan_prestasi,
          tunjangan_kinerja,
          tunjangan_lainnya,
          potongan_lainnya
        });
      }
      else {
        const gaji_pokok = Number(filteredRekap.gaji) || 0;
        const total_denda = Number(filteredRekap.total_denda) || 0;
        const gaji_bersih = gaji_pokok - total_denda;

        setRekapData({
          ...filteredRekap,
          gaji_pokok,
          total_potongan_denda: total_denda,
          total_potongan_lainnya: 0,
          total_semua_potongan: total_denda,
          total_pendapatan_kotor: gaji_pokok,
          gaji_bersih,
          payroll: null,
          hasPayroll: false,
          tunjangan_prestasi: [],
          tunjangan_kinerja: [],
          tunjangan_lainnya: [],
          potongan_lainnya: []
        });
      }
    } catch (error) {
      console.error("Error fetching rekap data:", error);
      setRekapData(null);
      setAlert({
        type: 'danger',
        message: 'Gagal mengambil data slip gaji. Silakan coba lagi.'
      });
    } finally {
      setLoadingRekap(false);
    }
  };

  // Fetch SEMUA rekap sekali saat mount, untuk tentukan default bulan/tahun
  useEffect(() => {
    const fetchAllRekapForDefault = async () => {
      if (!mappedUser) return;

      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/rekap-absen/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let allRekap = Array.isArray(res.data) ? res.data : [];
        
        if (allRekap.length > 0) {
          // Urutkan dari terbaru ke terlama
          allRekap.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
          const latest = allRekap[0];
          const latestDate = new Date(latest.datetime);
          const latestMonth = latestDate.getMonth() + 1;
          const latestYear = latestDate.getFullYear();

          // Set sebagai default
          setSelectedMonth(latestMonth);
          setSelectedYear(latestYear);

          // Lalu fetch data detail untuk periode itu
          fetchRekapData(latestMonth, latestYear);
        } else {
          // Jika tidak ada data sama sekali, fallback ke bulan ini
          const now = new Date();
          fetchRekapData(now.getMonth() + 1, now.getFullYear());
        }
      } catch (error) {
        console.error("Gagal fetch semua rekap untuk default:", error);
        // Fallback ke bulan ini jika error
        const now = new Date();
        fetchRekapData(now.getMonth() + 1, now.getFullYear());
      }
    };

    fetchAllRekapForDefault();
  }, []); // Hanya jalan sekali saat komponen mount

  useEffect(() => {
    fetchKomplainData();
    fetchLogoSetting();
  }, []);

  if (!mappedUser) {
    return (
      <div className="text-center mt-4">
        <Spinner animation="border" />
      </div>
    );
  }

  const formatMonthYear = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  };

  const formatDateFull = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long"
    });
  };

  const baseURL = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
  const fotoURL = mappedUser.foto
    ? `${baseURL}/storage/${encodeURIComponent(mappedUser.foto)}`
    : "/default-avatar.png";

  const [formData, setFormData] = useState({
    name: mappedUser.name || "",
    email: mappedUser.email || "",
    old_password: "",
    new_password: "",
    confirm_password: "",
    foto: null,
  });

  const [preview, setPreview] = useState(fotoURL);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, foto: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: "", message: "" });

    if (formData.new_password || formData.confirm_password || formData.old_password) {
      if (formData.new_password !== formData.confirm_password) {
        setAlert({ type: "danger", message: "Konfirmasi password baru tidak cocok." });
        setLoading(false);
        return;
      }
    }

    try {
      const form = new FormData();
      form.append("user_id", mappedUser.id);
      form.append("name", formData.name);
      form.append("email", formData.email);
      if (formData.old_password) form.append("old_password", formData.old_password);
      if (formData.new_password) form.append("new_password", formData.new_password);
      if (formData.foto) form.append("foto", formData.foto);

      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/users/update-profile`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      const updatedUser = response.data.user;
      const newFotoURL = updatedUser.foto
        ? `${baseURL}/storage/${encodeURIComponent(updatedUser.foto)}?t=${new Date().getTime()}`
        : "/default-avatar.png";

      setPreview(newFotoURL);
      setFormData((prev) => ({ ...prev, name: updatedUser.name, email: updatedUser.email }));
      setUser((prev) => ({ ...prev, name: updatedUser.name, email: updatedUser.email, foto: updatedUser.foto }));

      setAlert({ type: "success", message: "Profil berhasil diperbarui!" });
      setShowEdit(false);
    } catch (error) {
      setAlert({ type: "danger", message: error.response?.data?.message || "Gagal memperbarui profil." });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(parseInt(amount));
  };

  const attendanceStats = [
    { label: "Hadir", value: rekapData?.total_hadir || 0, color: "success", icon: "✓" },
    { label: "Izin", value: rekapData?.total_izin || 0, color: "warning", icon: "i" },
    { label: "Sakit", value: rekapData?.total_sakit || 0, color: "info", icon: "⛑" },
    { label: "Tidak Hadir", value: rekapData?.total_tidakhadir || 0, color: "danger", icon: "✗" },
    { label: "Telat", value: rekapData?.total_telat || 0, color: "secondary", icon: "⏳" },
    { label: "Pulang Cepat", value: rekapData?.total_pulang_cepat || 0, color: "secondary", icon: "🏃" },
  ];

  const fetchLogoSetting = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/setting`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.message?.[0];
      if (data?.logo_kecil) setLogoKecil(data.logo_kecil);
    } catch (error) {
      console.error("Gagal mengambil logo kecil:", error);
    }
  };
  
  // 🔥 Tambahkan fungsi ini sebelum return JSX
  const getSignatureInfo = (jabatan) => {
    const jabatanName = jabatan?.nama_jabatan?.toLowerCase() || '';
    
    const isGroup1 = 
      jabatanName.includes('staff ahli') || 
      jabatanName.includes('direksi') || 
      jabatanName.includes('direktur') || 
      jabatanName.includes('manager') || 
      jabatanName.includes('stafsus presdir');
    
    const isGroup2 = 
      jabatanName.includes('stafsus preskom') || 
      jabatanName.includes('presiden komisaris') || 
      jabatanName.includes('komisaris muda');
    
    const isPresdir = jabatanName.includes('presiden direktur');
    
    if (isGroup1 || isPresdir) {
      return {
        type: 'presdir',
        qrImage: qrBuNova,
        qrName: 'CHISKA NOVA HARSELA, M.P',
        qrTitle: 'Presiden Direktur',
        financeImage: ttdBuEvi,
        financeName: 'EVI LATIFAH, SE',
        financeTitle: 'Direktur Keuangan'
      };
    } else if (isGroup2) {
      return {
        type: 'preskom',
        qrImage: qrPakPreskom,
        qrName: 'DR. H TAUFIK RIDWAN, M.HUM',
        qrTitle: 'Presiden Komisaris',
        financeImage: ttdBuEvi,
        financeName: 'EVI LATIFAH, SE',
        financeTitle: 'Direktur Keuangan'
      };
    }
    
    return null;
  };

  return (
    <div className="container mt-4">
      {/* Alert message */}
      {alert.message && (
        <Alert variant={alert.type} className="mb-3" onClose={() => setAlert({ type: "", message: "" })} dismissible>
          {alert.message}
        </Alert>
      )}

      {/* Header with Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="nav-tabs-custom px-3 pt-3"
            fill
          >
            <Tab
              eventKey="profile"
              title={
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <FiUser />
                  <span>Profile</span>
                  {/* <span>Profil & Slip Gaji</span> */}
                </span>
              }
            >
              <div className="p-3">
                {/* KONTEN ASLI PROFIL & SLIP GAJI - TIDAK DIRUBAH SEDIKITPUN */}
                <div className="row">
                  {/* Kolom Profil */}
                  <div className="col-md-12 mb-4">
                    <Card className="shadow-sm border-0 rounded-4 p-3 h-100">
                      <div className="text-center">
                        <img
                          src={preview}
                          alt="profile"
                          className="rounded-circle shadow"
                          style={{
                            width: "110px",
                            height: "110px",
                            objectFit: "cover",
                            border: "3px solid #f3f3f3",
                          }}
                        />
                        <h4 className="mt-3 mb-0 fw-bold">{formData.name}</h4>
                        <p className="text-muted">{formData.email}</p>
                        <Button variant="primary" className="mt-2 px-4" onClick={() => setShowEdit(true)}>
                          Edit Profil
                        </Button>
                      </div>
                      <hr />
                      <h5 className="fw-bold mb-3"><FiUser className="me-2" /> Informasi Personal</h5>
                      <div className="ps-1">
                        <p><strong>Nama Absen:</strong> {mappedUser.nama_absen || "-"}</p>
                        <p><strong>Holding:</strong> {mappedUser.holding?.name || "-"}</p>
                        <p><strong>Jabatan:</strong> {mappedUser.jabatan?.nama_jabatan || "-"}</p>
                        <p><strong>Status Talent:</strong>
                          <Badge bg="info" className="ms-2">{mappedUser.status_talent?.nama || "-"}</Badge>
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* Kolom Slip Gaji - DIKOMENTARI */}
                  {/* 
                  <div className="col-md-8 mb-4">
                    <div className="d-flex gap-2 mb-3">
                      <Form.Select
                        value={selectedMonth}
                        onChange={(e) => handleFilterChange(Number(e.target.value), selectedYear)}
                        size="sm"
                        style={{ width: "140px" }}
                      >
                        {months.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </Form.Select>
                      <Form.Select
                        value={selectedYear}
                        onChange={(e) => handleFilterChange(selectedMonth, Number(e.target.value))}
                        size="sm"
                        style={{ width: "100px" }}
                      >
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </Form.Select>
                    </div>
                    <div id="slip-gaji-container">
                      <Card className="shadow-sm border-0 rounded-4 h-100">
                        <Card.Header className="border-0 py-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <img src={logo} alt="Logo" height={28} className="me-2" />
                              <h4 className="mb-0 fw-bold">Slip Gaji</h4>
                            </div>
                            
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={handleDownloadPDF}
                              disabled={downloadingPDF}
                            >
                              {downloadingPDF ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  Membuat PDF...
                                </>
                              ) : (
                                <>
                                  <FaDownload className="me-1" />
                                  Download PDF
                                </>
                              )}
                            </Button>
                          </div>
                        </Card.Header>

                        <Card.Body>
                          {loadingRekap ? (
                            <div className="text-center py-5">
                              <Spinner animation="border" variant="primary" />
                              <p className="mt-2 text-muted">Memuat data slip gaji...</p>
                            </div>
                          ) : rekapData ? (
                            <>
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <div>
                                    <h4 className="fw-bold mb-1 text-body">{formData.name}</h4>
                                    <p className="text-body-secondary mb-0">
                                      {mappedUser.jabatan?.nama_jabatan || "-"} • Periode {formatMonthYear(rekapData.datetime)}
                                    </p>
                                  </div>
                                  <div className="text-end">
                                    <div className="text-body-secondary mb-1">Take Home Pay Bersih</div>
                                    <h3 className="fw-bold text-success mb-0">{formatCurrency(rekapData.gaji_bersih)}</h3>
                                  </div>
                                </div>
                              </div>

                              <div className="row">
                                <div className="col-md-12">
                                  <Card className="mb-4 border-0 shadow-sm">
                                    <Card.Body>
                                      <h5 className="fw-bold mb-3 text-primary">Ringkasan Gaji</h5>
                                      <div className="mb-4">
                                        <div className="d-flex justify-content-between py-2 border-bottom">
                                          <span>Gaji Pokok</span>
                                          <span className="fw-semibold">
                                            {formatCurrency(
                                              rekapData.payroll?.payrollIncomes
                                                ?.filter(income => income.category?.name === "Gaji" || income.category?.name.toLowerCase().includes("gaji"))
                                                .reduce((total, income) => total + (Number(income.gross_amount) || 0), 0) || rekapData.gaji
                                            )}
                                          </span>
                                        </div>
                                        <div className="d-flex justify-content-between py-2 border-bottom">
                                          <div className="d-flex align-items-center">
                                            <span>Potongan Denda Terlambat</span>
                                            <Button
                                              variant="link"
                                              className="p-0 ms-2"
                                              size="sm"
                                              onClick={() => {
                                                setTelatDates(rekapData.telat_detail ?? []);
                                                setShowTelatModal(true);
                                              }}
                                            >
                                              <small className="text-muted">({rekapData.total_telat} hari)</small>
                                            </Button>
                                          </div>
                                          <span className="fw-semibold text-danger">- {formatCurrency(rekapData.total_denda)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between py-3 bg-light rounded">
                                          <span className="fw-bold">Total Gaji Setelah Potongan</span>
                                          <span className="fw-bold text-primary">
                                            {formatCurrency(
                                              (rekapData.payroll?.payrollIncomes
                                                ?.filter(income => income.category?.name === "Gaji" || income.category?.name.toLowerCase().includes("gaji"))
                                                .reduce((total, income) => total + (Number(income.net_amount) || 0), 0) || rekapData.gaji)
                                              - (rekapData.total_denda || 0)
                                            )}
                                          </span>
                                        </div>
                                      </div>

                                      {(() => {
                                        const allIncomes = rekapData.payroll?.payrollIncomes || [];
                                        const groupedByCategory = allIncomes.reduce((groups, income) => {
                                          const categoryName = income.category?.name || "Lainnya";
                                          if (!groups[categoryName]) {
                                            groups[categoryName] = { incomes: [], totalNet: 0, totalGross: 0 };
                                          }
                                          groups[categoryName].incomes.push(income);
                                          groups[categoryName].totalNet += Number(income.net_amount) || 0;
                                          groups[categoryName].totalGross += Number(income.gross_amount) || 0;
                                          return groups;
                                        }, {});

                                        return (
                                          <>
                                            {Object.entries(groupedByCategory).map(([categoryName, data], index) => (
                                              <div key={categoryName} className={index < Object.keys(groupedByCategory).length - 1 ? "mb-4" : ""}>
                                                {data.incomes.map((income, incomeIndex) => (
                                                  <div key={incomeIndex}>
                                                    <div className="d-flex justify-content-between py-2 border-bottom">
                                                      <div><strong>{income.category?.name}</strong></div>
                                                      
                                                      <div className="text-end">
                                                        <span className="text-success"> {formatCurrency(income.gross_amount)}</span>
                                                        {income.deductions?.length > 0 && (
                                                          <div className="small text-danger">
                                                            Potongan: -{formatCurrency(income.gross_amount - income.net_amount)}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    {income.deductions?.map((deduction, dIndex) => (
                                                      <div key={dIndex} className="d-flex justify-content-between ps-0 py-1 text-muted">
                                                        <span>{deduction.deduction_type?.name}</span>
                                                        <span className="text-danger">- {formatCurrency(deduction.amount)}</span>
                                                      </div>
                                                    ))}
                                                    
                                                  </div>
                                                ))}
                                                <div className="d-flex justify-content-between py-2">
                                                  <span className="fw-semibold">Total {categoryName}</span>
                                                  <span className="fw-semibold text-success">+ {formatCurrency(data.totalNet)}</span>
                                                </div>
                                                {categoryName.toLowerCase().includes('tunjangan prestasi') && (
                                                  <span className="mt-1 small text-muted">
                                                    {formatCurrency(data.totalNet / 2)} Pertahap
                                                  </span>
                                                )}
                                              </div>
                                            ))}

                                            <div>
                                              <h6 className="fw-bold mb-3 mt-4">Ringkasan Akhir</h6>
                                              <div className="mb-3">
                                                <div className="d-flex justify-content-between mb-2">
                                                  <span>Total Pendapatan Kotor</span>
                                                  <span className="fw-bold">
                                                    {formatCurrency(rekapData.total_pendapatan_kotor ||
                                                      ((rekapData.gaji_pokok || 0) +
                                                        (rekapData.total_tunjangan_prestasi || 0) +
                                                        (rekapData.total_tunjangan_kinerja || 0) +
                                                        (rekapData.total_tunjangan_lainnya || 0)))}
                                                  </span>
                                                </div>
                                                {rekapData.total_potongan_denda > 0 && (
                                                  <div className="d-flex justify-content-between mb-2">
                                                    <span>Potongan Denda</span>
                                                    <span className="fw-bold text-danger">- {formatCurrency(rekapData.total_potongan_denda)}</span>
                                                  </div>
                                                )}
                                                <div className="d-flex justify-content-between mb-2">
                                                  <span>Total Potongan</span>
                                                  <span className="fw-bold text-danger">
                                                    - {formatCurrency(rekapData.total_semua_potongan ||
                                                      ((rekapData.total_potongan_denda || 0) + (rekapData.total_potongan_lainnya || 0)))}
                                                  </span>
                                                </div>
                                                <hr className="border-white opacity-50" />
                                                <div className="d-flex justify-content-between">
                                                  <span className="fw-bold">Take Home Pay Bersih</span>
                                                  <span className="fw-bold fs-5">
                                                    {formatCurrency(rekapData.gaji_bersih ||
                                                      ((rekapData.total_pendapatan_kotor ||
                                                        ((rekapData.gaji_pokok || 0) +
                                                          (rekapData.total_tunjangan_prestasi || 0) +
                                                          (rekapData.total_tunjangan_kinerja || 0) +
                                                          (rekapData.total_tunjangan_lainnya || 0))) -
                                                        (rekapData.total_semua_potongan ||
                                                          ((rekapData.total_potongan_denda || 0) + (rekapData.total_potongan_lainnya || 0)))))}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </>
                                        );
                                      })()}

                                      {(() => {
                                        const signatureInfo = getSignatureInfo(mappedUser.jabatan);
                                        return signatureInfo && (
                                          <div className="mt-5 pt-4 border-top">
                                            <div className="d-flex justify-content-between">
                                              <div style={{ minWidth: '200px' }}>
                                                <div className="mb-1">
                                                  <div className="fw-normal">Disetujui,</div>
                                                  <div className="fw-normal">{signatureInfo.qrTitle},</div>
                                                </div>
                                                <div className="my-1 text-start">
                                                  <img 
                                                    src={signatureInfo.qrImage} 
                                                    alt="QR Code" 
                                                    style={{ width: '100px', height: '100px', objectFit: 'contain' }} 
                                                  />
                                                </div>
                                                <div className="fw-bold">{signatureInfo.qrName}</div>
                                              </div>
                                              
                                              <div style={{ minWidth: '200px' }}>
                                                <div className="mb-1">
                                                  <div className="fw-normal" style={{ visibility: 'hidden' }}>Spacer</div> 
                                                  <div className="fw-normal">Direktur Keuangan,</div>
                                                </div>
                                                <div className="my-1 text-start">
                                                  <img 
                                                    src={signatureInfo.financeImage} 
                                                    alt="Tanda Tangan" 
                                                    style={{ width: '100px', height: '100px', objectFit: 'contain' }} 
                                                  />
                                                </div>
                                                <div className="fw-bold">{signatureInfo.financeName}</div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </Card.Body>
                                  </Card>
                                </div>
                              </div>

                              <div className="alert alert-light alert-dismissible fade show mb-0 mt-3" role="alert">
                                <div className="d-flex align-items-center">
                                  <FaInfoCircle className="text-info me-2" />
                                  <div>
                                    <small className="text-muted">
                                      <strong>Catatan:</strong> Slip gaji ini dibuat otomatis berdasarkan data payroll dan absensi.
                                      Total THP bersih sudah termasuk semua tunjangan dan potongan.
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-5">
                              <div className="mb-3">
                                <FaFileInvoiceDollar className="text-muted" style={{ fontSize: '2.5rem', opacity: 0.5 }} />
                              </div>
                              <h5 className="text-muted mb-2">Belum ada data slip gaji</h5>
                              <p className="text-muted mb-3">Data akan tersedia setelah periode penggajian.</p>
                              <Button variant="outline-secondary" size="sm" onClick={() => fetchRekapData(selectedMonth, selectedYear)}>
                                Cek Kembali
                              </Button>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                  */}
                </div>

                {/* Informasi Kehadiran - DIKOMENTARI */}
                
                <Card className="mb-4 border-0 shadow-sm">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">Informasi Kehadiran {formatMonthYear(rekapData?.datetime)}</h6>
                    {loadingRekap ? (
                      <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                    ) : rekapData ? (
                      <div className="mb-3">
                        <div className="row text-center">
                          <div className="col-2 mb-3"><div><div className="fw-bold fs-4">{rekapData.total_hari || 0}</div><div className="text-muted small">Hari Kerja</div></div></div>
                          <div className="col-2 mb-3"><div><div className="fw-bold fs-4">{rekapData.total_libur || 0}</div><div className="text-muted small">Hari Libur</div></div></div>
                          <div className="col-2 mb-3"><div><div className="fw-bold fs-4">{rekapData.total_hadir || 0}</div><div className="text-muted small">Hadir</div></div></div>
                          <div className="col-2 mb-3"><div><div className="fw-bold fs-4">{rekapData.total_telat || 0}</div><div className="text-muted small">Telat</div></div></div>
                          <div className="col-2 mb-3"><div><div className="fw-bold fs-4">{rekapData.total_izin || 0}</div><div className="text-muted small">Izin</div></div></div>
                          <div className="col-2 mb-3"><div><div className="fw-bold fs-4">{rekapData.total_sakit || 0}</div><div className="text-muted small">Sakit</div></div></div>
                        </div>
                        <div>
                          {/* <h5 className="fw-semibold mb-3">Informasi Denda</h5> */}
                          <div className="row">
                            {/* <div className="col-6">
                              <div className="mb-2">
                                <div className="text-muted small">Denda per Hari</div>
                                <div>{mappedUser.jabatan?.nominal_denda ? formatCurrency(mappedUser.jabatan.nominal_denda) : "Rp 0"}</div>
                              </div>
                            </div> */}
                            <div className="col-6">
                              <div className="mb-2">
                                <div className="text-muted small">Hari Telat</div>
                                <div>
                                  {rekapData.total_telat} hari
                                  <Button
                                    variant="link"
                                    className="p-0"
                                    onClick={() => {
                                      setTelatDates(rekapData.telat_detail ?? []);
                                      setShowTelatModal(true);
                                    }}
                                  >
                                    <small>(lihat detail)</small>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* <div className="text-muted small">
                            = {rekapData.total_telat} × {formatCurrency(mappedUser.jabatan?.nominal_denda || 0)} Total denda: {formatCurrency(rekapData.total_denda)}
                          </div> */}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3"><p className="text-muted">Data kehadiran belum tersedia</p></div>
                    )}
                  </Card.Body>
                </Card>
               
              </div>
            </Tab>

            <Tab
              eventKey="personal"
              title={
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <FaIdCard />
                  <span>Data Pribadi</span>
                </span>
              }
            >
              <div className="p-3">
                <PersonalInfo />
              </div>
            </Tab>
          </Tabs>
       
      </Card>

      {/* MODAL-MODAL - TIDAK DIRUBAH */}
      {/* Modal Edit Profil */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered size="md">
        <Modal.Header closeButton><Modal.Title>Edit Profil</Modal.Title></Modal.Header>
        <Modal.Body>
          {alert.message && <Alert variant={alert.type}>{alert.message}</Alert>}
          <Form onSubmit={handleSubmit}>
            <div className="text-center mb-3">
              <Image src={preview} roundedCircle className="shadow-sm" style={{ width: "100px", height: "100px", objectFit: "cover", border: "2px solid #eee" }} />
            </div>
            <Form.Group className="mb-3"><Form.Label className="fw-semibold small">Ubah Foto Profil</Form.Label><Form.Control type="file" accept="image/*" onChange={handleFileChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label className="fw-semibold small">Nama</Form.Label><Form.Control type="text" name="name" value={formData.name} onChange={handleChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label className="fw-semibold small">Email</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} /></Form.Group>
            <hr /><p className="text-muted small">Ganti password (opsional)</p>
            <Form.Group className="mb-3"><Form.Label className="fw-semibold small">Password Lama</Form.Label><Form.Control type="password" name="old_password" value={formData.old_password} onChange={handleChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label className="fw-semibold small">Password Baru</Form.Label><Form.Control type="password" name="new_password" value={formData.new_password} onChange={handleChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label className="fw-semibold small">Konfirmasi Password Baru</Form.Label><Form.Control type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} /></Form.Group>
            <div className="text-end">
              <Button variant="light" className="me-2" onClick={() => setShowEdit(false)}>Batal</Button>
              <Button variant="primary" type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan Perubahan"}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Detail Telat */}
      <Modal show={showTelatModal} onHide={() => setShowTelatModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light"><Modal.Title>Detail Tanggal Telat</Modal.Title></Modal.Header>
        <Modal.Body>
          {telatDates.length === 0 ? (
            <div className="text-center py-4"><FaInfoCircle className="text-muted mb-3" size={48} /><p className="text-muted">Tidak ada tanggal telat.</p></div>
          ) : (
            <>
              <Alert variant="info" className="mb-4"><FaInfoCircle className="me-2" />Anda dapat mengajukan komplain jika merasa tanggal berikut salah tercatat sebagai telat.</Alert>
              <div className="row">
                {telatDates
                  .filter((d) => {
                    if (!rekapData?.datetime) return true;
                    const dateObj = new Date(d);
                    const rekapDate = new Date(rekapData.datetime);
                    return dateObj.getMonth() === rekapDate.getMonth() && dateObj.getFullYear() === rekapDate.getFullYear();
                  })
                  .map((d, idx) => {
                    const dateObj = new Date(d);
                    const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    const komplain = komplainData.find(
                      k => k.tanggal === d && k.user_id === mappedUser.id
                    );
                    return (
                      <div className="col-md-6 mb-3" key={idx}>
                        <Card className="border h-100">
                          <Card.Body className="d-flex justify-content-between align-items-center">
                            <div><h6 className="fw-bold mb-1">{formattedDate}</h6></div>
                            {komplain ? (
                              <Badge bg={komplain.status === "pending" ? "warning" : komplain.status === "approved" ? "success" : komplain.status === "rejected" ? "danger" : "secondary"}>
                                {komplain.status === "pending" ? "Sedang Diverifikasi" : komplain.status === "approved" ? "Disetujui" : komplain.status === "rejected" ? "Ditolak" : ""}
                              </Badge>
                            ) : (
                              <Button variant="outline-warning" size="sm" onClick={() => handleOpenComplainModal(d)}>
                                <FaExclamationCircle className="me-1" /> Komplain
                              </Button>
                            )}
                          </Card.Body>
                        </Card>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowTelatModal(false)}>Tutup</Button></Modal.Footer>
      </Modal>

      {/* Modal Komplain */}
      <Modal show={showComplainModal} onHide={() => setShowComplainModal(false)} centered>
        <Modal.Header closeButton className="bg-warning bg-opacity-10">
          <Modal.Title><FaExclamationCircle className="text-warning me-2" /> Ajukan Komplain Telat</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitComplain}>
          <Modal.Body>
            {alert.message && <Alert variant={alert.type} className="mb-3">{alert.message}</Alert>}
            <Alert variant="warning" className="mb-4"><strong>Perhatian:</strong> Anda dapat mengajukan komplain jika merasa tanggal tersebut salah dicatat sebagai telat. Mohon siapkan bukti pendukung.</Alert>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Tanggal yang Dikomplain</Form.Label>
              <Form.Control
                type="text"
                value={selectedTelatDate ? new Date(selectedTelatDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                readOnly
                className="bg-light"
              />
              <Form.Text className="text-muted">Tanggal ini akan diverifikasi oleh tim HRD</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Alasan Komplain <span className="text-danger">*</span></Form.Label>
              <Form.Select value={complainForm.alasan} onChange={(e) => setComplainForm({ ...complainForm, alasan: e.target.value })} required>
                <option value="">Pilih alasan komplain</option>
                <option value="sakit">Sakit (dengan surat dokter)</option>
                <option value="izin">Izin yang sudah disetujui</option>
                <option value="kendala_teknis">Kendala teknis sistem</option>
                <option value="keadaan_darurat">Keadaan darurat</option>
                <option value="lainnya">Lainnya</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Keterangan Tambahan</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Jelaskan detail kejadian atau alasan lengkap..." value={complainForm.keterangan} onChange={(e) => setComplainForm({ ...complainForm, keterangan: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Bukti Foto <span className="text-danger">*</span> <small className="text-muted ms-2">(maks. 5MB)</small></Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setComplainForm({ ...complainForm, bukti_foto: e.target.files[0] })} required />
              <Form.Text className="text-muted">Contoh: Foto surat dokter, screenshot izin, atau bukti pendukung lainnya</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowComplainModal(false)} disabled={submittingComplain}>Batal</Button>
            <Button variant="warning" type="submit" disabled={submittingComplain || !complainForm.alasan || !complainForm.bukti_foto}>
              {submittingComplain ? (<><Spinner animation="border" size="sm" className="me-2" /> Mengirim...</>) : (<><FaExclamationCircle className="me-2" /> Ajukan Komplain</>)}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Custom CSS untuk tabs */}
      <style jsx>{`
        .nav-tabs-custom .nav-link {
          border: none;
          color: #6c757d;
          padding: 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .nav-tabs-custom .nav-link:hover {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.05);
        }
        
        .nav-tabs-custom .nav-link.active {
          color: #0d6efd;
          background-color: transparent;
          border-bottom: 2px solid #0d6efd;
        }
      `}</style>
    </div>
  );
};

export default Profile;