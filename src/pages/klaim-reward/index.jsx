import { Card, Col, Row, Button, Modal, Form, Badge } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaEye } from "react-icons/fa";
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

// Helper untuk badge status
const StatusBadge = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case 'menunggu': return 'warning';
      case 'disetujui': return 'success';
      case 'ditolak': return 'danger';
      default: return 'secondary';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'menunggu': return 'Menunggu';
      case 'disetujui': return 'Disetujui';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  return <Badge bg={getVariant()} className="px-2 py-1">{getLabel()}</Badge>;
};

// Helper untuk badge kode reward
const RewardCodeBadge = ({ value }) => {
  const colors = {
    'RPDN': 'success',
    'RPLN': 'primary'
  };
  
  const color = colors[value] || 'secondary';
  return <Badge bg={color} className="px-2 py-1">{value}</Badge>;
};

const KlaimReward = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // ⬅️ TAMBAHKAN STATE UNTUK HOLDING
  const [currentUserHoldingKategori, setCurrentUserHoldingKategori] = useState('');
  const [currentUserHoldingName, setCurrentUserHoldingName] = useState('');

  const [form, setForm] = useState({
    category_reward_id: "",
    destinasi_wisata: ""
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [showMyOnly, setShowMyOnly] = useState(false);
  const [hasPendingClaim, setHasPendingClaim] = useState(false);

  // Fetch data klaim reward
  const fetchData = async () => {
    setLoading(true);
    try {
        let url = "/klaim-reward";
        const params = new URLSearchParams();
        
        // FILTER BERDASARKAN ROLE
        if (currentUserRole) {
        if (currentUserRole === 'User' || currentUserRole === 'Talent' || currentUserRole === 'Staff' || currentUserRole === 'Magang') {
            params.append("my_only", "true");
        } 
        else if (currentUserRole === 'Direktur') {
            params.append("role", "direktur");
            params.append("user_id", currentUserId);
        }
        }
        
        if (showMyOnly && !['User', 'Talent', 'Staff', 'Magang', 'Direktur'].includes(currentUserRole)) {
        params.append("my_only", "true");
        }
        
        if (filterStatus) params.append("status", filterStatus);
        if (filterCode) params.append("code_reward", filterCode);
        
        if (params.toString()) url += "?" + params.toString();
        
        const res = await axiosInstance.get(url);
        const items = res.data.data || [];
        
        const withNumber = items.map((item, index) => ({
        ...item,
        no: index + 1
        }));
        
        setData(withNumber);
        
        // CEK APAKAH USER PUNYA KLAIM MENUNGGU
        if (currentUserId) {
        const userPendingClaims = items.filter(
            item => item.request_by === currentUserId && item.status === 'menunggu'
        );
        setHasPendingClaim(userPendingClaims.length > 0);
        }
        
    } catch (err) {
        console.error("Error fetching data:", err);
        Swal.fire({
        icon: "error",
        title: "Gagal memuat data!",
        text: err?.response?.data?.message || err.message
        });
    } finally {
        setLoading(false);
    }
   };

  // Fetch kategori reward untuk dropdown
  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/category-reward");
      const items = res.data.data || [];
      setCategories(items);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };
  

  // Fetch current user - UBAH INI
  const fetchCurrentUser = async () => {
    try {
      const res = await axiosInstance.get("/me");
      if (res.data?.role?.name) {
        setCurrentUserRole(res.data.role.name);
        setCurrentUserId(res.data.id);
        
        // ⬅️ AMBIL DATA HOLDING
        if (res.data.holding) {
          setCurrentUserHoldingKategori(res.data.holding.kategori || '');
          setCurrentUserHoldingName(res.data.holding.name || '');
        }
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
            await fetchCategories();
            await fetchCurrentUser();
            await fetchData();
            } catch (error) {
            console.error("Error in loadData:", error);
            } finally {
            setLoading(false);
            }
        };
        loadData();
    }, [showMyOnly, filterStatus, filterCode, currentUserRole]);

  // ⬅️ GUARD CLAUSE - CEK HOLDING NON PROFIT
  if (currentUserHoldingKategori && currentUserHoldingKategori !== 'non_profit') {
    return (
      <>
        <PageTitle
          breadCrumbItems={[
            { label: "Transaksi", path: "/transaksi" },
            { label: "Klaim Reward", active: true }
          ]}
          title={"Klaim Reward"}
        />
        <Row>
          <Col>
            <Card>
              <Card.Body className="text-center py-5">
                <h3 className="mt-4">Akses Dibatasi</h3>
                <p className="text-muted mb-4">
                  Fitur Klaim Reward hanya tersedia untuk holding dengan kategori <strong>Non Profit</strong>.
                </p>
                <div className="alert alert-light d-inline-block mx-auto">
                  <strong>Holding Anda:</strong> {currentUserHoldingName} - Kategori: {currentUserHoldingKategori}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  }

  // Handle save (tambah/edit)
  const handleSave = async () => {
    if (!form.category_reward_id) {
      Swal.fire({
        icon: "warning",
        title: "Validasi",
        text: "Pilih kategori reward"
      });
      return;
    }

    try {
      if (editId) {
        await axiosInstance.put(`/klaim-reward/${editId}`, form);
      } else {
        await axiosInstance.post("/klaim-reward", form);
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Klaim reward berhasil ${editId ? "diupdate" : "diajukan"}.`,
        timer: 1500,
        showConfirmButton: false
      });

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error saving data:", err);
      
      // Tampilkan pesan error spesifik dari backend
      const errorMsg = err?.response?.data?.message || err.message;
      
      // Jika error karena poin tidak cukup
      if (errorMsg.includes('Poin tidak mencukupi')) {
        Swal.fire({
          icon: "error",
          title: "Poin Tidak Cukup!",
          text: "Maaf, poin Anda tidak mencukupi untuk klaim reward ini.",
          
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal menyimpan!",
          text: errorMsg
        });
      }
    }
  };

  // Handle approve/tolak
  const handleApprove = async () => {
    if (!selectedItem) return;

    if (selectedItem.approveStatus === 'ditolak' && !selectedItem.catatan) {
      Swal.fire({
        icon: "warning",
        title: "Validasi",
        text: "Catatan penolakan wajib diisi"
      });
      return;
    }

    try {
      const dataToSend = {
        status: selectedItem.approveStatus,
        catatan: selectedItem.catatan
      };
      
      const response = await axiosInstance.post(`/klaim-reward/${selectedItem.id}/approve`, dataToSend);

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: response.data.message || `Klaim reward berhasil ${selectedItem.approveStatus === 'ditolak' ? 'ditolak' : 'disetujui'}.`,
        timer: 1500,
        showConfirmButton: false
      });

      setShowApproveModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      console.error("Error approving data:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal memproses!",
        text: err?.response?.data?.message || err.message
      });
    }
  };

  // Handle edit
  const handleEdit = (row) => {
    if (row.status !== 'menunggu') {
      Swal.fire({
        icon: "warning",
        title: "Tidak dapat diedit",
        text: "Hanya klaim dengan status Menunggu yang bisa diedit"
      });
      return;
    }

    setEditId(row.id);
    setForm({
      category_reward_id: row.category_reward_id,
      destinasi_wisata: row.destinasi_wisata || ""
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id, status) => {
    if (status !== 'menunggu') {
      Swal.fire({
        icon: "warning",
        title: "Tidak dapat dihapus",
        text: "Hanya klaim dengan status Menunggu yang bisa dihapus"
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Yakin hapus data ini?",
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axiosInstance.delete(`/klaim-reward/${id}`);
      
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data berhasil dihapus.",
        timer: 1500,
        showConfirmButton: false
      });

      fetchData();
    } catch (err) {
      console.error("Error deleting data:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal menghapus!",
        text: err?.response?.data?.message || err.message
      });
    }
  };

  // Handle view detail
  const handleViewDetail = (row) => {
    setSelectedItem(row);
    setShowDetailModal(true);
  };

  // Handle approve modal
  const handleOpenApprove = (row) => {
    setSelectedItem({
      ...row,
      approveStatus: 'disetujui',
      catatan: ''
    });
    setShowApproveModal(true);
  };

  // Cek apakah user berhak approve (hanya Direktur SDM, Admin, Superadmin)
  const canApprove = (row) => {
    if (row.status !== 'menunggu') return false;
    return ['Direktur SDM', 'Admin', 'Superadmin'].includes(currentUserRole);
  };

  // Reset form
  const resetForm = () => {
    setEditId(null);
    setForm({
      category_reward_id: "",
      destinasi_wisata: ""
    });
  };

  // Columns definition
  const columns = [
    { 
      Header: "No", 
      accessor: "no", 
      width: 70 
    },
    { 
      Header: "Nama", 
      accessor: "requester.name",
      Cell: ({ row }) => row.original.requester?.name || '-'
    },
    { 
      Header: "Tanggal", 
      accessor: "request_at",
      Cell: ({ value }) => value ? new Date(value).toLocaleDateString('id-ID') : '-'
    },
    { 
      Header: "Reward", 
      accessor: "name_reward",
      Cell: ({ value, row }) => (
        <div>
          <div>{value || row.original.code_reward}</div>
          <small className="text-muted">{row.original.code_reward}</small>
        </div>
      )
    },
    { 
      Header: "Kode", 
      accessor: "code_reward",
      Cell: ({ value }) => <RewardCodeBadge value={value} />
    },
    { 
      Header: "Biaya Poin", 
      accessor: "biaya_point",
      Cell: ({ value }) => <span className="fw-bold text-primary">{value} Poin</span>
    },
    { 
      Header: "Destinasi", 
      accessor: "destinasi_wisata",
      Cell: ({ value }) => value || <span className="text-muted">-</span>
    },
    { 
      Header: "Status", 
      accessor: "status",
      Cell: ({ value }) => <StatusBadge status={value} />
    },
    {
      Header: "Aksi",
      width: 200,
      Cell: ({ row }) => (
        <div className="d-flex gap-2">
          <FaEye
            className="text-info"
            style={{ cursor: "pointer" }}
            onClick={() => handleViewDetail(row.original)}
            title="Lihat Detail"
          />
          
          {/* Tombol Edit & Hapus - hanya untuk status menunggu dan milik sendiri */}
          {row.original.status === 'menunggu' && row.original.request_by === currentUserId && (
            <>
              <FaEdit
                className="text-warning"
                style={{ cursor: "pointer" }}
                onClick={() => handleEdit(row.original)}
                title="Edit"
              />
              <FaTrash
                className="text-danger"
                style={{ cursor: "pointer" }}
                onClick={() => handleDelete(row.original.id, row.original.status)}
                title="Hapus"
              />
            </>
          )}
          
          {/* Tombol Approval - hanya untuk role tertentu */}
          {canApprove(row.original) && (
            <FaCheck
              className="text-success"
              style={{ cursor: "pointer" }}
              onClick={() => handleOpenApprove(row.original)}
              title="Proses Approval"
            />
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

  // Options untuk filter status
  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "menunggu", label: "Menunggu" },
    { value: "disetujui", label: "Disetujui" },
    { value: "ditolak", label: "Ditolak" }
  ];

  // Options untuk filter kode
  const codeOptions = [
    { value: "", label: "Semua Kode" },
    { value: "RPDN", label: "RPDN - Perjalanan Dalam Negeri" },
    { value: "RPLN", label: "RPLN - Perjalanan Luar Negeri" }
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Transaksi", path: "/transaksi" },
          { label: "Klaim Reward", path: "/transaksi/klaim-reward", active: true }
        ]}
        title={"Klaim Reward"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h4 className="header-title">Data Klaim Reward</h4>
                <div className="d-flex flex-column align-items-end">
                    <Button 
                    variant="primary" 
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    disabled={hasPendingClaim}
                    title={hasPendingClaim ? "Anda masih memiliki klaim yang menunggu persetujuan" : ""}
                    >
                    <FaPlus className="me-2" />
                    Ajukan Reward
                    </Button>
                    
                    {/* Info pending di sebelah kanan, di bawah button */}
                    {hasPendingClaim && (
                    <div className="text-warning mt-2 text-end">
                        <small>
                        <i className="bi bi-info-circle me-1"></i>
                        Masih ada klaim menunggu persetujuan
                        </small>
                    </div>
                    )}
                </div>
                </div>

              {/* Filter Section */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filter Status</Form.Label>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filter Kode</Form.Label>
                    <Form.Select
                      value={filterCode}
                      onChange={(e) => setFilterCode(e.target.value)}
                    >
                      {codeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mt-4">
                    <Form.Check
                      type="checkbox"
                      id="myOnly"
                      label="Tampilkan hanya klaim saya"
                      checked={showMyOnly}
                      onChange={(e) => setShowMyOnly(e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Table
                columns={columns}
                data={data}
                pageSize={5}
                sizePerPageList={sizePerPageList}
                isSortable={true}
                pagination={true}
                isSearchable={true}
                loading={loading}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Form (Ajukan/Edit Reward) */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editId ? "Edit Klaim Reward" : "Ajukan Klaim Reward"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Pilih Reward <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={form.category_reward_id}
                onChange={(e) => setForm({ ...form, category_reward_id: e.target.value })}
                disabled={editId}
              >
                <option value="">-- Pilih Reward --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.kode} - {cat.name || cat.kode} ({cat.poin} Poin)
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Pilih reward yang ingin Anda klaim
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Destinasi Wisata Pilihan</Form.Label>
              <Form.Control
                type="text"
                value={form.destinasi_wisata}
                onChange={(e) => setForm({ ...form, destinasi_wisata: e.target.value })}
                placeholder="Contoh: Bali, Lombok, Yogyakarta"
              />
              <Form.Text className="text-muted">
                (Opsional) Tuliskan destinasi wisata yang Anda inginkan
              </Form.Text>
            </Form.Group>

            {!editId && form.category_reward_id && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Setelah diajukan, reward akan diverifikasi oleh Direktur SDM.
                {categories.find(c => c.id === parseInt(form.category_reward_id)) && (
                  <div className="mt-2">
                    <strong>Biaya:</strong> {
                      categories.find(c => c.id === parseInt(form.category_reward_id)).poin
                    } Poin akan dipotong dari akun Anda.
                  </div>
                )}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editId ? "Update" : "Ajukan"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Detail */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detail Klaim Reward</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th width="40%">Pengaju</th>
                    <td>{selectedItem.requester?.name || '-'}</td>
                  </tr>
                  <tr>
                    <th>Reward</th>
                    <td>{selectedItem.name_reward || selectedItem.code_reward}</td>
                  </tr>
                  <tr>
                    <th>Kode</th>
                    <td><RewardCodeBadge value={selectedItem.code_reward} /></td>
                  </tr>
                  <tr>
                    <th>Biaya Poin</th>
                    <td><span className="fw-bold text-primary">{selectedItem.biaya_point} Poin</span></td>
                  </tr>
                  <tr>
                    <th>Destinasi</th>
                    <td>{selectedItem.destinasi_wisata || '-'}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td><StatusBadge status={selectedItem.status} /></td>
                  </tr>
                  {selectedItem.catatan && (
                    <tr>
                      <th>Catatan</th>
                      <td className="text-danger">{selectedItem.catatan}</td>
                    </tr>
                  )}
                  <tr>
                    <th>Tanggal Pengajuan</th>
                    <td>{new Date(selectedItem.request_at).toLocaleString('id-ID')}</td>
                  </tr>
                  {selectedItem.approved_at && (
                    <tr>
                      <th>Tanggal Approval</th>
                      <td>{new Date(selectedItem.approved_at).toLocaleString('id-ID')}</td>
                    </tr>
                  )}
                  {selectedItem.approver && (
                    <tr>
                      <th>Disetujui Oleh</th>
                      <td>{selectedItem.approver.name} ({selectedItem.approver.role?.name})</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Approval */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Proses Approval Reward</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <Form>
              <div className="mb-3 p-3 bg-light rounded">
                <strong>Pengaju:</strong> {selectedItem.requester?.name}<br/>
                <strong>Reward:</strong> {selectedItem.name_reward || selectedItem.code_reward}<br/>
                <strong>Biaya Poin:</strong> {selectedItem.biaya_point} Poin<br/>
                <strong>Destinasi:</strong> {selectedItem.destinasi_wisata || '-'}
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Status Approval</Form.Label>
                <Form.Select
                  value={selectedItem.approveStatus}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem,
                    approveStatus: e.target.value
                  })}
                >
                  <option value="disetujui">✓ Setujui</option>
                  <option value="ditolak">✗ Tolak</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  {selectedItem.approveStatus === 'disetujui' 
                    ? 'Jika disetujui, poin akan dipotong dari user' 
                    : 'Jika ditolak, wajib mengisi catatan'}
                </Form.Text>
              </Form.Group>

              {selectedItem.approveStatus === 'ditolak' && (
                <Form.Group className="mb-3">
                  <Form.Label>Catatan Penolakan <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={selectedItem.catatan}
                    onChange={(e) => setSelectedItem({
                      ...selectedItem,
                      catatan: e.target.value
                    })}
                    placeholder="Alasan penolakan..."
                  />
                </Form.Group>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Batal
          </Button>
          <Button 
            variant={selectedItem?.approveStatus === 'ditolak' ? 'danger' : 'success'} 
            onClick={handleApprove}
          >
            {selectedItem?.approveStatus === 'ditolak' ? 'Tolak' : 'Setujui'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default KlaimReward;