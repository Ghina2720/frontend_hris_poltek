import { Card, Col, Row, Button, Modal, Form, Badge, Table as BootstrapTable } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaEye, FaHistory } from "react-icons/fa";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";

// Ambil token dari localStorage
const token = localStorage.getItem("authToken");

// Base URL dari .env
const baseURL = import.meta.env.VITE_API_BASE_URL;

// axios instance
const axiosInstance = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ─────────────────────────────────────────────────────────────
// 🔹 HELPER COMPONENTS (Badge)
// ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const getVariant = () => {
    if (status === 'menunggu') return 'warning';
    if (status === 'diterima') return 'success';
    if (status === 'ditolak') return 'danger';
    if (status?.startsWith('diterima_oleh_')) return 'info';
    return 'secondary';
  };
  const getLabel = () => {
    if (status === 'menunggu') return 'Menunggu';
    if (status === 'diterima') return 'Diterima';
    if (status === 'ditolak') return 'Ditolak';
    if (status?.startsWith('diterima_oleh_')) {
      const role = status.replace('diterima_oleh_', '').replace(/_/g, ' ');
      return `Diterima ${role}`;
    }
    return status;
  };
  return <Badge bg={getVariant()} className="px-2 py-1">{getLabel()}</Badge>;
};

const EksekusiBadge = ({ value }) => {
  if (value === 'plus') return <Badge bg="success" className="px-2 py-1">Plus (+)</Badge>;
  if (value === 'minus') return <Badge bg="danger" className="px-2 py-1">Minus (-)</Badge>;
  return <Badge bg="secondary">-</Badge>;
};

const CodeBadge = ({ value }) => {
  const colors = { 'SJT': 'primary', 'KT': 'success', 'IKT': 'info', 'PKT': 'warning', 'KTT': 'secondary', 'APS': 'danger' };
  return <Badge bg={colors[value] || 'light'} className="px-2 py-1">{value}</Badge>;
};

const ApprovalStatusBadge = ({ status }) => {
  return status === 'Diterima' 
    ? <Badge bg="success">✓ Diterima</Badge>
    : <Badge bg="danger">✗ Ditolak</Badge>;
};

// ─────────────────────────────────────────────────────────────
// 🔹 HELPER FUNCTIONS (LOGIC UTAMA)
// ─────────────────────────────────────────────────────────────

//  PRIORITASKAN current_step dari backend!
const getCurrentStep = (item, category) => {
  // 1. Kalau backend udah kirim current_step, pakai itu!
  if (item.current_step !== undefined && item.current_step !== null) {
    return item.current_step;
  }
  // 2. Fallback: hitung manual (kalo data lama / backend belum update)
  if (!category) return 1;
  if (item.status === 'diterima' || item.status === 'ditolak') {
    return category.approval_step || 1;
  }
  if (item.status === 'menunggu') return 1;
  if (item.status?.startsWith('diterima_oleh_')) {
    const count = (item.status.match(/diterima_oleh_/g) || []).length;
    return Math.min(count + 1, category.approval_step || 1);
  }
  return 1;
};

//  Cek apakah user boleh approve - pakai current_step dari backend
const canApprove = (row, categories, currentUserRole) => {
  const category = categories.find(c => c.id === row.category_point_id);
  if (!category) return false;
  
  // Final status = gak bisa approve
  if (row.status === 'diterima' || row.status === 'ditolak') return false;
  
  // approval_step = 0 = auto, gak perlu approve manual
  if (category.approval_step === 0) return false;
  
  //  PAKAI current_step dari backend!
  const currentStep = row.current_step ?? getCurrentStep(row, category);
  const totalSteps = row.total_steps || category.approval_step || 1;
  
  // Step udah lewat = gak bisa approve
  if (currentStep > totalSteps) return false;
  
  // Ambil role yang dibutuhkan untuk step ini
  const requiredRole = category[`approval_${currentStep}`];
  if (!requiredRole || requiredRole === 'system') return false;
  
  //  Cocokkan role user (bisa di-skip kalo mau bebas approve)
  return currentUserRole === requiredRole;
  
  // 💡 Kalo mau BEBAS approve (tanpa cek role), ganti return atas jadi:
  // return true;
};

//  Generate info untuk modal approval
const getApprovalInfo = (row, categories) => {
  const category = categories.find(c => c.id === row.category_point_id);
  if (!category) return { nextStatus: null, expectedRole: null, nextStep: 1, isLastStep: false, totalSteps: 1 };
  
  const totalSteps = category.approval_step || 1;
  const currentStep = row.current_step ?? getCurrentStep(row, category);
  const isLastStep = currentStep >= totalSteps;
  const expectedRole = category[`approval_${currentStep}`] || null;
  
  let nextStatus = 'diterima';
  if (expectedRole && !isLastStep) {
    nextStatus = `diterima_oleh_${expectedRole.toLowerCase().replace(/\s+/g, '_')}`;
  } else if (expectedRole) {
    nextStatus = `diterima_oleh_${expectedRole.toLowerCase().replace(/\s+/g, '_')}`;
  }
  
  return { nextStatus, expectedRole, nextStep: currentStep, isLastStep, totalSteps };
};

// ─────────────────────────────────────────────────────────────
// 🔹 MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const KlaimPoint = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [form, setForm] = useState({ category_point_id: "", detail: "" });

  // Filter state
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [showMyOnly, setShowMyOnly] = useState(false);
  const [currentUserHoldingKategori, setCurrentUserHoldingKategori] = useState('');

  const [users, setUsers] = useState([]);           // List user untuk dropdown
  const [currentUserData, setCurrentUserData] = useState(null);  // Data user login (id, name, dll)

  // ─────────────────────────────────────────────────────────
  // 🔹 FETCH FUNCTIONS
  // ─────────────────────────────────────────────────────────

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/category-poin");
      const items = res.data.data || [];
      const filtered = items.filter(item => 
        item.code !== 'SJT' && 
        !(item.code === 'APS' && item.approval_1 === 'system')
      );
      setCategories(filtered);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axiosInstance.get("/me");
      if (res.data) {
        //  Simpan data user lengkap
        setCurrentUserData(res.data);
        
        if (res.data.role?.name) {
          setCurrentUserRole(res.data.role.name);
        }
        if (res.data.holding?.kategori) {
          setCurrentUserHoldingKategori(res.data.holding.kategori);
        }
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  //  FETCH LIST USER UNTUK DROPDOWN (HR/Superadmin only)
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/users");
      let users = res.data.data || res.data || [];
      
      //  FILTER FRONTEND: Cuma tampilkan user holding BUKAN 'profit'
      const filtered = users.filter(user => {
        const holdingKategori = user.holding?.kategori;
        // Include: non_profit, undefined, null, kosong
        //  Exclude: 'profit'
        return holdingKategori !== 'profit';
      });
      
      setUsers(filtered);
      
    } catch (err) {
     
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/klaim-point");
      const items = res.data.data || [];
      
      //  Map data + pakai current_step & total_steps dari backend!
      const withNumber = items.map((item, index) => {
        const category = categories.find(c => c.id === item.category_point_id);
        const currentStep = getCurrentStep(item, category);
        
        return { 
          ...item, 
          no: index + 1,
          current_step: currentStep,
          total_steps: item.total_steps || category?.approval_step || 1
        };
      });
      
      setData(withNumber);
    } catch (err) {
      console.error("Error fetching ", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (id) => {
    try {
      const res = await axiosInstance.get(`/klaim-point/${id}/history`);
      let history = res.data.data || [];
      
      //  DEDUPLIKASI: Filter duplicate berdasarkan step + timestamp
      const uniqueHistory = history.filter((item, index, self) => 
        index === self.findIndex(t => 
          t.step === item.step && 
          t.tanggal === item.tanggal &&
          t.role === item.role
        )
      );
      
      setHistoryData(uniqueHistory);
      setShowHistoryModal(true);
    } catch (err) {
      console.error("Error fetching history:", err);
      Swal.fire({ icon: "error", title: "Gagal memuat history!", text: err?.response?.data?.message || err.message });
    }
  };

  // ─────────────────────────────────────────────────────────
  // 🔹 EFFECT: Load Data
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      await fetchCategories();
      await fetchCurrentUser();
      
      //  Fetch users kalo role HR/Superadmin (buat dropdown)
      const hrRoles = ['Direktur SDM', 'HRD', 'Staff HRD', 'Admin', 'Superadmin'];
      if (hrRoles.includes(currentUserRole)) {
        await fetchUsers();
      }
      
      await fetchData();
    } catch (error) {
      console.error("Error in loadData:", error);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [showMyOnly, filterStatus, filterCode, currentUserRole]);

const isHrRole = () => {
  const hrRoles = ['Direktur SDM', 'HRD', 'Staff HRD', 'Admin', 'Superadmin'];
  return hrRoles.includes(currentUserRole);
};

  // ─────────────────────────────────────────────────────────
  // 🔹 HANDLERS
  // ─────────────────────────────────────────────────────────

 const resetForm = () => {
  setEditId(null);
  setForm({ 
    category_point_id: "", 
    detail: "", 
    request_by: ""  // Reset request_by
  });
};

  const handleSave = async () => {
  // Validasi kategori
  if (!form.category_point_id) {
    Swal.fire({ icon: "warning", title: "Validasi", text: "Pilih kategori poin" });
    return;
  }

  //  VALIDASI USER
  const targetUserId = isHrRole() 
    ? (form.request_by || currentUserData?.id)  // HR: bisa pilih user lain
    : currentUserData?.id;                       // User biasa: wajib diri sendiri
  
  if (!targetUserId) {
    Swal.fire({ icon: "warning", title: "Validasi", text: "User tidak valid" });
    return;
  }

  try {
    const formData = { 
      ...form,
      request_by: targetUserId  //  Selalu kirim request_by ke backend
    };

    if (editId) {
      await axiosInstance.put(`/klaim-point/${editId}`, formData);
    } else {
      await axiosInstance.post("/klaim-point", formData);
    }

    Swal.fire({ 
      icon: "success", 
      title: "Berhasil!", 
      text: `Klaim point berhasil ${editId ? "diupdate" : "diajukan"}.`, 
      timer: 1500, 
      showConfirmButton: false 
    });

    setShowModal(false);
    resetForm();
    fetchData();
  } catch (err) {
    console.error("Error saving ", err);
    Swal.fire({ 
      icon: "error", 
      title: "Gagal menyimpan!", 
      text: err?.response?.data?.message || err.message 
    });
  }
};

  const handleApprove = async () => {
    if (!selectedItem) return;
    if (selectedItem.approveStatus === 'ditolak' && !selectedItem.catatan) {
      Swal.fire({ icon: "warning", title: "Validasi", text: "Catatan penolakan wajib diisi" });
      return;
    }
    try {
      const dataToSend = {
        status: selectedItem.approveStatus,
        catatan: selectedItem.catatan
      };
      // Kirim poin_fix hanya untuk final approval
      if (selectedItem.approveStatus !== 'ditolak' && selectedItem.isLastStep) {
        dataToSend.poin_fix = selectedItem.poin_fix > 0 ? selectedItem.poin_fix : null;
      }
      const response = await axiosInstance.post(`/klaim-point/${selectedItem.id}/approve`, dataToSend);
      Swal.fire({ icon: "success", title: "Berhasil!", text: response.data.message || `Klaim point berhasil ${selectedItem.approveStatus === 'ditolak' ? 'ditolak' : 'diterima'}.`, timer: 1500, showConfirmButton: false });
      setShowApproveModal(false);
      setSelectedItem(null);
      await fetchData(); //  Refresh data
    } catch (err) {
      console.error("Error approving ", err);
      Swal.fire({ icon: "error", title: "Gagal memproses!", text: err?.response?.data?.message || err.message });
    }
  };

  const handleEdit = (row) => {
    if (row.status !== 'menunggu' && !row.status.includes('menunggu')) {
      Swal.fire({ icon: "warning", title: "Tidak dapat diedit", text: "Hanya klaim dengan status Menunggu yang bisa diedit" });
      return;
    }
    setEditId(row.id);
    setForm({ category_point_id: row.category_point_id, detail: row.detail || "" });
    setShowModal(true);
  };

  const handleDelete = async (id, status) => {
    if (status !== 'menunggu' && !status.includes('menunggu')) {
      Swal.fire({ icon: "warning", title: "Tidak dapat dihapus", text: "Hanya klaim dengan status Menunggu yang bisa dihapus" });
      return;
    }
    const confirm = await Swal.fire({ title: "Yakin hapus data ini?", text: "Data yang dihapus tidak bisa dikembalikan!", icon: "warning", showCancelButton: true, confirmButtonText: "Ya, hapus!", cancelButtonText: "Batal" });
    if (!confirm.isConfirmed) return;
    try {
      await axiosInstance.delete(`/klaim-point/${id}`);
      Swal.fire({ icon: "success", title: "Berhasil!", text: "Data berhasil dihapus.", timer: 1500, showConfirmButton: false });
      fetchData();
    } catch (err) {
      console.error("Error deleting ", err);
      Swal.fire({ icon: "error", title: "Gagal menghapus!", text: err?.response?.data?.message || err.message });
    }
  };

  const handleViewDetail = (row) => { setSelectedItem(row); setShowDetailModal(true); };
  const handleViewHistory = (row) => { setSelectedItem(row); fetchHistory(row.id); };

  const handleOpenApprove = (row) => {
    const { nextStatus, expectedRole, nextStep, isLastStep, totalSteps } = getApprovalInfo(row, categories);
    const category = categories.find(c => c.id === row.category_point_id);
    
    setSelectedItem({
      ...row,
      approveStatus: nextStatus,
      catatan: '',
      poin_fix: row.poin_fix || category?.poin || 0,
      expectedRole,
      nextStep,
      totalSteps,
      poin: category?.poin || 0,
      category,
      isLastStep
    });
    setShowApproveModal(true);
  };

  // ─────────────────────────────────────────────────────────
  // 🔹 COLUMNS DEFINITION
  // ─────────────────────────────────────────────────────────

  const columns = [
    { Header: "No", accessor: "no", sort: true, width: 70 },
    { 
      Header: "Nama", accessor: "requester.name", sort: true, width: 150,
      Cell: ({ row }) => <span>{row.original.requester?.name || '-'}</span>
    },
    { 
      Header: "Tanggal", accessor: "created_at", sort: true,
      Cell: ({ value }) => value ? new Date(value).toLocaleDateString('id-ID') : '-'
    },
    { Header: "Kategori", accessor: "name", sort: true },
    { Header: "Kode", accessor: "code", sort: true },
    { 
      Header: "Detail", accessor: "detail", sort: true,
      Cell: ({ value }) => !value ? '-' : (value.length > 50 ? value.substring(0, 50) + '...' : value)
    },
    { Header: "Eksekusi", accessor: "eksekusi", sort: true, Cell: ({ value }) => <EksekusiBadge value={value} /> },
    { 
      Header: "Poin", accessor: "poin_fix", sort: true, width: 100,
      Cell: ({ value, row }) => {
        const category = categories.find(c => c.id === row.original.category_point_id);
        const defaultPoin = category?.poin || 0;
        const status = row.original.status;
        
        if (status === 'diterima') return <Badge bg="success">{value || defaultPoin} Poin</Badge>;
        if (status === 'ditolak') return <Badge bg="danger">0 Poin</Badge>;
        return <Badge bg="secondary">{defaultPoin} Poin</Badge>;
      }
    },
    { 
      Header: "Step", accessor: "current_step", sort: true, width: 100,
      Cell: ({ value, row }) => {
        const status = row.original.status;
        const totalSteps = row.original.total_steps || 1;
        const currentStep = row.original.current_step || 1;
        
        if (totalSteps === 0) return <Badge bg="success">Auto</Badge>;
        if (status === 'diterima') return <Badge bg="success">Selesai</Badge>;
        if (status === 'ditolak') return <Badge bg="danger">Ditolak</Badge>;
        
        // Tampilkan "Menunggu [Role]" kalo ada expected role
        const category = categories.find(c => c.id === row.original.category_point_id);
        const nextRole = category?.[`approval_${currentStep}`];
        if (nextRole && status !== 'menunggu') {
          return <Badge bg="warning">Menunggu {nextRole}</Badge>;
        }
        return <Badge bg="info">{currentStep}/{totalSteps}</Badge>;
      }
    },
    { Header: "Status", accessor: "status", sort: true, Cell: ({ value }) => <StatusBadge status={value} /> },
    {
      Header: "Aksi", width: 200,
      Cell: ({ row }) => (
        <div className="d-flex gap-2">
          <FaEye className="text-info" style={{ cursor: "pointer" }} onClick={() => handleViewDetail(row.original)} title="Lihat Detail" />
          <FaHistory className="text-primary" style={{ cursor: "pointer" }} onClick={() => handleViewHistory(row.original)} title="Lihat History" />
          
          {row.original.status === 'menunggu' && (
            <>
              <FaEdit className="text-warning" style={{ cursor: "pointer" }} onClick={() => handleEdit(row.original)} title="Edit" />
              <FaTrash className="text-danger" style={{ cursor: "pointer" }} onClick={() => handleDelete(row.original.id, row.original.status)} title="Hapus" />
            </>
          )}
          
          {/*  Tombol Approval - pakai canApprove yang udah pakai current_step dari backend */}
          {canApprove(row.original, categories, currentUserRole) && (
            <FaCheck className="text-success" style={{ cursor: "pointer" }} onClick={() => handleOpenApprove(row.original)} title="Proses Approval" />
          )}
        </div>
      )
    }
  ];

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "All", value: data.length || 5 },
  ];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "menunggu", label: "Menunggu" },
    { value: "diterima", label: "Diterima" },
    { value: "ditolak", label: "Ditolak" }
  ];

  const codeOptions = [
    { value: "", label: "Semua Kode" },
    { value: "KT", label: "KT - Kinerja Talent" },
    { value: "IKT", label: "IKT - Inovasi Kreativitas Talent" },
    { value: "PKT", label: "PKT - Prestasi Kerja Talent" },
    { value: "KTT", label: "KTT - Kepatuhan Terhadap Tata Tertib" },
    { value: "APS", label: "APS - Akumulasi Pengurangan Skor" }
  ];

  // ─────────────────────────────────────────────────────────
  // 🔹 ACCESS CONTROL: Non Profit Only
  // ─────────────────────────────────────────────────────────

  if (currentUserHoldingKategori && currentUserHoldingKategori !== 'non_profit') {
    return (
      <>
        <PageTitle breadCrumbItems={[{ label: "Transaksi", path: "/transaksi" }, { label: "Klaim Point", active: true }]} title={"Klaim Point"} />
        <Row><Col><Card><Card.Body className="text-center py-5">
          <i className="bi bi-shield-lock text-warning" style={{ fontSize: '4rem' }}></i>
          <h3 className="mt-4">Akses Dibatasi</h3>
          <p className="text-muted mb-4">Fitur Klaim Point hanya tersedia untuk holding dengan kategori <strong>Non Profit</strong>.</p>
          <div className="alert alert-light d-inline-block mx-auto"><strong>Holding Anda Kategori:</strong> {currentUserHoldingKategori}</div>
        </Card.Body></Card></Col></Row>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────
  // 🔹 MAIN JSX RETURN
  // ─────────────────────────────────────────────────────────

  return (
    <>
      <PageTitle breadCrumbItems={[{ label: "Transaksi", path: "/transaksi" }, { label: "Klaim Point", path: "/transaksi/klaim-point", active: true }]} title={"Klaim Point"} />

      <Row><Col><Card><Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="header-title">Data Klaim Point</h4>
          <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FaPlus className="me-2" /> Ajukan Klaim
          </Button>
        </div>

        {/* Filter Section */}
        {/* <Row className="mb-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Filter Status</Form.Label>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Filter Kode</Form.Label>
              <Form.Select value={filterCode} onChange={(e) => setFilterCode(e.target.value)}>
                {codeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mt-4">
              <Form.Check type="checkbox" id="myOnly" label="Tampilkan hanya klaim saya" checked={showMyOnly} onChange={(e) => setShowMyOnly(e.target.checked)} disabled={['Talent','Staff','Magang'].includes(currentUserRole)} />
            </Form.Group>
          </Col>
        </Row> */}

        <Table columns={columns} data={data} pageSize={5} sizePerPageList={sizePerPageList} isSortable={true} pagination={true} isSearchable={true} loading={loading} />
      </Card.Body></Card></Col></Row>

      {/* ─────────────────────────────────────────────────── */}
      {/* 🔹 MODAL: Tambah/Edit Klaim */}
      {/* ─────────────────────────────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{editId ? "Edit Klaim Point" : "Ajukan Klaim Point"}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Kategori Poin <span className="text-danger">*</span></Form.Label>
              <Form.Select 
                value={form.category_point_id} 
                onChange={(e) => setForm({ ...form, category_point_id: e.target.value })} 
                disabled={editId}  // DISABLE KALO LAGI EDIT!
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.code} - {cat.name} ({cat.eksekusi === 'plus' ? 'Plus' : 'Minus'} {cat.poin} Poin) 
                  </option>
                ))}
              </Form.Select>
              
              {/*  INFO: Kalo lagi edit, kasih tau user */}
              {editId && (
                <Form.Text className="text-muted">
                  <small>Kategori tidak dapat diubah setelah klaim diajukan</small>
                </Form.Text>
              )}
            </Form.Group>
            {/*  USER SELECTION: Dropdown untuk HR, Read-only untuk User biasa */}
            <Form.Group className="mb-3">
              <Form.Label>
                {isHrRole() ? 'User yang Diklaim' : 'User'} 
                <span className="text-danger">*</span>
              </Form.Label>
              
              {isHrRole() ? (
                //  HR/Superadmin: Dropdown pilih user
                <Form.Select
                  value={form.request_by || currentUserData?.id || ""}
                  onChange={(e) => setForm({ ...form, request_by: e.target.value })}
                >
                  <option value="">-- Pilih User --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} 
                    </option>
                  ))}
                </Form.Select>
              ) : (
                //  User biasa: Auto pilih diri sendiri (read-only)
                <Form.Control
                  type="text"
                  value={currentUserData?.name || '-'}
                  disabled
                  placeholder="Anda hanya dapat mengajukan untuk diri sendiri"
                />
              )}
              
              
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Detail / Keterangan</Form.Label>
              <Form.Control as="textarea" rows={4} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Jelaskan detail klaim point Anda..." />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSave}>{editId ? "Update" : "Ajukan"}</Button>
        </Modal.Footer>
      </Modal>

      {/* ─────────────────────────────────────────────────── */}
      {/* 🔹 MODAL: Detail Klaim */}
      {/* ─────────────────────────────────────────────────── */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton><Modal.Title>Detail Klaim Point</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <table className="table table-bordered">
              <tbody>
                <tr><th>Kategori</th><td>{selectedItem.name}</td></tr>
                <tr><th>Kode</th><td><CodeBadge value={selectedItem.code} /></td></tr>
                <tr><th>Detail</th><td>{selectedItem.detail || '-'}</td></tr>
                <tr><th>Eksekusi</th><td>{selectedItem.eksekusi}</td></tr>
                <tr><th>Poin</th><td>{selectedItem.poin_fix > 0 ? <Badge bg="success">{selectedItem.poin_fix}</Badge> : <Badge bg="secondary">0</Badge>}</td></tr>
                <tr><th>Step</th><td>{selectedItem.current_step || 1} / {selectedItem.total_steps || 1}</td></tr>
                <tr><th>Status</th><td><StatusBadge status={selectedItem.status} /></td></tr>
                {selectedItem.catatan && <tr><th>Catatan</th><td className="text-danger">{selectedItem.catatan}</td></tr>}
                <tr><th>Tanggal</th><td>{new Date(selectedItem.created_at).toLocaleString('id-ID')}</td></tr>
              </tbody>
            </table>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowDetailModal(false)}>Tutup</Button></Modal.Footer>
      </Modal>

      {/* ─────────────────────────────────────────────────── */}
      {/* 🔹 MODAL: Approval */}
      {/* ─────────────────────────────────────────────────── */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton><Modal.Title>Proses Approval Klaim</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedItem ? (
            <Form>
              <div className="mb-3 p-3 bg-light rounded small">
                <strong>Kategori:</strong> {selectedItem.name}<br/>
                <strong>Kode:</strong> <CodeBadge value={selectedItem.code} /><br/>
                <strong>Detail:</strong> {selectedItem.detail || '-'}<br/>
                <strong>Pengaju:</strong> {selectedItem.requester?.name || '-'}<br/>
                <strong>Step:</strong> {selectedItem.nextStep} / {selectedItem.totalSteps}<br/>
                <strong>Role:</strong> <Badge bg="info">{selectedItem.expectedRole}</Badge><br/>
                <strong>Poin:</strong> <Badge bg="primary">{selectedItem.poin} Poin</Badge>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Status Approval</Form.Label>
                <Form.Select value={selectedItem.approveStatus || ''} onChange={(e) => setSelectedItem({ ...selectedItem, approveStatus: e.target.value })}>
                  {selectedItem.expectedRole && (
                    <option value={`diterima_oleh_${selectedItem.expectedRole.toLowerCase().replace(/\s+/g, '_')}`}>
                      ✓ Diterima Oleh {selectedItem.expectedRole} {selectedItem.isLastStep ? '(Final)' : ''}
                    </option>
                  )}
                  <option value="ditolak">✗ Ditolak</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  {selectedItem.isLastStep ? ' Final: Poin akan diproses' : `Step ${selectedItem.nextStep}/${selectedItem.totalSteps}: Lanjut ke approver berikutnya`}
                </Form.Text>
              </Form.Group>

              {selectedItem.approveStatus !== 'ditolak' && selectedItem.isLastStep && (
                <Form.Group className="mb-3">
                  <Form.Label>Poin Final <span className="text-muted">(opsional)</span></Form.Label>
                  <Form.Control type="number" min="0" value={selectedItem.poin_fix || ''} onChange={(e) => setSelectedItem({ ...selectedItem, poin_fix: parseInt(e.target.value) || 0 })} placeholder={`Default: ${selectedItem.poin} poin`} />
                </Form.Group>
              )}

              {selectedItem.approveStatus === 'ditolak' && (
                <Form.Group className="mb-3">
                  <Form.Label>Catatan Penolakan <span className="text-danger">*</span></Form.Label>
                  <Form.Control as="textarea" rows={3} value={selectedItem.catatan || ''} onChange={(e) => setSelectedItem({ ...selectedItem, catatan: e.target.value })} placeholder="Alasan penolakan..." />
                </Form.Group>
              )}
            </Form>
          ) : <p className="text-muted text-center">Loading...</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>Batal</Button>
          <Button variant={selectedItem?.approveStatus === 'ditolak' ? 'danger' : 'success'} onClick={handleApprove} disabled={!selectedItem}>
            {selectedItem?.approveStatus === 'ditolak' ? 'Tolak' : 'Setujui'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─────────────────────────────────────────────────── */}
      {/* 🔹 MODAL: History Approval */}
      {/* ─────────────────────────────────────────────────── */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>History Approval</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <>
              <div className="mb-3"><strong>Kategori:</strong> {selectedItem.name} | <strong>Kode:</strong> <CodeBadge value={selectedItem.code} /></div>
              {historyData.length > 0 ? (
                <BootstrapTable striped bordered hover size="sm">
                  <thead><tr><th>Step</th><th>Status</th><th>Approver</th><th>Role</th><th>Tanggal</th></tr></thead>
                  <tbody>
                    {historyData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center">Step {item.step}</td>
                        <td><ApprovalStatusBadge status={item.status} /></td>
                        <td>{item.approver || '-'}</td>
                        <td>{item.role || '-'}</td>
                        <td>{item.tanggal || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </BootstrapTable>
              ) : <p className="text-muted text-center">Belum ada history approval</p>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Tutup</Button></Modal.Footer>
      </Modal>
    </>
  );
};

export default KlaimPoint;