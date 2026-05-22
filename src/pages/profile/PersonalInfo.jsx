import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Spinner,
  Alert,
  Badge,
  Modal,
  Image,
  Tab,
  Nav,
} from "react-bootstrap";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { 
  FaEdit, FaPlus, FaTrash, FaSave, FaTimes, 
  FaFile, FaEye, FaUpload, FaIdCard,
  FaAddressCard, FaFilePdf, FaFileAlt,
  FaInfoCircle, FaUsers, FaCertificate, FaGraduationCap, 
  FaCheckCircle, FaCalendarAlt, FaUser, FaBriefcase, FaFile as FaFileIcon,
  FaHistory, FaExchangeAlt
} from "react-icons/fa";

const PersonalInfo = () => {
  const { user, setUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [loadingPendidikan, setLoadingPendidikan] = useState(false);
  const [loadingKompetensi, setLoadingKompetensi] = useState(false);
  const [loadingKaderisasi, setLoadingKaderisasi] = useState(false);
  const [loadingPekerjaan, setLoadingPekerjaan] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [editModePekerjaan, setEditModePekerjaan] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState("personal");
  
  // Mode edit global per section
  const [editModePersonal, setEditModePersonal] = useState(false);
  
  // State untuk Pendidikan
  const [showPendidikanModal, setShowPendidikanModal] = useState(false);
  const [editingPendidikan, setEditingPendidikan] = useState(null);
  const [pendidikanList, setPendidikanList] = useState([]);
  
  // State untuk Kompetensi
  const [showKompetensiModal, setShowKompetensiModal] = useState(false);
  const [editingKompetensi, setEditingKompetensi] = useState(null);
  const [kompetensiList, setKompetensiList] = useState([]);
  
  // State untuk Kaderisasi
  const [showKaderisasiModal, setShowKaderisasiModal] = useState(false);
  const [editingKaderisasi, setEditingKaderisasi] = useState(null);
  const [kaderisasiList, setKaderisasiList] = useState([]);
  
  // ========== STATE UNTUK PEKERJAAN (BARU) ==========
  const [showPekerjaanModal, setShowPekerjaanModal] = useState(false);
  const [editingPekerjaan, setEditingPekerjaan] = useState(null);
  const [pekerjaanList, setPekerjaanList] = useState([]);
  const [loadingPekerjaanData, setLoadingPekerjaanData] = useState({
    holding: false,
    jabatan: false,
    statusTalent: false
  });
  
  // Data master untuk dropdown
  const [holdingList, setHoldingList] = useState([]);
  const [jabatanList, setJabatanList] = useState([]);
  const [statusTalentList, setStatusTalentList] = useState([]);
  
  // Form data untuk pekerjaan (BARU)
  const [pekerjaanForm, setPekerjaanForm] = useState({
    holding_id: "",
    jabatan_id: "",
    jabatan_detail_id: "", 
    status_talent_id: "",
    tanggal_transisi: "",
    tanggal_keluar: "",
    keterangan: ""
  });

  // Fetch jabatan details saat jabatan_id berubah
  useEffect(() => {
    if (pekerjaanForm.jabatan_id) {
      fetchJabatanDetails(pekerjaanForm.jabatan_id);
    } else {
      setJabatanDetailList([]);
    }
  }, [pekerjaanForm.jabatan_id]);
  
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [uploadingSertifikat, setUploadingSertifikat] = useState(false);
  const [uploadingKompetensiFile, setUploadingKompetensiFile] = useState(false);
  const [uploadingKaderisasiFile, setUploadingKaderisasiFile] = useState(false);
  const [sertifikatFile, setSertifikatFile] = useState(null);

  const [jabatanDetailList, setJabatanDetailList] = useState([]);
  const [loadingJabatanDetails, setLoadingJabatanDetails] = useState(false);

  const [showDetailJabatanModal, setShowDetailJabatanModal] = useState(false);
  const [detailJabatanForm, setDetailJabatanForm] = useState({
    jabatan_id: "",
    nama_jabatan: ""
  });
  const [loadingDetailJabatan, setLoadingDetailJabatan] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
  const storageURL = `${baseURL}/storage/`;

  // Form data untuk personal info
  const [formData, setFormData] = useState({
    nik: "",
    nama_panggilan: "",
    jenis_kelamin: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    status_pernikahan: "",
    agama: "",
    no_kk: "",
    no_npwp: "",
    bpjs_kesehatan: "",
    bpjs_ketenagakerjaan: "",
    alamat_lengkap: "",
    no_hp: "",
    status_aktif: "aktif",
    tanggal_masuk: "",
  });

  // Form data untuk dokumen
  const [documents, setDocuments] = useState({
    ktp: null,
    kk: null,
    npwp: null,
    ijazah: null,
    sertifikat: null,
    kontrak_kerja: null,
    cv: null,
  });

  // Form data untuk pendidikan
  const [pendidikanForm, setPendidikanForm] = useState({
    riwayat_pendidikan: "",
    jurusan: "",
    "sekolah/kampus": "",
    "tahun_lulus": "",
    sertifikat: null,
    sertifikat_file: null,
  });

  // Form data untuk kompetensi
  const [kompetensiForm, setKompetensiForm] = useState({
    kompetensi: "",
    nama_sertifikat: "",
    nomor_sertifikat: "",
    masa_berlaku: "",
    file_sertifikat: null,
    file_sertifikat_file: null,
  });

  // Form data untuk kaderisasi
  const [kaderisasiForm, setKaderisasiForm] = useState({
    nama_training: "",
    penyelenggara: "",
    tanggal_training: "",
    hasil: "",
    sertifikat: null,
    sertifikat_file: null,
  });

  // Load data user
  useEffect(() => {
    if (user) {
      setFormData({
        nik: user.nik || "",
        nama_panggilan: user.nama_panggilan || "",
        jenis_kelamin: user.jenis_kelamin || "",
        tempat_lahir: user.tempat_lahir || "",
        tanggal_lahir: user.tanggal_lahir || "",
        status_pernikahan: user.status_pernikahan || "",
        agama: user.agama || "",
        no_kk: user.no_kk || "",
        no_npwp: user.no_npwp || "",
        bpjs_kesehatan: user.bpjs_kesehatan || "",
        bpjs_ketenagakerjaan: user.bpjs_ketenagakerjaan || "",
        alamat_lengkap: user.alamat_lengkap || "",
        no_hp: user.no_hp || "",
        status_aktif: user.status_aktif || "aktif",
        tanggal_masuk: user.tanggal_masuk || "",
      });

      setDocuments({
        ktp: user.ktp || null,
        kk: user.kk || null,
        npwp: user.npwp || null,
        ijazah: user.ijazah || null,
        sertifikat: user.sertifikat || null,
        kontrak_kerja: user.kontrak_kerja || null,
        cv: user.cv || null,
      });
    }
  }, [user]);


  // Sinkronisasi formData dengan user terbaru
useEffect(() => {
  if (user) {
    setFormData(prev => ({
      ...prev,
      nik: user.nik || "",
      nama_panggilan: user.nama_panggilan || "",
      jenis_kelamin: user.jenis_kelamin || "",
      tempat_lahir: user.tempat_lahir || "",
      tanggal_lahir: user.tanggal_lahir || "",
      status_pernikahan: user.status_pernikahan || "",
      agama: user.agama || "",
      no_kk: user.no_kk || "",
      no_npwp: user.no_npwp || "",
      bpjs_kesehatan: user.bpjs_kesehatan || "",
      bpjs_ketenagakerjaan: user.bpjs_ketenagakerjaan || "",
      alamat_lengkap: user.alamat_lengkap || "",
      no_hp: user.no_hp || "",
      status_aktif: user.status_aktif || "aktif",
      tanggal_masuk: user.tanggal_masuk || "",
    }));
  }
}, [user]); // ⬅️ JALANKAN SETIAP USER BERUBAH

  // Load semua data saat user tersedia
  useEffect(() => {
    if (user) {
      fetchPendidikan();
      fetchKompetensi();
      fetchKaderisasi();
      fetchPekerjaan(); // BARU: fetch data pekerjaan
      fetchMasterData(); // BARU: fetch master data untuk dropdown
    }
  }, [user]);

  // Setelah fetch pekerjaan, cek apakah ada pekerjaan aktif
 // Setelah fetch pekerjaan, cek apakah ada pekerjaan aktif dan update formData
useEffect(() => {
  if (pekerjaanList.length > 0) {
    const aktif = pekerjaanList.find(p => !p.tanggal_keluar);
    if (aktif) {
      // Update formData dengan data dari pekerjaan aktif
      setFormData(prev => ({
        ...prev,
        tanggal_masuk: aktif.tanggal_transisi || prev.tanggal_masuk
      }));
      
      // ⬅️ TAMBAHKAN INI: Update user context jika data pekerjaan aktif berbeda
      if (user) {
        // Cek apakah data user perlu diupdate
        let needUpdate = false;
        const updatedUser = { ...user };
        
        if (aktif.holding && (!user.holding || user.holding.id !== aktif.holding.id)) {
          updatedUser.holding = aktif.holding;
          needUpdate = true;
        }
        
        if (aktif.jabatan && (!user.jabatan || user.jabatan.id !== aktif.jabatan.id)) {
          updatedUser.jabatan = aktif.jabatan;
          needUpdate = true;
        }
        
        if (aktif.status_talent && (!user.status_talent || user.status_talent.id !== aktif.status_talent.id)) {
          updatedUser.status_talent = aktif.status_talent;
          needUpdate = true;
        }
        
        if (needUpdate) {
          setUser(updatedUser);
        }
      }
    }
  }
}, [pekerjaanList, user, setUser]);

useEffect(() => {
  const fetchFreshUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ✅ Update context dengan data fresh dari server
      setUser(res.data);
      
      // ✅ Juga simpan ke localStorage biar persist
      localStorage.setItem('user', JSON.stringify(res.data));
      
      console.log("✅ Fresh user data loaded on mount");
      
    } catch (err) {
      console.error("❌ Failed to fetch fresh user on mount:", err);
    }
  };
  
  // Jalankan saat component mount (termasuk setelah refresh)
  fetchFreshUser();
  
}, []);

  // 🔹 HELPER: Refresh user data dari server (panggil setelah save)
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      
    } catch (err) {
      console.error("❌ Failed to refresh user:", err);
      // Don't throw - background sync shouldn't break main flow
    }
  };

  // ========== FETCH MASTER DATA ==========
  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      
      // Fetch Holding
      setLoadingPekerjaanData(prev => ({ ...prev, holding: true }));
      const holdingRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/holdings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Holding response:", holdingRes.data);
      
       // Holding: langsung array
      if (Array.isArray(holdingRes.data)) {
        setHoldingList(holdingRes.data);
      } else if (holdingRes.data && Array.isArray(holdingRes.data.message)) {
        setHoldingList(holdingRes.data.message);
      } else {
        setHoldingList([]);
        console.warn("Holding data is not an array:", holdingRes.data);
      }
      
      // Fetch Jabatan
      setLoadingPekerjaanData(prev => ({ ...prev, jabatan: true }));
      const jabatanRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jabatans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Jabatan response:", jabatanRes.data);
      
      // Data berada di jabatanRes.data.message (array)
      if (jabatanRes.data && Array.isArray(jabatanRes.data.message)) {
        setJabatanList(jabatanRes.data.message);
      } else {
        setJabatanList([]);
        console.warn("Jabatan data is not an array:", jabatanRes.data);
      }
      
      // Fetch Status Talent
      setLoadingPekerjaanData(prev => ({ ...prev, statusTalent: true }));
      const statusRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/status-talent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Status Talent response:", statusRes.data);
      
      // Data berada di statusRes.data.message (array)
      if (statusRes.data && Array.isArray(statusRes.data.message)) {
        setStatusTalentList(statusRes.data.message);
      } else {
        setStatusTalentList([]);
        console.warn("Status Talent data is not an array:", statusRes.data);
      }
      
    } catch (error) {
      console.error("Gagal fetch master data:", error);
      showAlert("danger", "Gagal mengambil data master");
      
      // Set default empty array agar tidak error
      setHoldingList([]);
      setJabatanList([]);
      setStatusTalentList([]);
      
    } finally {
      setLoadingPekerjaanData({
        holding: false,
        jabatan: false,
        statusTalent: false
      });
    }
  };

  // ========== FETCH DATA PEKERJAAN ==========
  const fetchPekerjaan = async () => {
  if (!user) return;
  setLoadingPekerjaan(true);
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/pekerjaan/user/${user.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Pekerjaan response:", response.data);
    
    let pekerjaanData = [];
    if (response.data && Array.isArray(response.data.message)) {
      pekerjaanData = response.data.message;
    } else if (Array.isArray(response.data)) {
      pekerjaanData = response.data;
    }
    
    setPekerjaanList(pekerjaanData);
    
    // ⬅️ UPDATE USER DENGAN PEKERJAAN AKTIF TERBARU
    const aktif = pekerjaanData.find(p => !p.tanggal_keluar);
    if (aktif && user) {
      const updatedUser = { ...user };
      let needUpdate = false;
      
      if (aktif.holding && (!user.holding || user.holding.id !== aktif.holding.id)) {
        updatedUser.holding = aktif.holding;
        updatedUser.holding_id = aktif.holding.id;
        needUpdate = true;
      }
      
      if (aktif.jabatan && (!user.jabatan || user.jabatan.id !== aktif.jabatan.id)) {
        updatedUser.jabatan = aktif.jabatan;
        updatedUser.jabatan_id = aktif.jabatan.id;
        needUpdate = true;
      }
      
      if (aktif.status_talent && (!user.status_talent || user.status_talent.id !== aktif.status_talent.id)) {
        updatedUser.status_talent = aktif.status_talent;
        updatedUser.status_talent_id = aktif.status_talent.id;
        needUpdate = true;
      }
      
      if (needUpdate) {
        setUser(updatedUser);
      }
    }
    
  } catch (error) {
    console.error("Gagal mengambil data pekerjaan:", error);
    setPekerjaanList([]);
  } finally {
    setLoadingPekerjaan(false);
  }
};

// Fetch jabatan details berdasarkan jabatan_id yang dipilih
// Fetch jabatan details berdasarkan jabatan_id yang dipilih
const fetchJabatanDetails = async (jabatanId) => {
  if (!jabatanId) return;
  
  setLoadingJabatanDetails(true);
  try {
    const token = localStorage.getItem("authToken");
    // ⬅️ PAKAI ENDPOINT: /jabatans/{jabatan}/details
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/jabatans/${jabatanId}/details`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("Jabatan details response:", response.data);
    
    // Response langsung array
    if (Array.isArray(response.data)) {
      setJabatanDetailList(response.data);
    } else {
      setJabatanDetailList([]);
    }
    
  } catch (error) {
    console.error("Gagal fetch jabatan details:", error);
    setJabatanDetailList([]);
  } finally {
    setLoadingJabatanDetails(false);
  }
};

const handleSaveDetailJabatan = async (e) => {
  e.preventDefault();
  
  if (!detailJabatanForm.jabatan_id) {
    showAlert("danger", "Pilih jabatan terlebih dahulu");
    return;
  }
  
  if (!detailJabatanForm.nama_jabatan.trim()) {
    showAlert("danger", "Nama detail jabatan tidak boleh kosong");
    return;
  }
  
  setLoadingDetailJabatan(true);
  try {
    const token = localStorage.getItem("authToken");
    // ⬅️ PAKAI ENDPOINT: /jabatans/{jabatan}/details
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/jabatans/${detailJabatanForm.jabatan_id}/details`,
      {
        nama_jabatan: detailJabatanForm.nama_jabatan
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("Save detail response:", response.data);
    
    showAlert("success", "Detail jabatan berhasil ditambahkan");
    setShowDetailJabatanModal(false);
    setDetailJabatanForm({ jabatan_id: "", nama_jabatan: "" });
    
    // Refresh jabatan details untuk jabatan yang sedang dipilih
    if (pekerjaanForm.jabatan_id) {
      await fetchJabatanDetails(pekerjaanForm.jabatan_id);
    }
    
  } catch (error) {
    console.error("Error saving detail jabatan:", error);
    showAlert("danger", error.response?.data?.message || "Gagal menyimpan detail jabatan");
  } finally {
    setLoadingDetailJabatan(false);
  }
};


  // ==================== FETCH DATA ====================
  const fetchPendidikan = async () => {
    if (!user) return;
    setLoadingPendidikan(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/pendidikan/user/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendidikanList(response.data);
    } catch (error) {
      console.error("Gagal mengambil data pendidikan:", error);
    } finally {
      setLoadingPendidikan(false);
    }
  };

  const fetchKompetensi = async () => {
    if (!user) return;
    setLoadingKompetensi(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/kompetensi/user/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKompetensiList(response.data);
    } catch (error) {
      console.error("Gagal mengambil data kompetensi:", error);
    } finally {
      setLoadingKompetensi(false);
    }
  };

  const fetchKaderisasi = async () => {
    if (!user) return;
    setLoadingKaderisasi(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/kaderisasi/user/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKaderisasiList(response.data);
    } catch (error) {
      console.error("Gagal mengambil data kaderisasi:", error);
    } finally {
      setLoadingKaderisasi(false);
    }
  };

  // ==================== HANDLE SAVE SECTION ====================
  const handleSavePersonal = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/users/${user.id}/partial`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // REFRESH USER SETELAH SAVE
      await refreshUser();
      
      showAlert("success", "Data personal berhasil diperbarui!");
      setEditModePersonal(false);
      
    } catch (error) {
      showAlert("danger", error.response?.data?.message || "Gagal memperbarui data");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  

// Fungsi untuk menyimpan data pekerjaan utama (ke tabel pekerjaan)
const handleSavePekerjaanUtama = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("authToken");
    
    // Cari pekerjaan aktif user
    const pekerjaanAktif = pekerjaanList.find(p => !p.tanggal_keluar);
    
    if (pekerjaanAktif) {
      // ✅ 1. Update tanggal_transisi di tabel pekerjaan SAJA
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/pekerjaan/${pekerjaanAktif.id}`,
        {
          tanggal_transisi: formData.tanggal_masuk, // ← INI YANG AKAN BERUBAH DI PEKERJAAN
          keterangan: "Updated tanggal transisi dari edit data pekerjaan"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      // Jika tidak ada pekerjaan aktif, buat baru
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/pekerjaan`,
        {
          user_id: user.id,
          holding_id: user.holding_id,
          jabatan_id: user.jabatan_id,
          status_talent_id: user.status_talent_id,
          tanggal_transisi: formData.tanggal_masuk,
          keterangan: "Initial position from edit",
          created_by: user.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    
    // ✅ 2. Update HANYA status_aktif di tabel users (TANPA tanggal_masuk)
    // Hanya kirim status_aktif jika berubah
    if (formData.status_aktif !== user.status_aktif) {
      const userUpdateResponse = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/users/${user.id}/partial`,
        { 
          status_aktif: formData.status_aktif
          // ⬅️ HAPUS tanggal_masuk dari sini
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // ⬅️ UPDATE CONTEXT DENGAN DATA TERBARU
      setUser(userUpdateResponse.data.user);
    }
    
    // ⬅️ REFRESH DATA PEKERJAAN (untuk mendapatkan tanggal_transisi terbaru)
    await refreshUser();
    await fetchPekerjaan();
    
    showAlert("success", "Data pekerjaan berhasil diperbarui!");
    setEditModePekerjaan(false);
    
  } catch (error) {
    console.error('Error detail:', error.response?.data);
    showAlert("danger", error.response?.data?.message || "Gagal memperbarui data");
  } finally {
    setLoading(false);
  }
};

  // Handle upload dokumen
  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('document', file);
    formDataUpload.append('user_id', user.id);
    formDataUpload.append('document_type', docType);

    setUploadingDoc(true);
    setUploadingDocType(docType);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/users/upload-document`,
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDocuments(prev => ({
        ...prev,
        [docType]: response.data.file_path
      }));

      setUser(prev => ({
        ...prev,
        [docType]: response.data.file_path
      }));

      await refreshUser();

      showAlert("success", "Dokumen berhasil diupload!");
    } catch (error) {
      showAlert("danger", error.response?.data?.message || "Gagal upload dokumen");
    } finally {
      setUploadingDoc(false);
      setUploadingDocType(null);
    }
  };

  // Handle view dokumen
  const handleViewDocument = (docPath) => {
    if (!docPath) return;
    window.open(`${storageURL}${docPath}`, '_blank');
  };

  // Handle delete dokumen
  const handleDeleteDocument = async (docType) => {
    if (!window.confirm(`Yakin ingin menghapus dokumen ini?`)) return;

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/users/delete-document`,
        {
          data: { user_id: user.id, document_type: docType },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setDocuments(prev => ({
        ...prev,
        [docType]: null
      }));

      setUser(prev => ({
        ...prev,
        [docType]: null
      }));

      showAlert("success", "Dokumen berhasil dihapus!");
    } catch (error) {
      showAlert("danger", error.response?.data?.message || "Gagal menghapus dokumen");
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: "", message: "" }), 3000);
  };

  // ==================== PENDIDIKAN ====================
  const handlePendidikanInput = (e) => {
    setPendidikanForm({ ...pendidikanForm, [e.target.name]: e.target.value });
  };

  const handleSertifikatUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSertifikatFile(file);
    
    if (editingPendidikan) {
      const formData = new FormData();
      formData.append('sertifikat', file);
      formData.append('pendidikan_id', editingPendidikan.id);

      setUploadingSertifikat(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/pendidikan/upload-sertifikat/${editingPendidikan.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setPendidikanForm(prev => ({
          ...prev,
          sertifikat: response.data.file_path
        }));

        showAlert('success', 'Sertifikat berhasil diupload!');
      } catch (error) {
        showAlert('danger', 'Gagal upload sertifikat');
      } finally {
        setUploadingSertifikat(false);
      }
    } else {
      setPendidikanForm(prev => ({
        ...prev,
        sertifikat_file: file
      }));
    }
  };

  const handleViewSertifikat = (sertifikatPath) => {
    if (!sertifikatPath) return;
    window.open(`${storageURL}${sertifikatPath}`, '_blank');
  };

  const openPendidikanModal = (pendidikan = null) => {
    if (pendidikan) {
      setEditingPendidikan(pendidikan);
      setPendidikanForm({
        riwayat_pendidikan: pendidikan.riwayat_pendidikan || "",
        jurusan: pendidikan.jurusan || "",
        "sekolah/kampus": pendidikan["sekolah/kampus"] || "",
        "tahun_lulus": pendidikan["tahun_lulus"] || "",
        sertifikat: pendidikan.sertifikat || null,
        sertifikat_file: null,
      });
    } else {
      setEditingPendidikan(null);
      setPendidikanForm({
        riwayat_pendidikan: "",
        jurusan: "",
        "sekolah/kampus": "",
        "tahun_lulus": "",
        sertifikat: null,
        sertifikat_file: null,
      });
    }
    setShowPendidikanModal(true);
  };

  const handleSavePendidikan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('riwayat_pendidikan', pendidikanForm.riwayat_pendidikan);
      formData.append('jurusan', pendidikanForm.jurusan);
      formData.append('sekolah/kampus', pendidikanForm["sekolah/kampus"]);
      formData.append('tahun_lulus', pendidikanForm["tahun_lulus"]);
      
      if (pendidikanForm.sertifikat_file) {
        formData.append('sertifikat', pendidikanForm.sertifikat_file);
      }

      const url = editingPendidikan
        ? `${import.meta.env.VITE_API_BASE_URL}/pendidikan/${editingPendidikan.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/pendidikan`;
      
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingPendidikan) {
        formData.append('_method', 'PUT');
        await axios.post(url, formData, config);
      } else {
        await axios.post(url, formData, config);
      }

      showAlert('success', editingPendidikan 
        ? "Riwayat pendidikan berhasil diperbarui!" 
        : "Riwayat pendidikan berhasil ditambahkan!"
      );
      
      setShowPendidikanModal(false);
      fetchPendidikan();
      
    } catch (error) {
      console.error('Error detail:', error.response?.data);
      showAlert('danger', error.response?.data?.message || "Gagal menyimpan data pendidikan");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePendidikan = async (id) => {
    if (!window.confirm("Yakin ingin menghapus riwayat pendidikan ini?")) return;
    
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/pendidikan/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert('success', 'Riwayat pendidikan berhasil dihapus!');
      fetchPendidikan();
      
    } catch (error) {
      showAlert('danger', error.response?.data?.message || "Gagal menghapus data pendidikan");
    }
  };

  // ==================== KOMPETENSI ====================
  const handleKompetensiInput = (e) => {
    setKompetensiForm({ ...kompetensiForm, [e.target.name]: e.target.value });
  };

  const handleKompetensiFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (editingKompetensi) {
      const formData = new FormData();
      formData.append('file_sertifikat', file);
      formData.append('kompetensi_id', editingKompetensi.id);

      setUploadingKompetensiFile(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/kompetensi/upload-file/${editingKompetensi.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setKompetensiForm(prev => ({
          ...prev,
          file_sertifikat: response.data.file_path
        }));

        showAlert('success', 'File sertifikat berhasil diupload!');
      } catch (error) {
        showAlert('danger', 'Gagal upload file');
      } finally {
        setUploadingKompetensiFile(false);
      }
    } else {
      setKompetensiForm(prev => ({
        ...prev,
        file_sertifikat_file: file
      }));
    }
  };

  const handleViewKompetensiFile = (filePath) => {
    if (!filePath) return;
    window.open(`${storageURL}${filePath}`, '_blank');
  };

  const openKompetensiModal = (kompetensi = null) => {
    if (kompetensi) {
      setEditingKompetensi(kompetensi);
      setKompetensiForm({
        kompetensi: kompetensi.kompetensi || "",
        nama_sertifikat: kompetensi.nama_sertifikat || "",
        nomor_sertifikat: kompetensi.nomor_sertifikat || "",
        masa_berlaku: kompetensi.masa_berlaku || "",
        file_sertifikat: kompetensi.file_sertifikat || null,
        file_sertifikat_file: null,
      });
    } else {
      setEditingKompetensi(null);
      setKompetensiForm({
        kompetensi: "",
        nama_sertifikat: "",
        nomor_sertifikat: "",
        masa_berlaku: "",
        file_sertifikat: null,
        file_sertifikat_file: null,
      });
    }
    setShowKompetensiModal(true);
  };

  const handleSaveKompetensi = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('kompetensi', kompetensiForm.kompetensi);
      formData.append('nama_sertifikat', kompetensiForm.nama_sertifikat);
      formData.append('nomor_sertifikat', kompetensiForm.nomor_sertifikat);
      formData.append('masa_berlaku', kompetensiForm.masa_berlaku);
      
      if (kompetensiForm.file_sertifikat_file) {
        formData.append('file_sertifikat', kompetensiForm.file_sertifikat_file);
      }

      const url = editingKompetensi
        ? `${import.meta.env.VITE_API_BASE_URL}/kompetensi/${editingKompetensi.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/kompetensi`;
      
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingKompetensi) {
        formData.append('_method', 'PUT');
        await axios.post(url, formData, config);
      } else {
        await axios.post(url, formData, config);
      }

      showAlert('success', editingKompetensi 
        ? "Kompetensi berhasil diperbarui!" 
        : "Kompetensi berhasil ditambahkan!"
      );
      
      setShowKompetensiModal(false);
      fetchKompetensi();
      
    } catch (error) {
      console.error('Error detail:', error.response?.data);
      showAlert('danger', error.response?.data?.message || "Gagal menyimpan data kompetensi");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKompetensi = async (id) => {
    if (!window.confirm("Yakin ingin menghapus kompetensi ini?")) return;
    
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/kompetensi/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert('success', 'Kompetensi berhasil dihapus!');
      fetchKompetensi();
      
    } catch (error) {
      showAlert('danger', error.response?.data?.message || "Gagal menghapus kompetensi");
    }
  };

  // ==================== KADERISASI ====================
  const handleKaderisasiInput = (e) => {
    setKaderisasiForm({ ...kaderisasiForm, [e.target.name]: e.target.value });
  };

  const handleKaderisasiFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (editingKaderisasi) {
      const formData = new FormData();
      formData.append('sertifikat', file);
      formData.append('kaderisasi_id', editingKaderisasi.id);

      setUploadingKaderisasiFile(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/kaderisasi/upload-sertifikat/${editingKaderisasi.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setKaderisasiForm(prev => ({
          ...prev,
          sertifikat: response.data.file_path
        }));

        showAlert('success', 'Sertifikat berhasil diupload!');
      } catch (error) {
        showAlert('danger', 'Gagal upload sertifikat');
      } finally {
        setUploadingKaderisasiFile(false);
      }
    } else {
      setKaderisasiForm(prev => ({
        ...prev,
        sertifikat_file: file
      }));
    }
  };

  const handleViewKaderisasiFile = (filePath) => {
    if (!filePath) return;
    window.open(`${storageURL}${filePath}`, '_blank');
  };

  const openKaderisasiModal = (kaderisasi = null) => {
    if (kaderisasi) {
      setEditingKaderisasi(kaderisasi);
      setKaderisasiForm({
        nama_training: kaderisasi.nama_training || "",
        penyelenggara: kaderisasi.penyelenggara || "",
        tanggal_training: kaderisasi.tanggal_training || "",
        hasil: kaderisasi.hasil || "",
        sertifikat: kaderisasi.sertifikat || null,
        sertifikat_file: null,
      });
    } else {
      setEditingKaderisasi(null);
      setKaderisasiForm({
        nama_training: "",
        penyelenggara: "",
        tanggal_training: "",
        hasil: "",
        sertifikat: null,
        sertifikat_file: null,
      });
    }
    setShowKaderisasiModal(true);
  };

  const handleSaveKaderisasi = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('nama_training', kaderisasiForm.nama_training);
      formData.append('penyelenggara', kaderisasiForm.penyelenggara || '');
      formData.append('tanggal_training', kaderisasiForm.tanggal_training || '');
      formData.append('hasil', kaderisasiForm.hasil || '');
      
      if (kaderisasiForm.sertifikat_file) {
        formData.append('sertifikat', kaderisasiForm.sertifikat_file);
      }

      const url = editingKaderisasi
        ? `${import.meta.env.VITE_API_BASE_URL}/kaderisasi/${editingKaderisasi.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/kaderisasi`;
      
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingKaderisasi) {
        formData.append('_method', 'PUT');
        await axios.post(url, formData, config);
      } else {
        await axios.post(url, formData, config);
      }

      showAlert('success', editingKaderisasi 
        ? "Data kaderisasi berhasil diperbarui!" 
        : "Data kaderisasi berhasil ditambahkan!"
      );
      
      setShowKaderisasiModal(false);
      fetchKaderisasi();
      
    } catch (error) {
      console.error('Error detail:', error.response?.data);
      showAlert('danger', error.response?.data?.message || "Gagal menyimpan data kaderisasi");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKaderisasi = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data kaderisasi ini?")) return;
    
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/kaderisasi/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert('success', 'Data kaderisasi berhasil dihapus!');
      fetchKaderisasi();
      
    } catch (error) {
      showAlert('danger', error.response?.data?.message || "Gagal menghapus data kaderisasi");
    }
  };

  // ========== HANDLER UNTUK PEKERJAAN (BARU) ==========
  const handlePekerjaanInput = (e) => {
    setPekerjaanForm({ ...pekerjaanForm, [e.target.name]: e.target.value });
  };

  const openPekerjaanModal = (pekerjaan = null) => {
  if (pekerjaan) {
    setEditingPekerjaan(pekerjaan);
    setPekerjaanForm({
      holding_id: pekerjaan.holding_id || "",
      jabatan_id: pekerjaan.jabatan_id || "",
      jabatan_detail_id: pekerjaan.jabatan_detail_id || "",
      status_talent_id: pekerjaan.status_talent_id || "",
      tanggal_transisi: pekerjaan.tanggal_transisi || "",
      tanggal_keluar: pekerjaan.tanggal_keluar || "",
      keterangan: pekerjaan.keterangan || ""
    });
    // Fetch details untuk jabatan ini
    if (pekerjaan.jabatan_id) {
      fetchJabatanDetails(pekerjaan.jabatan_id);
    }
  } else {
    setEditingPekerjaan(null);
    setPekerjaanForm({
      holding_id: "",
      jabatan_id: "",
      jabatan_detail_id: "",
      status_talent_id: "",
      tanggal_transisi: "",
      tanggal_keluar: "",
      keterangan: ""
    });
    setJabatanDetailList([]);
  }
  setShowPekerjaanModal(true);
};

  const handleSavePekerjaan = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const token = localStorage.getItem("authToken");
    
    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('holding_id', pekerjaanForm.holding_id);
    formData.append('jabatan_id', pekerjaanForm.jabatan_id);
    // ⬅️ KIRIM jabatan_detail_id (bisa kosong)
    if (pekerjaanForm.jabatan_detail_id) {
      formData.append('jabatan_detail_id', pekerjaanForm.jabatan_detail_id);
    }
    formData.append('status_talent_id', pekerjaanForm.status_talent_id);
    formData.append('tanggal_transisi', pekerjaanForm.tanggal_transisi);
    formData.append('tanggal_keluar', pekerjaanForm.tanggal_keluar || '');
    formData.append('keterangan', pekerjaanForm.keterangan || '');

    const url = editingPekerjaan
      ? `${import.meta.env.VITE_API_BASE_URL}/pekerjaan/${editingPekerjaan.id}`
      : `${import.meta.env.VITE_API_BASE_URL}/pekerjaan`;
    
    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    };

    if (editingPekerjaan) {
      formData.append('_method', 'PUT');
      await axios.post(url, formData, config);
    } else {
      await axios.post(url, formData, config);
    }

    showAlert('success', editingPekerjaan 
      ? "Riwayat pekerjaan berhasil diperbarui!" 
      : "Riwayat pekerjaan berhasil ditambahkan!"
    );
    
    setShowPekerjaanModal(false);
    fetchPekerjaan();
    
  } catch (error) {
    console.error('Error detail:', error.response?.data);
    showAlert('danger', error.response?.data?.message || "Gagal menyimpan data pekerjaan");
  } finally {
    setLoading(false);
  }
};

  const handleDeletePekerjaan = async (id) => {
    if (!window.confirm("Yakin ingin menghapus riwayat pekerjaan ini?")) return;
    
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/pekerjaan/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert('success', 'Riwayat pekerjaan berhasil dihapus!');
      fetchPekerjaan();
      
    } catch (error) {
      showAlert('danger', error.response?.data?.message || "Gagal menghapus data pekerjaan");
    }
  };
  const handleDetailJabatanInput = (e) => {
  setDetailJabatanForm({ ...detailJabatanForm, [e.target.name]: e.target.value });
};

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  

 

  const getStatusBadge = (status) => {
    switch(status) {
      case 'aktif':
        return <Badge bg="success">Aktif</Badge>;
      case 'nonaktif':
        return <Badge bg="danger">Non Aktif</Badge>;
      case 'cuti':
        return <Badge bg="warning">Cuti</Badge>;
      case 'resign':
        return <Badge bg="secondary">Resign</Badge>;
      default:
        return <Badge bg="secondary">-</Badge>;
    }
  };

  const renderReadOnlyField = (label, value) => (
    <div className="mb-3">
      <small className="text-muted">{label}</small>
      <div className="p-2 bg-light rounded mt-1">
        {value || <span className="text-muted fst-italic">-</span>}
      </div>
    </div>
  );

  const renderEditableField = (label, field, type = "text", options = null) => (
    <div className="mb-3">
      <small className="text-muted">{label}</small>
      {options ? (
        <Form.Select
          name={field}
          value={formData[field]}
          onChange={handleInputChange}
          className="mt-1"
          size="sm"
        >
          <option value="">Pilih {label}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Form.Select>
      ) : type === "textarea" ? (
        <Form.Control
          as="textarea"
          rows={2}
          name={field}
          value={formData[field]}
          onChange={handleInputChange}
          className="mt-1"
          size="sm"
        />
      ) : (
        <Form.Control
          type={type}
          name={field}
          value={formData[field]}
          onChange={handleInputChange}
          className="mt-1"
          size="sm"
        />
      )}
    </div>
  );

  // RENDER DOCUMENT CARD
  const renderDocumentCard = (label, docType, icon) => {
    const docPath = documents[docType];
    const hasDocument = !!docPath;
    const isUploading = uploadingDoc && uploadingDocType === docType;

    return (
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <div className="text-primary">{icon}</div>
              <h6 className="mb-0">{label}</h6>
            </div>
            <Badge bg={hasDocument ? "success" : "secondary"} pill>
              {hasDocument ? "Ada" : "Kosong"}
            </Badge>
          </div>

          {hasDocument ? (
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleViewDocument(docPath)}
                className="flex-grow-1"
              >
                <FaEye className="me-1" /> Lihat
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDeleteDocument(docType)}
              >
                <FaTrash />
              </Button>
            </div>
          ) : isUploading ? (
            <div className="text-center py-2">
              <Spinner size="sm" /> <small className="ms-2">Uploading...</small>
            </div>
          ) : (
            <Form.Group>
              <Form.Control
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentUpload(e, docType)}
                disabled={uploadingDoc}
                size="sm"
              />
              <Form.Text className="text-muted small">
                PDF/JPG/PNG (max 5MB)
              </Form.Text>
            </Form.Group>
          )}
        </Card.Body>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  // Options untuk select
  const genderOptions = [
    { value: "Laki-laki", label: "Laki-laki" },
    { value: "Perempuan", label: "Perempuan" },
  ];

  const statusPernikahanOptions = [
    { value: "Belum Menikah", label: "Belum Menikah" },
    { value: "Menikah", label: "Menikah" },
    { value: "Cerai Hidup", label: "Cerai Hidup" },
    { value: "Cerai Mati", label: "Cerai Mati" },
  ];

  const agamaOptions = [
    { value: "Islam", label: "Islam" },
    { value: "Kristen", label: "Kristen" },
    { value: "Katolik", label: "Katolik" },
    { value: "Buddha", label: "Buddha" },
    { value: "Hindu", label: "Hindu" },
    { value: "Konghucu", label: "Konghucu" },
  ];

  const statusAktifOptions = [
    { value: "aktif", label: "Aktif" },
    { value: "nonaktif", label: "Non Aktif" },
    { value: "cuti", label: "Cuti" },
    { value: "resign", label: "Resign" },
  ];

  const jenjangOptions = [
    { value: "PAUD", label: "PAUD" },
    { value: "TK", label: "TK" }, 
    { value: "SD", label: "SD" },
    { value: "SMP", label: "SMP" },
    { value: "SMA", label: "SMA" },
    { value: "SMK", label: "SMK" },
    { value: "D1", label: "D1" },
    { value: "D2", label: "D2" },
    { value: "D3", label: "D3" },
    { value: "D4", label: "D4" },
    { value: "S1", label: "S1" },
    { value: "S2", label: "S2" },
    { value: "S3", label: "S3" },
  ];

  const hasilOptions = [
    { value: "Lulus", label: "Lulus" },
    { value: "Tidak Lulus", label: "Tidak Lulus" },
    { value: "Lulus Bersyarat", label: "Lulus Bersyarat" },
  ];

  const kaderisasiOptions = [
    { value: "LAPRY", label: "LAPRY" },
    { value: "LADIUM", label: "LADIUM" },
    { value: "LASPERT", label: "LASPERT" },
    { value: "LASTER", label: "LASTER" },
  ];

  return (
    <div className="container-fluid px-0">
      {alert.message && (
        <Alert variant={alert.type} className="mb-3" dismissible onClose={() => setAlert({ type: "", message: "" })}>
          {alert.message}
        </Alert>
      )}

      {/* Profile Ringkas - Tetap di atas */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col xs="auto">
              <Image
                src={user.foto ? `${storageURL}${user.foto}` : "/default-avatar.png"}
                roundedCircle
                style={{ width: "60px", height: "60px", objectFit: "cover" }}
              />
            </Col>
            <Col>
              <h5 className="mb-1">{user.name}</h5>
              <p className="text-muted small mb-1">{user.email}</p>
              <div className="d-flex gap-2 flex-wrap">
                <small className="text-muted">{user.holding?.name || '-'}</small>
                <small className="text-muted">•</small>
                <small className="text-muted">{user.jabatan?.nama_jabatan || '-'}</small>
                <small className="text-muted">•</small>
                {getStatusBadge(user.status_aktif)}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Navigation Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-0 p-0">
          <Nav variant="tabs" className="px-3 pt-3" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav.Item>
              <Nav.Link eventKey="personal" className="d-flex align-items-center gap-2">
                <FaUser size={14} /> Personal
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="pekerjaan" className="d-flex align-items-center gap-2">
                <FaBriefcase size={14} /> Riwayat Pekerjaan
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="pendidikan" className="d-flex align-items-center gap-2">
                <FaGraduationCap size={14} /> Pendidikan
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="kompetensi" className="d-flex align-items-center gap-2">
                <FaCertificate size={14} /> Kompetensi
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="kaderisasi" className="d-flex align-items-center gap-2">
                <FaUsers size={14} /> Kaderisasi
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="dokumen" className="d-flex align-items-center gap-2">
                <FaFileIcon size={14} /> Dokumen
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
      </Card>

      {/* Tab Content */}
      <div className="tab-content mt-0">
        {/* Personal Tab */}
        {activeTab === "personal" && (
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Data Personal</h5>
              {editModePersonal ? (
                <div>
                  <Button variant="link" size="sm" className="text-danger me-2" onClick={() => setEditModePersonal(false)}>
                    <FaTimes /> Batal
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSavePersonal} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : <FaSave className="me-1" />} Simpan
                  </Button>
                </div>
              ) : (
                <Button variant="link" size="sm" className="text-primary" onClick={() => setEditModePersonal(true)}>
                  <FaEdit className="me-1" /> Edit
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {editModePersonal ? (
                <Row>
                  <Col md={6}>
                    {renderEditableField("Nama Panggilan", "nama_panggilan")}
                    {renderEditableField("NIK", "nik")}
                    {renderEditableField("Jenis Kelamin", "jenis_kelamin", "select", genderOptions)}
                    {renderEditableField("Tempat Lahir", "tempat_lahir")}
                    {renderEditableField("Tanggal Lahir", "tanggal_lahir", "date")}
                    {renderEditableField("Status Pernikahan", "status_pernikahan", "select", statusPernikahanOptions)}
                    {renderEditableField("Tanggal Awal Masuk SCI", "tanggal_masuk", "date")}
                  </Col>
                  <Col md={6}>
                    {renderEditableField("Agama", "agama", "select", agamaOptions)}
                    {renderEditableField("No. KK", "no_kk")}
                    {renderEditableField("NPWP", "no_npwp")}
                    {renderEditableField("BPJS Kesehatan", "bpjs_kesehatan")}
                    {renderEditableField("BPJS Ketenagakerjaan", "bpjs_ketenagakerjaan")}
                    {renderEditableField("No. HP", "no_hp")}
                  </Col>
                  <Col md={12}>
                    {renderEditableField("Alamat Lengkap", "alamat_lengkap", "textarea")}
                  </Col>
                </Row>
              ) : (
                <Row>
                  <Col md={6}>
                    {renderReadOnlyField("Nama Lengkap", user.name)}
                    {renderReadOnlyField("Nama Panggilan", user.nama_panggilan)}
                    {renderReadOnlyField("NIK", user.nik)}
                    {renderReadOnlyField("Jenis Kelamin", user.jenis_kelamin)}
                    {renderReadOnlyField("Tempat Lahir", user.tempat_lahir)}
                    {renderReadOnlyField("Tanggal Lahir", formatDate(user.tanggal_lahir))}
                    {renderReadOnlyField("Status Pernikahan", user.status_pernikahan)}
                    {renderReadOnlyField("Tanggal Awal Masuk SCI", user.tanggal_masuk)}
                  </Col>
                  <Col md={6}>
                    {renderReadOnlyField("Agama", user.agama)}
                    {renderReadOnlyField("No. KK", user.no_kk)}
                    {renderReadOnlyField("NPWP", user.no_npwp)}
                    {renderReadOnlyField("BPJS Kesehatan", user.bpjs_kesehatan)}
                    {renderReadOnlyField("BPJS Ketenagakerjaan", user.bpjs_ketenagakerjaan)}
                    {renderReadOnlyField("No. HP", user.no_hp)}
                    {renderReadOnlyField("Alamat Lengkap", user.alamat_lengkap)}
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        )}

       {/* PEKERJAAN TAB */}
        {activeTab === "pekerjaan" && (
          <>
           
           {/* CARD DATA PEKERJAAN SAAT INI */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 d-flex align-items-center">
                  <FaBriefcase className="me-2 text-primary" />
                  Data Pekerjaan Saat Ini
                </h5>
                {editModePekerjaan ? (
                  <div>
                    <Button variant="link" size="sm" className="text-danger me-2" onClick={() => setEditModePekerjaan(false)}>
                      <FaTimes /> Batal
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSavePekerjaanUtama} disabled={loading}>
                      {loading ? <Spinner size="sm" /> : <FaSave className="me-1" />} Simpan
                    </Button>
                  </div>
                ) : (
                  <Button variant="link" size="sm" className="text-primary" onClick={() => setEditModePekerjaan(true)}>
                    <FaEdit className="me-1" /> Edit
                  </Button>
                )}
              </Card.Header>
              <Card.Body>
                {editModePekerjaan ? (
                  <Row>
                    <Col md={6}>
                      {renderEditableField("Tanggal Mulai Posisi Ini", "tanggal_masuk", "date")}
                    </Col>
                  </Row>
                ) : (
                  <Row>
                    <Col md={6}>
                      {renderReadOnlyField("Holding", user.holding?.name)}
                      {renderReadOnlyField("Jabatan", user.jabatan?.nama_jabatan)}
                      
                    </Col>
                    <Col md={6}>
                      {/* {renderReadOnlyField("Tanggal Bergabung", formatDate(user.tanggal_masuk))} */}
                      {renderReadOnlyField("Status Talent", user.status_talent?.nama)}
                      {renderReadOnlyField(
                        "Tanggal Mulai Posisi Ini", 
                        formatDate(pekerjaanList.find(p => !p.tanggal_keluar)?.tanggal_transisi)
                      )}
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>

            {/* CARD RIWAYAT PEKERJAAN */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="border-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 d-flex align-items-center">
                  <FaHistory className="me-2 text-primary" />
                  Riwayat Pekerjaan
                </h5>
                {/* <Button variant="primary" size="sm" onClick={() => openPekerjaanModal()}>
                  <FaPlus className="me-1" /> Tambah Riwayat
                </Button> */}
              </Card.Header>
              <Card.Body>
                {loadingPekerjaan ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : pekerjaanList.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <FaHistory size={40} className="mb-3 text-muted opacity-50" />
                    <p className="mb-0">Belum ada riwayat pekerjaan</p>
                    <small className="text-muted">Klik tombol Tambah untuk menambahkan riwayat pertama</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead className="bg-light">
                        <tr>
                          <th>Holding</th>
                          <th>Jabatan</th>
                          <th>Detail Jabatan</th>
                          <th>Status Talent</th>
                          <th>Tanggal Transisi</th>
                          <th>Tanggal Keluar</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pekerjaanList.map((p) => {
                          const isAktif = !p.tanggal_keluar;
                          return (
                            <tr key={p.id}>
                              <td>
                                <Badge bg="info" className="me-1">
                                  {p.holding?.name || '-'}
                                </Badge>
                              </td>
                              <td className="fw-semibold">{p.jabatan?.nama_jabatan || '-'}</td>
                              <td>
                                {p.jabatan_detail ? (
                                  <div>
                                    <span className="fw-semibold">{p.jabatan?.nama_jabatan}</span>
                                    <br />
                                    <small className="text-muted">{p.jabatan_detail.nama_jabatan}</small>
                                  </div>
                                ) : (
                                  <span className="fw-semibold">{p.jabatan?.nama_jabatan}</span>
                                )}
                              </td>
                              <td>
                                {p.status_talent && (
                                  <Badge bg="secondary">{p.status_talent.nama}</Badge>
                                )}
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaCalendarAlt className="text-muted me-1" size={10} />
                                  <small>{formatDate(p.tanggal_transisi)}</small>
                                </div>
                              </td>
                              <td>
                                {p.tanggal_keluar ? (
                                  <div className="d-flex align-items-center">
                                    <FaCalendarAlt className="text-muted me-1" size={10} />
                                    <small>{formatDate(p.tanggal_keluar)}</small>
                                  </div>
                                ) : '-'}
                              </td>
                              <td>
                                {isAktif ? (
                                  <Badge bg="success" pill className="px-3">Aktif</Badge>
                                ) : (
                                  <Badge bg="secondary" pill className="px-3">Riwayat</Badge>
                                )}
                              </td>
                              <td>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 me-2 text-primary" 
                                  onClick={() => openPekerjaanModal(p)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 text-danger" 
                                  onClick={() => handleDeletePekerjaan(p.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}

        {/* Pendidikan Tab */}
        {activeTab === "pendidikan" && (
          <Card className="border-0 shadow-sm">
            <Card.Header className="border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 d-flex align-items-center">
                <FaGraduationCap className="me-2 text-primary" />
                Riwayat Pendidikan
              </h5>
              <Button variant="primary" size="sm" onClick={() => openPendidikanModal()}>
                <FaPlus className="me-1" /> Tambah
              </Button>
            </Card.Header>
            <Card.Body>
              {loadingPendidikan ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : pendidikanList.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">Belum ada data</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Pendidikan</th>
                        <th>Sekolah</th>
                        <th>Jurusan</th>
                        <th>Tahun Lulus</th>
                        <th>Ijazah</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendidikanList.map((p) => (
                        <tr key={p.id}>
                          <td><Badge bg="info">{p.riwayat_pendidikan}</Badge></td>
                          <td>{p['sekolah/kampus'] || "-"}</td>
                          <td>{p.jurusan || "-"}</td>
                          <td>{p['tahun_lulus'] || "-"}</td>
                          <td>
                            {p.sertifikat ? (
                              <Button variant="link" size="sm" className="p-0" onClick={() => handleViewSertifikat(p.sertifikat)}>
                                <FaFilePdf className="text-danger" />
                              </Button>
                            ) : "-"}
                          </td>
                          <td>
                            <Button variant="link" size="sm" className="p-0 me-2" onClick={() => openPendidikanModal(p)}>
                              <FaEdit className="text-primary" />
                            </Button>
                            <Button variant="link" size="sm" className="p-0" onClick={() => handleDeletePendidikan(p.id)}>
                              <FaTrash className="text-danger" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Kompetensi Tab */}
        {activeTab === "kompetensi" && (
          <Card className="border-0 shadow-sm">
            <Card.Header className="border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 d-flex align-items-center">
                <FaCertificate className="me-2 text-warning" />
                Kompetensi
              </h5>
              <Button variant="warning" size="sm" onClick={() => openKompetensiModal()}>
                <FaPlus className="me-1" /> Tambah
              </Button>
            </Card.Header>
            <Card.Body>
              {loadingKompetensi ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : kompetensiList.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">Belum ada data</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Kompetensi</th>
                        <th>Sertifikat</th>
                        <th>No. Sertifikat</th>
                        <th>Masa Berlaku</th>
                        <th>File</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {kompetensiList.map((k) => (
                        <tr key={k.id}>
                          <td>{k.kompetensi}</td>
                          <td>{k.nama_sertifikat}</td>
                          <td>{k.nomor_sertifikat || "-"}</td>
                          <td>{formatDate(k.masa_berlaku)}</td>
                          <td>
                            {k.file_sertifikat ? (
                              <Button variant="link" size="sm" className="p-0" onClick={() => handleViewKompetensiFile(k.file_sertifikat)}>
                                <FaFilePdf className="text-danger" />
                              </Button>
                            ) : "-"}
                          </td>
                          <td>
                            <Button variant="link" size="sm" className="p-0 me-2" onClick={() => openKompetensiModal(k)}>
                              <FaEdit className="text-primary" />
                            </Button>
                            <Button variant="link" size="sm" className="p-0" onClick={() => handleDeleteKompetensi(k.id)}>
                              <FaTrash className="text-danger" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Kaderisasi Tab */}
        {activeTab === "kaderisasi" && (
          <Card className="border-0 shadow-sm">
            <Card.Header className="border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 d-flex align-items-center">
                <FaUsers className="me-2 text-success" />
                Kaderisasi SDM
              </h5>
              <Button variant="success" size="sm" onClick={() => openKaderisasiModal()}>
                <FaPlus className="me-1" /> Tambah
              </Button>
            </Card.Header>
            <Card.Body>
              {loadingKaderisasi ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : kaderisasiList.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">Belum ada data</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Kaderisasi</th>
                        <th>Penyelenggara</th>
                        <th>Tanggal Pelaksanaan</th>
                        <th>Hasil</th>
                        <th>Sertifikat</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {kaderisasiList.map((k) => (
                        <tr key={k.id}>
                          <td>{k.nama_training}</td>
                          <td>{k.penyelenggara || "-"}</td>
                          <td>{formatDate(k.tanggal_training)}</td>
                          <td>
                            {k.hasil && (
                              <Badge bg={k.hasil === 'Lulus' ? 'success' : 'warning'}>
                                {k.hasil}
                              </Badge>
                            )}
                          </td>
                          <td>
                            {k.sertifikat ? (
                              <Button variant="link" size="sm" className="p-0" onClick={() => handleViewKaderisasiFile(k.sertifikat)}>
                                <FaFilePdf className="text-danger" />
                              </Button>
                            ) : "-"}
                          </td>
                          <td>
                            <Button variant="link" size="sm" className="p-0 me-2" onClick={() => openKaderisasiModal(k)}>
                              <FaEdit className="text-primary" />
                            </Button>
                            <Button variant="link" size="sm" className="p-0" onClick={() => handleDeleteKaderisasi(k.id)}>
                              <FaTrash className="text-danger" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Dokumen Tab */}
        {activeTab === "dokumen" && (
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Dokumen Pribadi</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  {renderDocumentCard("KTP", "ktp", <FaIdCard />)}
                  {renderDocumentCard("KK", "kk", <FaAddressCard />)}
                  {renderDocumentCard("NPWP", "npwp", <FaFileAlt />)}
                </Col>
                <Col md={6}>
                  {renderDocumentCard("Kontrak Kerja", "kontrak_kerja", <FaFile />)}
                  {renderDocumentCard("CV", "cv", <FaFileAlt />)}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </div>

  {/* MODAL TAMBAH DETAIL JABATAN */}
<Modal show={showDetailJabatanModal} onHide={() => setShowDetailJabatanModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>
      <FaInfoCircle className="me-2 text-primary" />
      Tambah Detail Jabatan
    </Modal.Title>
  </Modal.Header>
  <Form onSubmit={handleSaveDetailJabatan}>
    <Modal.Body>
      <Form.Group className="mb-3">
        <Form.Label>Jabatan <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          value={jabatanList.find(j => j.id === parseInt(detailJabatanForm.jabatan_id))?.nama_jabatan || ''}
          disabled
          readOnly
        />
        <Form.Text className="text-muted">
          Jabatan induk untuk detail ini
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Nama Detail Jabatan <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          name="nama_jabatan"
          value={detailJabatanForm.nama_jabatan}
          onChange={handleDetailJabatanInput}
          placeholder="Contoh: Staff Ahli Marketing, Supervisor IT, dll"
          required
        />
        <Form.Text className="text-muted">
          Nama spesifik posisi/jabatan
        </Form.Text>
      </Form.Group>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" size="sm" onClick={() => setShowDetailJabatanModal(false)}>
        Batal
      </Button>
      <Button variant="primary" size="sm" type="submit" disabled={loadingDetailJabatan}>
        {loadingDetailJabatan ? <Spinner size="sm" /> : "Simpan Detail"}
      </Button>
    </Modal.Footer>
  </Form>
</Modal>

    {/* MODAL PEKERJAAN (BARU) */}
<Modal show={showPekerjaanModal} onHide={() => setShowPekerjaanModal(false)} centered size="lg">
  <Modal.Header closeButton>
    <Modal.Title>
      {editingPekerjaan ? "Edit Riwayat Pekerjaan" : "Tambah Riwayat Pekerjaan"}
    </Modal.Title>
  </Modal.Header>
  <Form onSubmit={handleSavePekerjaan}>
    <Modal.Body>
      {/* ROW 1: Holding dan Jabatan */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FaUsers className="me-1 text-primary" size={12} />
              Holding <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="holding_id"
              value={pekerjaanForm.holding_id}
              onChange={handlePekerjaanInput}
              required
              disabled={editingPekerjaan || loadingPekerjaanData.holding}
            >
              <option value="">Pilih Holding</option>
              {holdingList.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FaBriefcase className="me-1 text-primary" size={12} />
              Jabatan <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="jabatan_id"
              value={pekerjaanForm.jabatan_id}
              onChange={handlePekerjaanInput}
              required
              disabled={editingPekerjaan || loadingPekerjaanData.jabatan}
            >
              <option value="">
                {loadingPekerjaanData.jabatan ? "Loading Jabatan..." : "Pilih Jabatan"}
              </option>
              {Array.isArray(jabatanList) && jabatanList.length > 0 ? (
                jabatanList.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.nama_jabatan || j.name}
                  </option>
                ))
              ) : (
                !loadingPekerjaanData.jabatan && (
                  <option disabled>Data jabatan tidak tersedia</option>
                )
              )}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* ROW 2: Detail Jabatan */}
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FaInfoCircle className="me-1 text-primary" size={12} />
              Detail Jabatan
            </Form.Label>
            <div className="d-flex gap-2">
              <Form.Select
                name="jabatan_detail_id"
                value={pekerjaanForm.jabatan_detail_id}
                onChange={handlePekerjaanInput}
                disabled={!pekerjaanForm.jabatan_id || loadingJabatanDetails}
                className="flex-grow-1"
              >
                <option value="">
                  {!pekerjaanForm.jabatan_id 
                    ? "Pilih jabatan terlebih dahulu" 
                    : loadingJabatanDetails 
                      ? "Loading detail..." 
                      : "-- Pilih Detail Jabatan (Opsional) --"}
                </option>
                {jabatanDetailList.map(detail => (
                  <option key={detail.id} value={detail.id}>
                    {detail.nama_jabatan}
                  </option>
                ))}
              </Form.Select>
              
              {/* TOMBOL TAMBAH DETAIL BARU */}
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => {
                  setDetailJabatanForm({
                    ...detailJabatanForm,
                    jabatan_id: pekerjaanForm.jabatan_id
                  });
                  setShowDetailJabatanModal(true);
                }}
                disabled={!pekerjaanForm.jabatan_id}
                title="Tambah detail jabatan baru"
              >
                <FaPlus />
              </Button>
            </div>
            <Form.Text className="text-muted">
              Detail spesifik posisi/jabatan (opsional). Klik + untuk menambah detail baru.
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* ROW 3: Status Talent dan Tanggal Transisi */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FaCertificate className="me-1 text-primary" size={12} />
              Status Talent <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="status_talent_id"
              value={pekerjaanForm.status_talent_id}
              onChange={handlePekerjaanInput}
              required
              disabled={editingPekerjaan || loadingPekerjaanData.statusTalent}
            >
              <option value="">Pilih Status Talent</option>
              {statusTalentList.map(s => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        {/* <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FaCalendarAlt className="me-1 text-primary" size={12} />
              Tanggal Transisi <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="date"
              name="tanggal_transisi"
              value={pekerjaanForm.tanggal_transisi}
              onChange={handlePekerjaanInput}
              required
            />
            <Form.Text className="text-muted">
              Tanggal mulai berlaku posisi ini
            </Form.Text>
          </Form.Group>
        </Col> */}
      </Row>

      {/* ROW 4: Tanggal Keluar */}
      <Row>
        {/* <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FaCalendarAlt className="me-1 text-primary" size={12} />
              Tanggal Keluar
            </Form.Label>
            <Form.Control
              type="date"
              name="tanggal_keluar"
              value={pekerjaanForm.tanggal_keluar}
              onChange={handlePekerjaanInput}
            />
            <Form.Text className="text-muted">
              Kosongkan jika masih aktif
            </Form.Text>
          </Form.Group>
        </Col> */}
      </Row>

      <Alert variant="info" className="mt-2 small">
        <FaInfoCircle className="me-2" />
        <strong>Informasi:</strong> Riwayat pekerjaan akan mencatat setiap perubahan posisi, holding, atau status talent. 
        Data dengan tanggal keluar kosong akan dianggap sebagai posisi aktif saat ini.
      </Alert>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" size="sm" onClick={() => setShowPekerjaanModal(false)}>
        Batal
      </Button>
      <Button variant="primary" size="sm" type="submit" disabled={loading}>
        {loading ? <Spinner size="sm" /> : <><FaSave className="me-1" /> Simpan</>}
      </Button>
    </Modal.Footer>
  </Form>
</Modal>

      {/* Modal Pendidikan */}
      <Modal show={showPendidikanModal} onHide={() => setShowPendidikanModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingPendidikan ? "Edit Pendidikan" : "Tambah Pendidikan"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSavePendidikan}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Riwayat Pendidikan <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="riwayat_pendidikan"
                value={pendidikanForm.riwayat_pendidikan}
                onChange={handlePendidikanInput}
                required
              >
                <option value="">Pilih</option>
                {jenjangOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nama Sekolah/Kampus <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="sekolah/kampus"
                value={pendidikanForm["sekolah/kampus"]}
                onChange={handlePendidikanInput}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Jurusan</Form.Label>
              <Form.Control
                type="text"
                name="jurusan"
                value={pendidikanForm.jurusan}
                onChange={handlePendidikanInput}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tahun Lulus</Form.Label>
              <Form.Control
                type="text"
                name="tahun_lulus"
                value={pendidikanForm["tahun_lulus"]}
                onChange={handlePendidikanInput}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ijazah</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleSertifikatUpload(e)}
                disabled={uploadingSertifikat}
              />
              {uploadingSertifikat && <Spinner size="sm" className="mt-2" />}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowPendidikanModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Simpan"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Kompetensi */}
      <Modal show={showKompetensiModal} onHide={() => setShowKompetensiModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingKompetensi ? "Edit Kompetensi" : "Tambah Kompetensi"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveKompetensi}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Kompetensi <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="kompetensi"
                value={kompetensiForm.kompetensi}
                onChange={handleKompetensiInput}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nama Sertifikat <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nama_sertifikat"
                value={kompetensiForm.nama_sertifikat}
                onChange={handleKompetensiInput}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nomor Sertifikat</Form.Label>
              <Form.Control
                type="text"
                name="nomor_sertifikat"
                value={kompetensiForm.nomor_sertifikat}
                onChange={handleKompetensiInput}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Masa Berlaku</Form.Label>
              <Form.Control
                type="date"
                name="masa_berlaku"
                value={kompetensiForm.masa_berlaku}
                onChange={handleKompetensiInput}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File Sertifikat</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleKompetensiFileUpload(e)}
                disabled={uploadingKompetensiFile}
              />
              {uploadingKompetensiFile && <Spinner size="sm" className="mt-2" />}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowKompetensiModal(false)}>
              Batal
            </Button>
            <Button variant="warning" size="sm" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Simpan"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Kaderisasi */}
      <Modal show={showKaderisasiModal} onHide={() => setShowKaderisasiModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingKaderisasi ? "Edit Kaderisasi" : "Tambah Kaderisasi"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveKaderisasi}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Kaderisasi <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="nama_training"
                value={kaderisasiForm.nama_training}
                onChange={handleKaderisasiInput}
                required
              >
                <option value="">Pilih Kaderisasi</option>
                {kaderisasiOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Penyelenggara</Form.Label>
              <Form.Control
                type="text"
                name="penyelenggara"
                value={kaderisasiForm.penyelenggara}
                onChange={handleKaderisasiInput}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tanggal Pelaksanaan</Form.Label>
              <Form.Control
                type="date"
                name="tanggal_training"
                value={kaderisasiForm.tanggal_training}
                onChange={handleKaderisasiInput}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Hasil</Form.Label>
              <Form.Select
                name="hasil"
                value={kaderisasiForm.hasil}
                onChange={handleKaderisasiInput}
              >
                <option value="">Pilih</option>
                {hasilOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sertifikat</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleKaderisasiFileUpload(e)}
                disabled={uploadingKaderisasiFile}
              />
              {uploadingKaderisasiFile && <Spinner size="sm" className="mt-2" />}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowKaderisasiModal(false)}>
              Batal
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Simpan"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PersonalInfo;