import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
  Row,
  Col,
  Badge,
  ProgressBar,
  Dropdown,
  Card as BootstrapCard,
  InputGroup,
} from "react-bootstrap";
import PageTitle from "../../components/PageTitle";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { useLayoutContext } from "@/context/useLayoutContext";
import {
  FiCalendar,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiUnlock,
  FiFileText,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiX,
  FiPaperclip,
  FiExternalLink,
} from "react-icons/fi";
import { FaRegCalendarAlt } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

/* ======================= Trello-like Styles untuk Program Holding ======================= */
const boardWrap = {
  display: "flex",
  gap: "16px",
  padding: "12px",
  overflowX: "auto",
  overflowY: "hidden",
  maxHeight: "calc(100vh - 220px)",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  alignItems: "flex-start",
};

// Fungsi untuk mendapatkan warna berdasarkan mode
const getColors = (isDark) => ({
  bgPrimary: isDark ? "#1e1e1e" : "#ffffff",
  bgSecondary: isDark ? "#2d2d2d" : "#f1f2f4",
  bgTertiary: isDark ? "#3d3d3d" : "#ffffff",
  bgHover: isDark ? "#383838" : "#f8f9fa",
  
  textPrimary: isDark ? "#ffffff" : "#172b4d",
  textSecondary: isDark ? "#b0b0b0" : "#5e6c84",
  textMuted: isDark ? "#888888" : "#6c757d",
  
  borderPrimary: isDark ? "#444444" : "#dfe1e6",
  borderSecondary: isDark ? "#555555" : "#e4e6ea",
  borderMuted: isDark ? "#404040" : "#d0d4dc",
  
  shadow: isDark ? "0 1px 0 rgba(255,255,255,0.1)" : "0 1px 0 rgba(9,30,66,.25)",
  shadowHover: isDark ? "0 6px 12px rgba(255,255,255,0.15)" : "0 6px 12px rgba(9,30,66,.2)",
});

// Komponen styled untuk bulan (list)
const MonthColumn = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        width: "300px",
        minWidth: "300px",
        background: colors.bgSecondary,
        borderRadius: "12px",
        boxShadow: colors.shadow,
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const MonthHeader = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        padding: "12px 16px",
        fontWeight: 700,
        color: colors.textPrimary,
        borderBottom: `1px solid ${colors.borderSecondary}`,
        position: "sticky",
        top: 0,
        background: colors.bgSecondary,
        zIndex: 1,
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const MonthBody = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        overflowY: "auto",
        flex: 1,
        maxHeight: "calc(100vh - 380px)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        background: colors.bgSecondary,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const MonthFooter = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        padding: "12px",
        borderTop: `1px solid ${colors.borderSecondary}`,
        background: colors.bgSecondary,
        borderBottomLeftRadius: "12px",
        borderBottomRightRadius: "12px",
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Komponen Card untuk program
const ProgramCard = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${colors.borderPrimary}`,
        borderRadius: "8px",
        background: colors.bgTertiary,
        boxShadow: colors.shadow,
        cursor: "pointer",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        transition: "transform .1s ease, box-shadow .1s ease",
        ...props.style
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = colors.shadowHover)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = colors.shadow)}
      {...props}
    >
      {children}
    </div>
  );
};

const ProgramCardContent = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        padding: "12px",
        flex: 1,
        minHeight: "60px",
        background: colors.bgTertiary,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/* ======================= Component Utama ======================= */
const ProgramHoldingBoard = () => {
  const { holdingId, boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { theme } = useLayoutContext();
  
  const [holding, setHolding] = useState(null);
  const [board, setBoard] = useState(null);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);

  // Modal states
  const [showKendalaModal, setShowKendalaModal] = useState(false);
  const [showBuktiModal, setShowBuktiModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [kendalaText, setKendalaText] = useState("");
  const [buktiData, setBuktiData] = useState({
    bukti_url: "",
    bukti_attachments: [],
  });

  // Tambahan state untuk modal edit program
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedProgramMonth, setSelectedProgramMonth] = useState(null);
  const [editingProgramData, setEditingProgramData] = useState({
    program_holding: "",
    description: "",
    status: "tidak",
    kendala: "",
    bukti_url: "",
    bukti_att: [],
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Tambahan state
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [unlockingMonthId, setUnlockingMonthId] = useState(null);
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [newProgramData, setNewProgramData] = useState({
    program_holding: "",
  });

  const isDarkMode = theme === 'dark';
  const [lockingMonthId, setLockingMonthId] = useState(null);
  

  // ======================= GET TOKEN =======================
  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  // ======================= VALIDASI AKSES =======================
  // VALIDASI AKSES - DIPERKETAT UNTUK DIREKTUR
  useEffect(() => {
    if (user && holdingId) {
      const userHoldingId = user.holding_id;
      const currentHoldingId = parseInt(holdingId, 10);
      const userRoleName = user.role?.name;
      const isSuperAdmin = userRoleName === 'Superadmin';
      const isAdmin = userRoleName === 'Admin';
      const isDirektur = userRoleName === 'Direktur';

      // Jika Direktur, HARUS cocok dengan holding_id-nya
      if (isDirektur) {
        if (userHoldingId !== currentHoldingId) {
          // Redirect ke holding miliknya sendiri
          Swal.fire({
            title: "Akses Ditolak",
            text: "Anda hanya dapat mengakses holding milik Anda sendiri.",
            icon: "warning",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Alihkan ke Holding Saya"
          }).then(() => {
            navigate(`/program-holding/holding/${userHoldingId}/board`, { replace: true });
          });
          return;
        }
      }

      // Superadmin & Admin boleh akses semua
      const isAllowed = isSuperAdmin || isAdmin || (isDirektur && userHoldingId === currentHoldingId);

      if (!isAllowed) {
        Swal.fire({
          title: "Akses Ditolak",
          text: "Anda tidak memiliki akses ke program holding ini!",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "Kembali"
        }).then(() => {
          navigate("/program-holding/holding", { replace: true });
        });
        return;
      }

      setAccessChecked(true);
    }
  }, [user, holdingId, navigate]);

  // ======================= FETCH DATA =======================
  useEffect(() => {
  if (!accessChecked) return;

// Di dalam fetchData function frontend
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const config = token ? {
        headers: { 'Authorization': `Bearer ${token}` }
      } : {};

      console.time('fetchFullBoardData');
      
      // ✅ Gunakan endpoint aggregated
      try {
        const response = await axios.get(
          `${API_BASE}/program-boards/${boardId}/full-data`,
          config
        );
        
        if (response.data.success) {
          const { holding, board, months, summary } = response.data.data;
          
          // Helper function untuk konversi nama bulan ke angka
          const getMonthNumber = (monthName) => {
            const monthMap = {
              'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
              'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8,
              'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
            };
            return monthMap[monthName] || 0;
          };
          
          // Process months data - PERHATIKAN: sekarang menggunakan month_order
          const processedMonths = Array.isArray(months) 
            ? months.map(month => ({
                ...month,
                programs: month.programs || [],
                count_program: month.count_program || (month.programs?.length || 0),
                persentase_program: month.persentase_program || month.persentase || 0,
                persentase: month.persentase || month.persentase_program || 0,
                // Gunakan month_order jika ada, jika tidak hitung dari title
                position: month.month_order || getMonthNumber(month.title) || 0
              }))
            : [];
          
          // Urutkan bulan berdasarkan position
          processedMonths.sort((a, b) => a.position - b.position);
          
          // Set state
          setHolding(holding || { id: holdingId, name: `Holding ${holdingId}` });
          setBoard(board || { 
            id: null, 
            tahun: new Date().getFullYear(), 
            persentase: 0 
          });
          setMonths(processedMonths);
          
          console.timeEnd('fetchFullBoardData');
          console.log(`✅ Loaded ${processedMonths.length} months with aggregated endpoint`);
          
          setLoading(false);
          return;
        } else {
          throw new Error(response.data.message || 'Gagal memuat data');
        }
      } catch (optimizedErr) {
        console.warn('❌ Aggregated endpoint failed, using fallback:', optimizedErr);
        // Fallback ke metode lama
        await fetchWithFallbackMethod();
      }
      
    } catch (err) {
      console.error('❌ All fetch methods failed:', err);
      setError(err.response?.data?.message || "Gagal memuat data program");
      setLoading(false);
    }
  };

  // ✅ FALLBACK METHOD (metode lama sebagai backup)
  const fetchWithFallbackMethod = async (currentYear, token) => {
    const config = { headers: { 'Authorization': `Bearer ${token}` } };
    
    console.time('fetchFallback'); // Monitoring
    
    try {
      // 1. Get holding info
      const holdingRes = await axios.get(`${API_BASE}/holdings/${holdingId}`, config);
      setHolding(holdingRes.data);

      // 2. Get program board
      let boardData;
      const boardRes = await axios.get(
        `${API_BASE}/holdings/${holdingId}/program-boards?tahun=${currentYear}`,
        config
      );

      boardData = boardRes.data.data?.[0];
      
      // Auto-generate jika perlu
      if (!boardData && (user?.role?.name === 'Superadmin' || user?.role?.name === 'Admin')) {
        try {
          const generateRes = await axios.post(
            `${API_BASE}/holdings/${holdingId}/program-boards/auto-generate`,
            { tahun: currentYear },
            config
          );
          boardData = generateRes.data.board;
        } catch (genErr) {
          console.error("Auto-generate error:", genErr);
        }
      }

      if (!boardData) {
        setError(`Tidak ada program board untuk tahun ${currentYear}`);
        setLoading(false);
        return;
      }

      setBoard(boardData);

      // 3. Get months (lists) for this board
      const monthsRes = await axios.get(
        `${API_BASE}/program-boards/${boardData.id}/lists`,
        config
      );

      let monthsData = monthsRes.data.data || monthsRes.data;
      
      // Generate months jika kurang dari 12
      if (!Array.isArray(monthsData) || monthsData.length < 12) {
        if (user?.role?.name === 'Superadmin' || user?.role?.name === 'Admin') {
          try {
            await axios.post(
              `${API_BASE}/program-boards/${boardData.id}/generate-months`,
              {},
              config
            );
            
            const monthsRes2 = await axios.get(
              `${API_BASE}/program-boards/${boardData.id}/lists`,
              config
            );
            monthsData = monthsRes2.data.data || monthsRes2.data;
          } catch (monthsErr) {
            console.error("Generate months error:", monthsErr);
          }
        }
      }

      monthsData.sort((a, b) => a.position - b.position);
      
      // 4. Fetch programs for ALL months secara paralel
      console.log(`📥 Fetching programs for ${monthsData.length} months...`);
      
      const monthsWithProgramsPromises = monthsData.map(async (month) => {
        try {
          const programsRes = await axios.get(
            `${API_BASE}/program-lists/${month.id}/programs`,
            config
          );
          const programs = programsRes.data.data || [];
          
          // Hitung persentase per month
          const tercapaiCount = programs.filter(p => p.status === 'tercapai').length;
          const persentase = programs.length > 0 
            ? Math.round((tercapaiCount / programs.length) * 100) 
            : 0;
          
          return {
            ...month,
            programs: programs,
            count_program: programs.length,
            persentase_program: persentase,
            persentase: persentase,
          };
        } catch (err) {
          console.error(`Error fetching programs for month ${month.id}:`, err);
          return { 
            ...month, 
            programs: [], 
            count_program: 0,
            persentase_program: 0,
            persentase: 0 
          };
        }
      });
      
      const monthsWithPrograms = await Promise.allSettled(monthsWithProgramsPromises);
      
      // Filter hanya yang berhasil
      const successfulMonths = monthsWithPrograms
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      // Urutkan kembali berdasarkan position
      successfulMonths.sort((a, b) => a.position - b.position);
      
      setMonths(successfulMonths);
      
      console.timeEnd('fetchFallback');
      console.log(`✅ Loaded ${successfulMonths.length} months with fallback method`);
      
    } catch (err) {
      console.error('❌ Fallback method error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [holdingId, accessChecked, user]);

  // ======================= HANDLERS EDIT PROGRAM =======================

  const handleLockMonth = async (monthId) => {
    if (user?.role?.name !== 'Superadmin' && user?.role?.name !== 'Admin') {
      Swal.fire({
        title: "Akses Ditolak",
        text: "Hanya Superadmin yang dapat mengunci bulan",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const month = months.find(m => m.id === monthId);
    if (!month) return;

    // Cek apakah bulan sudah terkunci
    if (isMonthLocked(month)) {
      Swal.fire({
        title: "Sudah Terkunci",
        text: `Bulan ${month.title} sudah dalam status terkunci`,
        icon: "info",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Kunci Bulan",
      html: `
        <div class="text-start">
          <p>Anda akan mengunci bulan: <strong>${month.title}</strong></p>
          <p class="text-danger small">
            <FiAlertCircle class="me-1" />
            Setelah dikunci, Direktur holding tidak bisa edit program di bulan ini.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Kunci!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setLockingMonthId(monthId);
      const token = getAuthToken();
      
      const response = await axios.put(
        `${API_BASE}/program-lists/${monthId}`,
        { 
          status: 'locked',
          unlocked_at: null // Reset jika ada
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state
      setMonths(prev => prev.map(m => 
        m.id === monthId ? { ...m, status: 'locked', unlocked_at: null } : m
      ));

      Swal.fire({
        title: "Berhasil!",
        text: "Bulan berhasil dikunci",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Lock error:", err);
      Swal.fire({
        title: "Gagal!",
        text: err.response?.data?.message || "Gagal mengunci bulan",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLockingMonthId(null);
    }
  };

  // Handler untuk buka modal edit program
  const handleOpenEditProgramModal = async (programId, monthId) => {
    const month = months.find(m => m.id === monthId);
    
    // Check permission untuk Direktur/Admin
    if (!canEditProgram(month)) {
      Swal.fire({
        title: "Akses Ditolak",
        text: isMonthLocked(month) 
          ? "Bulan ini terkunci. Tidak bisa edit program." 
          : "Anda tidak memiliki izin untuk mengedit program.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    
    try {
      setUploading(true);
      const token = getAuthToken();
      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };

      // Fetch detail program
      const res = await axios.get(
        `${API_BASE}/programs/${programId}`,
        config
      );

      const programData = res.data.data;

      setSelectedProgram(programData);
      setSelectedProgramMonth(month);

      // Set data untuk form edit
      setEditingProgramData({
        program_holding: programData.program_holding || "",
        description: programData.description || "",
        status: programData.status || "tidak",
        kendala: programData.kendala || "",
        bukti_url: programData.bukti_url || "",
        bukti_att: programData.bukti_att || [],
      });

      setNewFiles([]);
      setShowEditProgramModal(true);
    } catch (err) {
      console.error("Fetch program error:", err);
      Swal.fire({
        title: "Gagal!",
        text: "Gagal memuat data program",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handler untuk file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
  };

  // Handler untuk hapus file baru
  const handleRemoveNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handler untuk hapus attachment yang sudah ada
  const handleDeleteAttachment = (attachmentIndex) => {
    const updatedAttachments = [...editingProgramData.bukti_att];
    updatedAttachments.splice(attachmentIndex, 1);
    
    setEditingProgramData(prev => ({
      ...prev,
      bukti_att: updatedAttachments
    }));
  };

  // Handler untuk upload file ke server
  const uploadFilesToServer = async () => {
    if (newFiles.length === 0) return [];

    setIsUploading(true);
    try {
      const token = getAuthToken();
      const formData = new FormData();
      
      newFiles.forEach((file, index) => {
        formData.append('bukti_files[]', file);
      });

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      };

      const response = await axios.post(
        `${API_BASE}/programs/${selectedProgram.id}/upload-bukti`,
        formData,
        config
      );

      return response.data.program?.bukti_att || [];
    } catch (err) {
      console.error("Upload files error:", err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  const hasBuktiEvidence = () => {
    return (
      editingProgramData.bukti_url.trim() !== '' ||
      editingProgramData.bukti_att.length > 0 ||
      newFiles.length > 0
    );
  };


 
 // Handler untuk simpan perubahan program
  const handleSaveProgramEdit = async () => {
    if (!editingProgramData.program_holding.trim()) {
      Swal.fire({
        title: "Perhatian!",
        text: "Deskripsi program tidak boleh kosong",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      setUploadingFiles(true);

      // ✅ PERBAIKAN: Cek apakah masih ada bukti setelah penghapusan
      const hasEvidenceAfterDeletion = () => {
        return (
          editingProgramData.bukti_url.trim() !== '' ||
          editingProgramData.bukti_att.length > 0 ||
          newFiles.length > 0
        );
      };

      // ✅ PERBAIKAN: Otomatis ubah status jika tidak ada bukti
      let finalStatus = editingProgramData.status;
      if (editingProgramData.status === 'tercapai' && !hasEvidenceAfterDeletion()) {
        finalStatus = 'tidak';
        
      }

      // First, upload new files if any
      let allAttachments = [...editingProgramData.bukti_att];
      
      if (newFiles.length > 0) {
        const uploadedAttachments = await uploadFilesToServer();
        allAttachments = [...allAttachments, ...uploadedAttachments];
      }

      // Then update the program data
      const token = getAuthToken();
      const updateData = {
        program_holding: editingProgramData.program_holding,
        description: editingProgramData.description,
        status: finalStatus, // Gunakan finalStatus yang sudah diperiksa
        kendala: editingProgramData.kendala,
        bukti_url: editingProgramData.bukti_url,
        bukti_att: allAttachments,
      };

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };

      // Update program
      const res = await axios.put(
        `${API_BASE}/programs/${selectedProgram.id}`,
        updateData,
        config
      );

      const updatedProgram = res.data.program;

      // Update local state for programs in the month
      setMonths(prev => prev.map(month => {
        if (month.id === selectedProgramMonth.id) {
          const updatedPrograms = month.programs?.map(program =>
            program.id === selectedProgram.id
              ? updatedProgram
              : program
          );
          
          // Recalculate persentase for the month
          const tercapaiCount = updatedPrograms?.filter(p => p.status === 'tercapai').length || 0;
          const totalCount = updatedPrograms?.length || 0;
          const persentase = totalCount > 0 ? Math.round((tercapaiCount / totalCount) * 100) : 0;
          
          return {
            ...month,
            programs: updatedPrograms,
            persentase_program: persentase,
            persentase: persentase,
          };
        }
        return month;
      }));

      // Update progress board
      if (board) {
        const totalTercapai = months.flatMap(m => m.programs || [])
          .filter(p => p.status === 'tercapai').length;
        const totalPrograms = months.reduce((sum, m) => sum + (m.programs?.length || 0), 0);
        const boardPersentase = totalPrograms > 0 ? Math.round((totalTercapai / totalPrograms) * 100) : 0;
        
        setBoard(prev => ({ ...prev, persentase: boardPersentase }));
      }

      setShowEditProgramModal(false);
      
      Swal.fire({
        title: "Berhasil!",
        text: "Program berhasil diperbarui",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Update program error:", err);
      Swal.fire({
        title: "Gagal!",
        text: "Gagal memperbarui program",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

    const handleEditProgram = (programId, monthId) => {
    handleOpenEditProgramModal(programId, monthId);
  };

  const handleDeleteProgram = async (programId, monthId) => {
    const result = await Swal.fire({
      title: "Hapus Program?",
      text: "Program yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      const token = getAuthToken();
      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };

      await axios.delete(
        `${API_BASE}/programs/${programId}`,
        config
      );

      // Update local state
      setMonths(prev => prev.map(month => {
        if (month.id === monthId) {
          const filteredPrograms = month.programs?.filter(p => p.id !== programId) || [];
          const tercapaiCount = filteredPrograms.filter(p => p.status === 'tercapai').length;
          const persentase = filteredPrograms.length > 0 
            ? Math.round((tercapaiCount / filteredPrograms.length) * 100) 
            : 0;
          
          return {
            ...month,
            programs: filteredPrograms,
            count_program: filteredPrograms.length,
            persentase_program: persentase,
            persentase: persentase,
          };
        }
        return month;
      }));

      // Update progress board
      if (board) {
        const totalTercapai = months.flatMap(m => m.programs || [])
          .filter(p => p.status === 'tercapai' && p.id !== programId).length;
        const totalPrograms = months.reduce((sum, m) => 
          sum + (m.programs?.filter(p => p.id !== programId).length || 0), 0);
        const boardPersentase = totalPrograms > 0 ? Math.round((totalTercapai / totalPrograms) * 100) : 0;
        
        setBoard(prev => ({ ...prev, persentase: boardPersentase }));
      }

      Swal.fire({
        title: "Terhapus!",
        text: "Program berhasil dihapus.",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Delete program error:", err);
      Swal.fire({
        title: "Gagal!",
        text: "Gagal menghapus program",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };



  const handleProgramClick = (programId, monthId) => {
    const month = months.find(m => m.id === monthId);
    const program = month?.programs?.find(p => p.id === programId);
    
    if (!program) return;

    // Tampilkan detail dengan SweetAlert
    const attachmentsHtml = program.bukti_att?.length > 0 ? `
    <div class="mt-3">
      <p class="mb-2"><strong>File Bukti:</strong></p>
      <div class="list-group">
        ${program.bukti_att.map((att, idx) => `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <FiPaperclip class="me-2" />
              <span class="small">${att.name || `File ${idx + 1}`}</span>
            </div>
            <div>
              <a href="${getFullFileUrl(att.url)}" target="_blank" class="btn btn-sm btn-outline-primary">
                <FiExternalLink class="me-1" />
                Lihat
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : '';

    Swal.fire({
      title: "Detail Program",
      html: `
        <div style="text-align: left;">
          <p><strong>Program:</strong></p>
          <p class="mb-3">${program.program_holding}</p>
          
          ${program.description ? `
            <p><strong>Deskripsi:</strong></p>
            <p class="mb-3">${program.description}</p>
          ` : ''}
          
          <p><strong>Status:</strong> 
            <span class="badge ${program.status === 'tercapai' ? 'bg-success' : 'bg-warning'} ms-2">
              ${program.status === 'tercapai' ? 'Tercapai' : 'Belum Tercapai'}
            </span>
          </p>
          
          ${program.kendala ? `
            <p class="mt-3"><strong>Kendala:</strong></p>
            <p class="mb-3 p-2 bg-light rounded">${program.kendala}</p>
          ` : ''}
          
          ${program.bukti_url ? `
            <p><strong>URL Bukti:</strong></p>
            <p class="mb-3">
            <a href="${getFullFileUrl(program.bukti_url)}" target="_blank" class="text-primary">
            ${program.bukti_url}
            </a>
            </p>
          ` : ''}
          
          ${attachmentsHtml}
        </div>
      `,
      icon: "info",
      showCloseButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Tutup",
      width: "600px",
    });
  };


  // Handler untuk klik program card (untuk direktur holding)
 

  // ======================= HANDLERS LAINNYA =======================

  const handleOpenKendalaModal = (month) => {
    setSelectedMonth(month);
    setKendalaText(month.kendala || "");
    setShowKendalaModal(true);
  };

  const handleSaveKendala = async () => {
    if (!selectedMonth) return;

    try {
      setUploading(true);
      const token = getAuthToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };

      await axios.put(
        `${API_BASE}/program-lists/${selectedMonth.id}`,
        { kendala: kendalaText },
        config
      );

      setMonths(prev => prev.map(m => 
        m.id === selectedMonth.id 
          ? { ...m, kendala: kendalaText }
          : m
      ));

      setShowKendalaModal(false);
      Swal.fire({
        title: "Berhasil!",
        text: "Kendala berhasil disimpan",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Save kendala error:", err);
      Swal.fire({
        title: "Gagal!",
        text: "Gagal menyimpan kendala",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenBuktiModal = (month) => {
    setSelectedMonth(month);
    setBuktiData({
      bukti_url: month.bukti_url || "",
      bukti_attachments: month.bukti_attachments || [],
    });
    setShowBuktiModal(true);
  };

  const handleUnlockMonth = async (monthId) => {
    if (user?.role?.name !== 'Superadmin' && user?.role?.name !== 'Admin') {
      Swal.fire({
        title: "Akses Ditolak",
        text: "Hanya Superadmin dan Admin yang dapat membuka kunci bulan",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const month = months.find(m => m.id === monthId);
    if (!month) return;

    // Cek apakah memang terkunci
    if (!isMonthLocked(month)) {
      Swal.fire({
        title: "Tidak Terkunci",
        text: `Bulan ${month.title} tidak dalam status terkunci`,
        icon: "info",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Buka Kunci Bulan",
      html: `
        <div class="text-start">
          <p>Anda akan membuka kunci bulan: <strong>${month.title}</strong></p>
          <p class="text-muted small mb-3">
            Direktur/Admin akan dapat mengedit program di bulan ini.
          </p>
          <p class="text-warning small">
            <FiAlertCircle class="me-1" />
            Bulan yang dibuka tidak akan auto-lock lagi.
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Buka Kunci",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setUnlockingMonthId(monthId);
      const token = getAuthToken();
      
      // Gunakan endpoint unlock khusus
      const response = await axios.post(
        `${API_BASE}/program-lists/${monthId}/unlock`,
        {},
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state
      setMonths(prev => prev.map(m => 
        m.id === monthId ? response.data.data : m
      ));

      Swal.fire({
        title: "Berhasil!",
        text: "Bulan berhasil dibuka kunci",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Unlock error:", err);
      Swal.fire({
        title: "Gagal!",
        text: err.response?.data?.message || "Gagal membuka kunci",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setUnlockingMonthId(null);
    }
  };

  const canEditProgram = (month) => {
    const userRole = user?.role?.name;
    const locked = isMonthLocked(month);
    
    // Superadmin selalu bisa edit (bypass semua lock)
    if (userRole === 'Superadmin' || userRole === 'Admin') {
      return true;
    }
    
    // Direktur & Admin hanya bisa edit jika bulan tidak terkunci
    if (userRole === 'Direktur' ) {
      return !locked;
    }
    
    return false;
  };

  const canAddProgram = (month) => {
    const userRole = user?.role?.name;
    const locked = isMonthLocked(month);
    
    if (userRole === 'Superadmin' || userRole === 'Admin') {
      return true; // Superadmin selalu bisa tambah
    }
    
    if (userRole === 'Direktur') {
      return !locked; // Direktur bisa tambah jika tidak terkunci
    }
    
    // Direktur tidak bisa tambah program
    return false;
  };



  const handleAddProgram = async (monthId) => {
    if (!newProgramData.program_holding.trim()) {
      Swal.fire({
        title: "Perhatian!",
        text: "Deskripsi program tidak boleh kosong",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      setUploading(true);
      const token = getAuthToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };

      const res = await axios.post(
        `${API_BASE}/program-lists/${monthId}/programs`,
        {
          program_holding: newProgramData.program_holding,
          status: 'tidak',
        },
        config
      );

      const newProgram = res.data.program;
      setMonths(prev => prev.map(month => {
        if (month.id === monthId) {
          const programs = [...(month.programs || []), newProgram];
          return {
            ...month,
            programs,
            count_program: programs.length,
          };
        }
        return month;
      }));

      setNewProgramData({ program_holding: "" });
      setShowAddProgramModal(false);
      
      Swal.fire({
        title: "Berhasil!",
        text: "Program berhasil ditambahkan",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Add program error:", err);
      Swal.fire({
        title: "Gagal!",
        text: "Gagal menambahkan program",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setUploading(false);
    }
  };

  // Fungsi untuk mendapatkan warna progress bar
  const getProgressColor = (percent) => {
    if (percent >= 80) return "success";
    if (percent >= 60) return "info";
    if (percent >= 40) return "warning";
    return "danger";
  };

  // Fungsi untuk cek apakah bulan terkunci
  const isMonthLocked = (month) => {
    if (!month) return false;
    
    // 1. Jika ada unlocked_at, berarti sudah dibuka manual
    if (month.unlocked_at) {
      return false; // SUDAH DIBUKA (aktif kembali)
    }
    
    // 2. Jika status secara eksplisit 'locked' di database
    if (month.status === 'locked') {
      return true; // TERKUNCI manual
    }
    
    // 3. Auto-lock: jika bulan sudah lewat
    const currentMonth = new Date().getMonth() + 1;
    const monthNumber = getMonthNumber(month.title);
    const boardYear = board?.tahun || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Tahun sebelumnya: Semua bulan terkunci
    if (boardYear < currentYear) {
      return true;
    }
    
    // Tahun sama, bulan sudah lewat: Terkunci
    if (boardYear === currentYear && monthNumber < currentMonth) {
      return true;
    }
    
    return false; // Bulan aktif/belum lewat
  };


// Helper: convert month name to number
  const getMonthNumber = (monthName) => {
    const months = {
      'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
      'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8,
      'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
    };
    return months[monthName] || 0;
  };

  // Fungsi untuk cek apakah bulan sudah lewat
  const isMonthPassed = (monthTitle) => {
    const monthNumber = getMonthNumber(monthTitle);
    const currentMonth = new Date().getMonth() + 1;
    const boardYear = board?.tahun || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    
    if (boardYear < currentYear) {
      return true; // Tahun sebelumnya
    }
    
    if (boardYear === currentYear && monthNumber < currentMonth) {
      return true; // Bulan sebelumnya di tahun yang sama
    }
    
    return false;
  };

  // Fungsi untuk auto-lock bulan yang sudah lewat
  const autoLockPastMonths = async () => {
    if (!months.length || user?.role?.name !== 'Superadmin' && user?.role?.name !== 'Admin') return;
    
    const monthsToLock = months.filter(month => {
      // Cek jika bulan sudah lewat dan belum terkunci
      return isMonthPassed(month.title) && 
            month.status !== 'locked' && 
            !month.unlocked_at;
    });

    if (monthsToLock.length === 0) return;

    try {
      const token = getAuthToken();
      
      for (const month of monthsToLock) {
        await axios.post(
          `${API_BASE}/program-lists/${month.id}/lock`,
          { reason: `Auto-lock: Bulan ${month.title} sudah lewat` },
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update local state
        setMonths(prev => prev.map(m => 
          m.id === month.id 
            ? { ...m, status: 'locked', unlocked_at: null }
            : m
        ));
      }
      
      console.log(`✅ Auto-locked ${monthsToLock.length} bulan`);
    } catch (err) {
      console.error("❌ Auto-lock error:", err);
    }
  };

  // Panggil auto-lock setelah data dimuat
  useEffect(() => {
    if (months.length > 0 && user?.role?.name === 'Superadmin' || user?.role?.name === 'Admin') {
      autoLockPastMonths();
    }
  }, [months, user]);



  // Fungsi untuk format file size
  const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

// Helper function untuk get file icon
  const getFileIcon = (fileName, size = '1rem', className = '') => {
    if (!fileName) return <FiFileText size={size} className={className} />;
    
    const ext = fileName.split('.').pop().toLowerCase();
    
    const iconStyle = { 
      fontSize: size.includes('rem') ? size : `${size}rem`,
      ...className.includes('me-') ? {} : { marginRight: '4px' }
    };
    
    switch (ext) {
      case 'pdf':
        return <FiFileText size={size} className={`${className} text-danger`} style={iconStyle} />;
      case 'doc':
      case 'docx':
        return <FiFileText size={size} className={`${className} text-primary`} style={iconStyle} />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FiFileText size={size} className={`${className} text-success`} style={iconStyle} />;
      case 'ppt':
      case 'pptx':
        return <FiFileText size={size} className={`${className} text-warning`} style={iconStyle} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FiFileText size={size} className={`${className} text-secondary`} style={iconStyle} />;
      case 'txt':
        return <FiFileText size={size} className={`${className} text-info`} style={iconStyle} />;
      default:
        return <FiFileText size={size} className={className} style={iconStyle} />;
    }
  };

  // Helper function untuk get file display name
  const getFileDisplayName = (fileName, index) => {
    if (!fileName) return `File ${index + 1}`;
    
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const ext = fileName.split('.').pop();
    
    if (nameWithoutExt.length > 8) {
      return `${nameWithoutExt.substring(0, 6)}...${ext}`;
    }
    
    return fileName;
  };

  // Helper function untuk check if file is image
  const isImageFile = (file) => {
    return (
      file?.type?.includes('image') ||
      file?.mime_type?.includes('image') ||
      (file?.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name)) ||
      (file?.url && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.url))
    );
  };

  // Tambahkan fungsi ini di dalam komponen ProgramHoldingBoard, sebelum return statement
  // Fungsi untuk mendapatkan URL lengkap file storage
  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/storage')) {
      const storageBase = API_BASE.replace(/\/api$/, '');
      return `${storageBase}${url}`;
    }
    if (url.startsWith('storage/')) {
      const storageBase = API_BASE.replace(/\/api$/, '');
      return `${storageBase}/${url}`;
    }
    const storageBase = API_BASE.replace(/\/api$/, '');
    return `${storageBase}/${url}`;
  };

  // Fungsi untuk memproses semua attachments
  const processAttachments = (attachments) => {
    if (!attachments || !Array.isArray(attachments)) return [];
    
    return attachments.map(att => {
      const processedUrl = getFullFileUrl(att.url || att.path);
      
      
      return {
        ...att,
        url: processedUrl,
        original_url: att.url || att.path
      };
    });
  };
  // ======================= RENDER =======================
  if (!accessChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Memeriksa akses...</span>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Program Holding", path: "/program-holding/holding" },
          { 
            label: holding ? holding.name : `Holding ${holdingId}`, 
            path: `/program-holding/holding/${holdingId}/board`,
            active: true 
          },
        ]}
        title={
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => navigate("/program-holding/holding")}
              >
                ←
              </Button>
              <div>
                <h4 className="mb-0">{holding?.name || `Program Holding ${holdingId}`}</h4>
                <small className="text-muted">
                  {board?.tahun ? `Tahun ${board.tahun}` : "Program Tahunan"} 
                  {board?.persentase !== undefined && ` - Progress: ${board.persentase}%`}
                </small>
              </div>
            </div>
            
          </div>
        }
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-3">
          <Alert.Heading>Gagal Memuat Data</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </Button>
          </div>
        </Alert>
      )}

   

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Memuat data program bulanan...</div>
        </div>
      )}

      {/* Board (12 Bulan) */}
      {!loading && !error && (
        <div style={boardWrap}>
          {months.map((month) => {
            const isLocked = isMonthLocked(month);
            const isPassed = isMonthPassed(month.title);
            const isDirekturHolding = user?.role?.name === 'Direktur' && user.holding_id === parseInt(holdingId);
            const canEdit = !isLocked && (isDirekturHolding || user?.role?.name === 'Superadmin' || user?.role?.name === 'Admin');
            const canAddProgram = !isLocked && (user?.role?.name === 'Admin' || user?.role?.name === 'Superadmin' );
            
            return (
              <MonthColumn 
                key={month.id} 
                isDark={isDarkMode}
                onMouseEnter={() => setHoveredMonth(month.id)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {/* Header Bulan */}
               
<MonthHeader isDark={isDarkMode}>
  <div className="d-flex justify-content-between align-items-center mb-2">
    <div>
      <h6 className="mb-0 d-flex align-items-center">
        {month.title}
        
        {/* Lock Status Badge - SEDERHANA */}
        {isMonthLocked(month) ? (
          <Badge bg="danger" className="ms-2">
            <FiLock size={12} className="me-1" />
            TERKUNCI
          </Badge>
        ) : (
          <Badge bg="success" className="ms-2">
            <FiUnlock size={12} className="me-1" />
            AKTIF
          </Badge>
        )}
      </h6>
      
      {/* Info tambahan */}
      {/* {month.unlocked_at && (
        <small className="text-warning d-block mt-1">
          <FiAlertCircle size={10} className="me-1" />
          Dibuka manual
        </small>
      )} */}
    </div>
    
    {/* Action Buttons untuk Superadmin - SEDERHANA */}
    {(user?.role?.name === 'Superadmin' || user?.role?.name === 'Admin') && (
      <div className="d-flex gap-1">
        {/* Button Lock/Unlock berdasarkan status */}
        {isMonthLocked(month) ? (
          <Button
            variant="outline-warning"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUnlockMonth(month.id);
            }}
            disabled={unlockingMonthId === month.id}
            title="Buka kunci bulan"
            className="d-flex align-items-center"
          >
            {unlockingMonthId === month.id ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FiUnlock className="me-1" />
                Buka
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleLockMonth(month.id);
            }}
            disabled={lockingMonthId === month.id}
            title="Kunci bulan ini"
            className="d-flex align-items-center"
          >
            {lockingMonthId === month.id ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FiLock className="me-1" />
                Kunci
              </>
            )}
          </Button>
        )}
      </div>
    )}
  </div>
  
  {/* Progress Bar */}
  <div className="mt-2">
    <div className="d-flex justify-content-between mb-1">
      <small className="text-muted">Progress</small>
      <small className="fw-bold">{month.persentase || month.persentase_program || 0}%</small>
    </div>
    <ProgressBar 
      now={month.persentase || month.persentase_program || 0} 
      variant={getProgressColor(month.persentase || month.persentase_program || 0)}
      style={{ height: "6px" }}
    />
  </div>
</MonthHeader>

             
                {/* Body - Daftar Program */}
                <MonthBody isDark={isDarkMode}>
                  {month.programs && month.programs.length > 0 ? (
                    month.programs.map((program) => (
                    

                     <ProgramCard
          key={program.id}
          isDark={isDarkMode}
          onClick={() => handleProgramClick(program.id, month.id)}
          className={isLocked ? "locked-card" : ""}
          style={{
            opacity: isLocked ? 0.7 : 1,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <ProgramCardContent isDark={isDarkMode}>
            <div className="d-flex justify-content-between align-items-start">
              {/* Program Content */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                <p 
                  className="mb-1 text-truncate" 
                  style={{ 
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    fontWeight: 500,
                    color: isDarkMode ? '#e1e4e8' : '#172b4d'
                  }}
                  title={program.program_holding}
                >
                  {program.program_holding}
                </p>
                
                {/* Image Preview Section - Perbaikan utama */}
              {/* Image Preview Section */}
        {program.bukti_att?.some(att => 
          att.type?.includes('image') || 
          att.mime_type?.includes('image') ||
          (att.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name)) ||
          (att.url && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.url))
        ) && (
          <div className="image-preview-section mt-2 mb-2">
            <div className="d-flex gap-1 flex-wrap">
              {processAttachments(program.bukti_att)
                .filter(att => 
                  att.mime_type?.includes('image') ||
                  (att.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name))
                )
                .slice(0, 2)
                .map((att, idx) => (
                  <div 
                    key={idx}
                    className="image-thumbnail-container position-relative"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: `1px solid ${isDarkMode ? '#444' : '#dee2e6'}`,
                      cursor: 'pointer',
                      backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (att.url) {
                        window.open(att.url, '_blank');
                      }
                    }}
                    title={att.name || "Klik untuk melihat gambar"}
                  >
                    {/* Image Preview dengan URL lengkap */}
                    <img 
                      src={att.url}
                      alt={att.name || `Bukti gambar ${idx + 1}`}
                      className="img-fluid h-100 w-100 object-fit-cover"
                      style={{
                        transition: 'transform 0.2s ease'
                      }}
                      onError={(e) => {
                        // Fallback jika gambar gagal dimuat
                        console.error('Gagal memuat gambar:', att.url);
                        e.target.style.display = 'none';
                        const container = e.target.parentElement;
                        container.innerHTML = `
                          <div class="d-flex flex-column align-items-center justify-content-center h-100 w-100" 
                              style="background: ${isDarkMode ? '#2d2d2d' : '#f8f9fa'}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
                                fill="none" stroke="${isDarkMode ? '#888' : '#6c757d'}" stroke-width="2" 
                                stroke-linecap="round" stroke-linejoin="round" class="mb-1">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <small class="${isDarkMode ? 'text-light' : 'text-muted'}" style="font-size: 0.65rem">
                              ${att.name || 'Gambar'}
                            </small>
                            <small class="${isDarkMode ? 'text-light' : 'text-muted'}" style="font-size: 0.5rem">
                              Gagal dimuat
                            </small>
                          </div>
                        `;
                      }}
                      onLoad={(e) => {
                        console.log('Gambar berhasil dimuat:', att.url);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.parentElement.style.boxShadow = isDarkMode 
                          ? '0 4px 8px rgba(255,255,255,0.1)' 
                          : '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.parentElement.style.boxShadow = 'none';
                      }}
                    />
                    
                    {/* Image badge overlay */}
                    {idx === 0 && processAttachments(program.bukti_att).filter(a => 
                      a.mime_type?.includes('image') ||
                      (a.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(a.name))
                    ).length > 2 && (
                      <div 
                        className="position-absolute top-0 end-0"
                        style={{
                          background: isDarkMode 
                            ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 100%)' 
                            : 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.8) 100%)',
                          color: 'white',
                          borderRadius: '0 0 0 6px',
                          padding: '2px 6px',
                          fontSize: '0.6rem',
                          fontWeight: 'bold'
                        }}
                      >
                        +{processAttachments(program.bukti_att).filter(a => 
                          a.mime_type?.includes('image') ||
                          (a.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(a.name))
                        ).length - 1}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}      
        {/* Bukti Evidence Section */}
        <div className="bukti-evidence-section mt-2 mb-2">
          {/* URL Bukti */}
          {program.bukti_url && (
            <div className="d-flex align-items-center mb-1">
              <FiExternalLink 
                size={10} 
                className="me-1 text-primary" 
                style={{ flexShrink: 0 }}
              />
              <small 
                className="text-truncate text-muted"
                style={{ 
                  fontSize: '0.75rem',
                  maxWidth: '200px'
                }}
                title={program.bukti_url}
              >
                <a 
                  href={program.bukti_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-decoration-none text-primary"
                  style={{ fontSize: '0.75rem' }}
                >
                  {program.bukti_url.replace(/^https?:\/\//, '').replace(/^www\./, '').slice(0, 25)}
                  {program.bukti_url.replace(/^https?:\/\//, '').replace(/^www\./, '').length > 25 ? '...' : ''}
                </a>
              </small>
            </div>
          )}
          
          {/* File Attachments (Non-image files only) */}
          {program.bukti_att?.some(att => {
            const isImage = att.type?.includes('image') || 
                           att.mime_type?.includes('image') ||
                           (att.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name));
            return !isImage;
          }) && (
            <div className="d-flex align-items-center flex-wrap gap-1 mt-1">
              <FiPaperclip 
                size={10} 
                className="me-1 text-info" 
                style={{ flexShrink: 0 }}
              />
              <div className="d-flex align-items-center flex-wrap gap-1">
                {program.bukti_att
                  .filter(att => {
                    const isImage = att.type?.includes('image') || 
                                   att.mime_type?.includes('image') ||
                                   (att.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name));
                    return !isImage;
                  })
                  .slice(0, 2)
                  .map((att, idx) => (
                    <Badge 
                      key={idx}
                      bg={isDarkMode ? "dark" : "light"}
                      text={isDarkMode ? "light" : "dark"}
                      className="d-flex align-items-center py-1 px-2 border-0"
                      style={{ 
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        borderRadius: '12px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (att.url) {
                          window.open(att.url, '_blank');
                        }
                      }}
                      title={`${att.name || 'File'} - ${att.size ? formatFileSize(att.size) : ''}`}
                    >
                      {getFileIcon(att.name, '0.7rem', 'me-1')}
                      <span className="text-truncate" style={{ maxWidth: '70px' }}>
                        {getFileDisplayName(att.name, idx)}
                      </span>
                    </Badge>
                  ))}
                
                {program.bukti_att.filter(att => {
                  const isImage = att.type?.includes('image') || 
                                 att.mime_type?.includes('image') ||
                                 (att.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name));
                  return !isImage;
                }).length > 2 && (
                  <Badge 
                    bg="info"
                    className="py-1 px-2 border-0"
                    style={{ 
                      fontSize: '0.7rem',
                      borderRadius: '12px'
                    }}
                  >
                    +{program.bukti_att.filter(att => {
                      const isImage = att.type?.includes('image') || 
                                     att.mime_type?.includes('image') ||
                                     (att.name && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(att.name));
                      return !isImage;
                    }).length - 2} file
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Status & Indicators Row */}
        <div className="d-flex align-items-center justify-content-between mt-2">
          <div className="d-flex align-items-center gap-2">
            {/* Status Badge */}
            <Badge 
              bg={program.status === 'tercapai' ? 'success' : 'secondary'}
              className="d-flex align-items-center"
              style={{ 
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '12px'
              }}
            >
              {program.status === 'tercapai' ? (
                <>
                  <FiCheckCircle size={10} className="me-1" />
                  Tercapai
                </>
              ) : (
                <>
                  <FiClock size={10} className="me-1" />
                  Belum
                </>
              )}
            </Badge>
            
            {/* Bukti Count Badge */}
            {(program.bukti_url || program.bukti_att?.length > 0) && (
              <Badge 
                bg="primary"
                className="d-flex align-items-center"
                style={{ 
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}
                title="Total bukti terlampir"
              >
                <FiPaperclip size={8} className="me-1" />
                {program.bukti_att?.length || 0}
                {program.bukti_url && program.bukti_att?.length > 0 ? '+' : ''}
                {program.bukti_url && program.bukti_att?.length === 0 ? 'URL' : ''}
              </Badge>
            )}
          </div>
          
          {/* Kendala Indicator */}
          {program.kendala && (
            <div 
              className="d-flex align-items-center text-warning"
              title="Ada kendala: Klik untuk detail"
              onClick={(e) => {
                e.stopPropagation();
                Swal.fire({
                  title: "Kendala",
                  text: program.kendala,
                  icon: "warning",
                  confirmButtonColor: "#3085d6",
                });
              }}
              style={{ cursor: 'pointer' }}
            >
              <FiAlertCircle size={12} />
            </div>
          )}
        </div>
      </div>
      
      {/* Action Menu */}
      
<div className="d-flex align-items-start">
  <Dropdown 
    onClick={(e) => e.stopPropagation()} 
    align="end"
    style={{ marginTop: '-4px', marginRight: '-8px' }}
  >
    <Dropdown.Toggle
      variant="link"
      size="sm"
      className="p-0 border-0 text-muted"
      style={{ 
        boxShadow: 'none',
        opacity: !canEditProgram(month) ? 0.3 : 1,
        cursor: !canEditProgram(month) ? 'not-allowed' : 'pointer'
      }}
      disabled={!canEditProgram(month)}
      title={!canEditProgram(month) ? "Aksi tidak tersedia" : "Menu aksi"}
    >
      <div className="d-flex align-items-center justify-content-center rounded"
        style={{ 
          width: '24px', 
          height: '24px',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (canEditProgram(month)) {
            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ 
          fontSize: '1.4rem', 
          lineHeight: '1',
          fontWeight: 600,
          marginTop: '-2px'
        }}>
          ⋯
        </span>
      </div>
    </Dropdown.Toggle>
    
    <Dropdown.Menu
      style={{
        minWidth: '160px',
        border: isDarkMode ? '1px solid #444' : '1px solid #dfe1e6',
        boxShadow: isDarkMode 
          ? '0 8px 16px rgba(0,0,0,0.3)' 
          : '0 8px 16px rgba(9,30,66,0.15)'
      }}
    >
      <Dropdown.Item 
        onClick={() => handleEditProgram(program.id, month.id)}
        disabled={!canEditProgram(month)}
        className="d-flex align-items-center py-2"
        style={{
          opacity: !canEditProgram(month) ? 0.5 : 1,
          cursor: !canEditProgram(month) ? 'not-allowed' : 'pointer'
        }}
      >
        <FiEdit className="me-2" size={16} />
        <span>Edit Program</span>
        {isMonthLocked(month) && (
          <small className="ms-2 text-danger">
            (Terkunci)
          </small>
        )}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item 
        onClick={() => handleDeleteProgram(program.id, month.id)}
        disabled={!canEditProgram(month)}
        className="d-flex align-items-center py-2 text-danger"
        style={{
          opacity: !canEditProgram(month) ? 0.5 : 1,
          cursor: !canEditProgram(month) ? 'not-allowed' : 'pointer'
        }}
      >
        <FiTrash2 className="me-2" size={16} />
        <span>Hapus Program</span>
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
</div>
    </div>
  </ProgramCardContent>
</ProgramCard>
                    ))
                  ) : (
                    <div 
                      className="text-center py-4"
                      style={{
                        border: `1px dashed ${isDarkMode ? '#444' : '#dfe1e6'}`,
                        borderRadius: '8px',
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(9,30,66,0.02)'
                      }}
                    >
                      <FiFileText 
                        size={28} 
                        className="mb-2" 
                        style={{ 
                          color: isDarkMode ? '#6c757d' : '#adb5bd',
                          opacity: 0.5
                        }} 
                      />
                      <p 
                        className="mb-0" 
                        style={{ 
                          fontSize: '0.85rem',
                          color: isDarkMode ? '#8b949e' : '#6c757d'
                        }}
                      >
                        Belum ada program
                      </p>
                      {canAddProgram && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setSelectedMonth(month);
                            setShowAddProgramModal(true);
                          }}
                          style={{
                            fontSize: '0.8rem',
                            padding: '3px 12px'
                          }}
                        >
                          + Tambah Program
                        </Button>
                      )}
                    </div>
                  )}
                </MonthBody>

                {/* Footer - Action Buttons */}
                <MonthFooter isDark={isDarkMode}>
                  <div className="d-flex flex-column gap-2">
                    {canAddProgram && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() => {
                          setSelectedMonth(month);
                          setShowAddProgramModal(true);
                        }}
                      >
                        + Tambah Program
                      </Button>
                    )}
                    
                    {canEdit && isPassed && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="w-100"
                        onClick={() => handleOpenKendalaModal(month)}
                      >
                        <FiAlertCircle className="me-1" />
                        {month.kendala ? 'Edit Kendala' : 'Tambah Kendala'}
                      </Button>
                    )}
                    
                    {canEdit && isPassed && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="w-100"
                        onClick={() => handleOpenBuktiModal(month)}
                      >
                        <FiFileText className="me-1" />
                        {month.bukti_url ? 'Lihat/Edit Bukti' : 'Upload Bukti'}
                      </Button>
                    )}
                  </div>
                </MonthFooter>
              </MonthColumn>
            );
          })}
        </div>
      )}

      {/* ======================= MODAL EDIT PROGRAM ======================= */}
      <Modal 
          show={showEditProgramModal} 
          onHide={() => !uploadingFiles && !isUploading && setShowEditProgramModal(false)}
          size="lg"
          backdrop="static"
          centered
          className="program-edit-modal"
        >
        <Modal.Header 
          closeButton={!uploadingFiles && !isUploading}
          style={{
            borderBottom: `1px solid ${isDarkMode ? '#444' : '#e9ecef'}`,
            padding: '1.25rem 1.5rem'
          }}
        >
          <Modal.Title className="d-flex align-items-center">
            <div className="modal-icon-wrapper me-3">
              <FiEdit size={22} />
            </div>
            <div>
              <h5 className="mb-0 fw-semibold">Edit Program</h5>
              <small className="text-muted">
                {selectedProgramMonth?.title} • {board?.tahun}
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ padding: '1.5rem' }}>
          {uploading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <div className="mt-3 fw-medium">Memuat data program...</div>
              <small className="text-muted">Mohon tunggu sebentar</small>
            </div>
          ) : (
            <div className="edit-form-container">
              {/* Header Info */}
             

              <Form>
                {/* Program Holding */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold d-flex align-items-center mb-2">
                    <span>Program Holding</span>
                    <span className="text-danger ms-1">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editingProgramData.program_holding}
                    onChange={(e) => setEditingProgramData(prev => ({
                      ...prev,
                      program_holding: e.target.value
                    }))}
                    placeholder="Contoh: Meningkatkan produktivitas tim sebesar 20%..."
                    disabled={uploadingFiles || isUploading}
                    style={{
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                  <Form.Text className="text-muted">
                    Deskripsi program holding yang akan dilaksanakan
                  </Form.Text>
                </Form.Group>

                {/* Deskripsi Tambahan */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold d-flex align-items-center mb-2">
                    <span>Deskripsi Tambahan</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>(Opsional)</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editingProgramData.description}
                    onChange={(e) => setEditingProgramData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Detail tambahan tentang program..."
                    disabled={uploadingFiles || isUploading}
                  />
                </Form.Group>

               
                  
                <Form.Group className="mb-4">
                  {/* Kendala */}
                  <Form.Group>
                    <Form.Label className="fw-semibold d-flex align-items-center mb-2">
                      <FiAlertCircle className="me-2 text-warning" />
                      <span>Kendala</span>
                      <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}>(Opsional)</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={editingProgramData.kendala}
                      onChange={(e) => setEditingProgramData(prev => ({
                        ...prev,
                        kendala: e.target.value
                      }))}
                      placeholder="Hambatan atau kendala yang ditemui..."
                      disabled={uploadingFiles || isUploading}
                    />
                  </Form.Group>
                </Form.Group>
              

                {/* URL Bukti */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold d-flex align-items-center mb-2">
                    <FiExternalLink className="me-2 text-primary" />
                    <span>URL Bukti</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}></span>
                    {editingProgramData.bukti_url.trim() && (
                      <Badge bg="success" className="ms-2">
                        <FiCheckCircle className="me-1" /> Bukti tersedia
                      </Badge>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="url"
                    value={editingProgramData.bukti_url}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditingProgramData(prev => ({
                        ...prev,
                        bukti_url: newValue
                      }));
                      
                      // Jika URL diisi, enable status tercapai
                      if (newValue.trim() || editingProgramData.bukti_att.length > 0 || newFiles.length > 0) {
                        // User bisa memilih tercapai karena sudah ada bukti
                        // Tidak otomatis set status, biarkan user pilih
                      }
                    }}
                    placeholder="https://contoh.com/dashboard-bukti"
                    disabled={uploadingFiles || isUploading}
                  />
                  <Form.Text className="text-muted">
                    Tautan ke dashboard, dokumentasi, atau sumber eksternal lainnya
                  </Form.Text>
                </Form.Group>

                {/* File Upload Section */}
                <div className="file-upload-section mb-4">
                  <Form.Group>
                    <Form.Label className="fw-semibold d-flex align-items-center mb-3">
                      <FiPaperclip className="me-2 text-info" />
                      <span>Upload File Bukti</span>
                      <span className="text-muted ms-2" style={{ fontSize: '0.85rem' }}></span>
                      {(editingProgramData.bukti_att.length > 0 || newFiles.length > 0) && (
                        <Badge bg="success" className="ms-2">
                          <FiCheckCircle className="me-1" /> {editingProgramData.bukti_att.length + newFiles.length} file
                        </Badge>
                      )}
                    </Form.Label>
                    
                  
                    
                    <div className="upload-area mb-3">
                      <label htmlFor="file-upload" className={`upload-dropzone ${isUploading ? 'disabled' : ''}`}
                        style={{
                          border: `2px dashed ${isDarkMode ? '#555' : '#ced4da'}`,
                          borderRadius: '8px',
                          padding: '2rem',
                          textAlign: 'center',
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          background: isDarkMode ? '#2d2d2d' : '#f8f9fa',
                          opacity: isUploading ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!isUploading) {
                            e.currentTarget.style.borderColor = isDarkMode ? '#4dabf7' : '#339af0';
                            e.currentTarget.style.background = isDarkMode ? '#383838' : '#e9ecef';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isUploading) {
                            e.currentTarget.style.borderColor = isDarkMode ? '#555' : '#ced4da';
                            e.currentTarget.style.background = isDarkMode ? '#2d2d2d' : '#f8f9fa';
                          }
                        }}
                      >
                        <FiDownload size={32} className="mb-3" style={{ opacity: 0.5 }} />
                        <div className="fw-medium mb-2">
                          {isUploading ? 'Mengupload file...' : 'Klik atau tarik file ke sini'}
                        </div>
                        <small className="text-muted d-block">
                          Upload file pendukung (JPG, PNG, PDF, DOC, XLS, PPT, TXT)
                        </small>
                        <small className="text-muted">Maksimal 10MB per file</small>
                      </label>
                      <Form.Control
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        disabled={uploadingFiles || isUploading}
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        style={{ display: 'none' }}
                      />
                    </div>
                  </Form.Group>

                  {/* File Lists */}
                  <div className="file-lists-container">
                    {/* New Files */}
                    {newFiles.length > 0 && (
                      <div className="new-files-section mb-4">
                        <h6 className="fw-semibold d-flex align-items-center mb-3">
                          <span>File Baru</span>
                          <Badge bg="info" className="ms-2" pill>
                            {newFiles.length}
                          </Badge>
                        </h6>
                        <div className="file-list">
                          {newFiles.map((file, index) => (
                            <div key={index} className="file-item mb-2 p-2 rounded"
                              style={{
                                border: `1px solid ${isDarkMode ? '#444' : '#e9ecef'}`,
                                background: isDarkMode ? '#2d2d2d' : '#fff'
                              }}>
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center" style={{ flex: 1 }}>
                                  <FiPaperclip className="me-3 text-info" />
                                  <div style={{ flex: 1 }}>
                                    <div className="fw-medium text-truncate" style={{ maxWidth: '300px' }}>
                                      {file.name}
                                    </div>
                                    <div className="text-muted small">
                                      {formatFileSize(file.size)}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleRemoveNewFile(index)}
                                  disabled={uploadingFiles || isUploading}
                                  className="ms-2"
                                >
                                  <FiX />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Existing Files */}
                    {editingProgramData.bukti_att.length > 0 && (
                      <div className="existing-files-section">
                        <h6 className="fw-semibold d-flex align-items-center mb-3">
                          <span>File yang sudah diupload</span>
                          <Badge bg="secondary" className="ms-2" pill>
                            {editingProgramData.bukti_att.length}
                          </Badge>
                        </h6>
                        <div className="file-list">
                          {editingProgramData.bukti_att.map((att, index) => (
                            <div key={index} className="file-item mb-2 p-2 rounded"
                              style={{
                                border: `1px solid ${isDarkMode ? '#444' : '#e9ecef'}`,
                                background: isDarkMode ? '#2d2d2d' : '#fff'
                              }}>
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center" style={{ flex: 1 }}>
                                  <FiPaperclip className="me-3 text-success" />
                                  <div style={{ flex: 1 }}>
                                    <div className="fw-medium text-truncate" style={{ maxWidth: '300px' }}>
                                      {att.name || `File ${index + 1}`}
                                    </div>
                                    <div className="text-muted small d-flex gap-3">
                                      {att.size && <span>{formatFileSize(att.size)}</span>}
                                      {att.uploaded_at && (
                                        <span>• {new Date(att.uploaded_at).toLocaleDateString('id-ID')}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    as="a"
                                    href={att.url}
                                    target="_blank"
                                    disabled={uploadingFiles || isUploading}
                                    title="Lihat file"
                                  >
                                    <FiExternalLink />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDeleteAttachment(index)}
                                    disabled={uploadingFiles || isUploading}
                                    title="Hapus file"
                                  >
                                    <FiTrash2 />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                     <Row className="mb-4">
                        <Col md={6}>
                          {/* Status Ketercapaian */}
                          <Form.Group>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <Form.Label className="fw-semibold mb-0 d-flex align-items-center">
                                <FiTrendingUp className="me-2" />
                                Status Ketercapaian
                              </Form.Label>
                             
                            </div>
                            
                            <div className="status-radio-group">
                              {/* Belum Tercapai */}
                              <div className={`status-option ${editingProgramData.status === 'tidak' ? 'active' : ''}`}>
                                <Form.Check
                                  type="radio"
                                  id="status-tidak"
                                  label={
                                    <div className="d-flex align-items-center">
                                      <div className="status-indicator bg-secondary"></div>
                                      <span className="ms-2">Belum Tercapai</span>
                                    </div>
                                  }
                                  name="status"
                                  value="tidak"
                                  checked={editingProgramData.status === 'tidak'}
                                  onChange={(e) => setEditingProgramData(prev => ({
                                    ...prev,
                                    status: e.target.value
                                  }))}
                                  disabled={uploadingFiles || isUploading}
                                />
                              
                              </div>
                              
                              {/* Tercapai */}
                              <div className={`status-option ${editingProgramData.status === 'tercapai' ? 'active' : ''}`}>
                                <Form.Check
                                  type="radio"
                                  id="status-tercapai"
                                  label={
                                    <div className="d-flex align-items-center">
                                      <div className="status-indicator bg-success"></div>
                                      <span className="ms-2">Tercapai</span>
                                      {!hasBuktiEvidence() && (
                                        <FiLock className="ms-2 text-warning" title="Butuh bukti" />
                                      )}
                                    </div>
                                  }
                                  name="status"
                                  value="tercapai"
                                  checked={editingProgramData.status === 'tercapai'}
                                  onChange={(e) => {
                                    if (!hasBuktiEvidence()) {
                                      // Tampilkan alert jika mencoba memilih tercapai tanpa bukti
                                      Swal.fire({
                                        title: "Perhatian!",
                                        text: "Anda harus memiliki bukti (URL atau file) untuk menandai program sebagai Tercapai",
                                        icon: "warning",
                                        confirmButtonColor: "#3085d6",
                                      });
                                      return;
                                    }
                                    setEditingProgramData(prev => ({
                                      ...prev,
                                      status: e.target.value
                                    }));
                                  }}
                                  disabled={uploadingFiles || isUploading || !hasBuktiEvidence()}
                                  style={!hasBuktiEvidence() ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                                />
                                {hasBuktiEvidence() ? (
                                  <small className="text-success d-block mt-1" style={{ fontSize: '0.8rem' }}>
                                    <FiCheckCircle className="me-1" />
                                    Program dapat ditandai tercapai karena ada bukti
                                  </small>
                                ) : (
                                  <small className="text-warning d-block mt-1" style={{ fontSize: '0.8rem' }}>
                                    <FiAlertCircle className="me-1" />
                                    Tambahkan bukti (URL atau file) untuk dapat menandai program sebagai Tercapai
                                  </small>
                                )}
                              </div>
                            </div>
                          </Form.Group>
                        </Col>
                     </Row>
                  </div>
                </div>
              </Form>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer 
          style={{
            borderTop: `1px solid ${isDarkMode ? '#444' : '#e9ecef'}`,
            padding: '1rem 1.5rem'
          }}
        >
          <div className="d-flex justify-content-between w-100 align-items-center">
            <div>
              {selectedProgram?.updated_at && (
                <small className="text-muted">
                  Terakhir diubah: {new Date(selectedProgram.updated_at).toLocaleDateString('id-ID')}
                </small>
              )}
              
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowEditProgramModal(false)}
                disabled={uploadingFiles || isUploading}
                className="px-4"
              >
                Batal
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  // Validasi sebelum save
                  if (editingProgramData.status === 'tercapai' && !hasBuktiEvidence()) {
                    Swal.fire({
                      title: "Perhatian!",
                      html: `
                        <div class="text-start">
                          <p>Program ditandai sebagai <strong>Tercapai</strong> tetapi belum ada bukti.</p>
                          <p class="mb-0">Anda harus menambahkan:</p>
                          <ul class="mt-1">
                            <li>URL Bukti, atau</li>
                            <li>File Bukti</li>
                          </ul>
                        </div>
                      `,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Simpan sebagai Belum Tercapai",
                      cancelButtonText: "Kembali ke Form",
                      confirmButtonColor: "#3085d6",
                      cancelButtonColor: "#d33",
                    }).then((result) => {
                      if (result.isConfirmed) {
                        // Ubah status ke belum tercapai lalu save
                        setEditingProgramData(prev => ({
                          ...prev,
                          status: 'tidak'
                        }));
                        // Tunggu state update lalu save
                        setTimeout(() => {
                          handleSaveProgramEdit();
                        }, 100);
                      }
                    });
                    return;
                  }
                  handleSaveProgramEdit();
                }}
                disabled={uploadingFiles || isUploading || !editingProgramData.program_holding.trim()}
                className="px-4"
              >
                {uploadingFiles || isUploading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {isUploading ? 'Mengupload...' : 'Menyimpan...'}
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="me-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
     
      {/* Modal Bukti */}
      <Modal show={showBuktiModal} onHide={() => setShowBuktiModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedMonth?.title} - Bukti Ketercapaian
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>URL Bukti (Opsional)</Form.Label>
            <Form.Control
              type="url"
              value={buktiData.bukti_url}
              onChange={(e) => setBuktiData(prev => ({ ...prev, bukti_url: e.target.value }))}
              placeholder="https://contoh.com/bukti"
            />
            <Form.Text className="text-muted">
              Link ke dokumen atau dashboard external
            </Form.Text>
          </Form.Group>
          
          <Form.Group>
            <Form.Label>Upload File Bukti</Form.Label>
            <Form.Control type="file" multiple />
            <Form.Text className="text-muted">
              Upload file pendukung (PDF, Image, Excel, dll). Maks 5 file.
            </Form.Text>
          </Form.Group>
          
          {buktiData.bukti_attachments.length > 0 && (
            <div className="mt-3">
              <h6>File Terlampir:</h6>
              <ul className="list-unstyled">
                {buktiData.bukti_attachments.map((att, idx) => (
                  <li key={idx} className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded">
                    <div>
                      <FiFileText className="me-2" />
                      {att.name}
                    </div>
                    <Button size="sm" variant="outline-primary" as="a" href={att.url} target="_blank">
                      Lihat
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBuktiModal(false)}>
            Batal
          </Button>
          <Button variant="success">
            Simpan Bukti
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Tambah Program */}
      <Modal show={showAddProgramModal} onHide={() => !uploading && setShowAddProgramModal(false)}>
        <Modal.Header closeButton={!uploading}>
          <Modal.Title>
            Tambah Program - {selectedMonth?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Menambahkan program...</div>
            </div>
          ) : (
            <Form.Group>
              <Form.Label>Program Holding</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newProgramData.program_holding}
                onChange={(e) => setNewProgramData({ program_holding: e.target.value })}
                placeholder="Contoh: Meningkatkan produktivitas tim sebesar 20%"
                autoFocus
              />
              <Form.Text className="text-muted">
                Program akan ditambahkan ke bulan {selectedMonth?.title}
              </Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowAddProgramModal(false)}
            disabled={uploading}
          >
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={() => selectedMonth && handleAddProgram(selectedMonth.id)}
            disabled={uploading || !newProgramData.program_holding.trim()}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Menambahkan...
              </>
            ) : (
              'Tambah Program'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProgramHoldingBoard;