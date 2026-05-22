import React, { useEffect, useState } from "react";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import axios from "axios";
import { Dropdown } from "react-bootstrap";
import { FaEllipsisV } from "react-icons/fa";
import { useAuthContext } from "../../context/useAuthContext";

// Import SweetAlert2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";

const MySwal = withReactContent(Swal);

// 🔹 Ambil base URL dari environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- FUNGSI ALERT BARU (DI LUAR KOMPONEN JIKA BISA) ---
const showAlert = (icon, title, text) => {
  MySwal.fire({
    icon: icon, // 'success', 'error', 'warning', 'info', 'question'
    title: title,
    text: text, // Konten di bawah title
    showConfirmButton: false, // Hilangkan tombol OK
    timer: 2000, // Tahan selama 2 detik
  });
};
// -----------------------------------------------------

const Advanced = () => {
  const [data, setData] = useState([]);
  const [masterCutis, setMasterCutis] = useState([]); // 🔹 daftar cuti dari API
  const [loading, setLoading] = useState(true);
  const [showNotedModal, setShowNotedModal] = useState(false);
  const [currentRejectId, setCurrentRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Tambah Cuti");

  const { user, hasPermission } = useAuthContext();
  // Filter data sesuai role
  let filteredData = data;
  if (user && (user.role?.name === "User" || user.role?.name === "Direktur")) {
    filteredData = data.filter((item) => item.user_id === user.id);
  }

  const token = localStorage.getItem("authToken"); // ambil token
  const authHeader = { Authorization: `Bearer ${token}` };

  const [formData, setFormData] = useState({
    id: "",
    user_id: "",
    master_cutis_id: "",
    start_date: "",
    end_date: "",
    total_days: "",
    reason: "",
    status: "pending",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [cutiRes, masterRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/pengajuancuti`, { headers: authHeader }),
        axios.get(`${API_BASE_URL}/mastercuti`, { headers: authHeader }),
      ]);
      setData(cutiRes.data);
      setMasterCutis(masterRes.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      // Notifikasi gagal memuat data
      showAlert("error", "Gagal Memuat Data", "Terjadi kesalahan saat mengambil daftar cuti.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShowAdd = () => {
    setFormData({
      id: "",
      user_id: (user?.role?.name === "User" || user?.role?.name === "Direktur") ? user.id : "",
      master_cutis_id: "",
      start_date: "",
      end_date: "",
      total_days: "",
      reason: "",
      status: "pending",
      notes: "",
    });
    setModalTitle("Tambah Pengajuan Cuti");
    setShowModal(true);
  };

  const handleShowEdit = (item) => {
    setFormData({
      id: item.id,
      user_id: item.user_id,
      master_cutis_id: item.master_cutis_id,
      start_date: item.start_date,
      end_date: item.end_date,
      total_days: item.total_days,
      reason: item.reason,
      status: item.status,
      notes: item.notes || "",
    });
    setModalTitle("Edit Pengajuan Cuti");
    setShowModal(true);
  };

  // 🧮 Hitung otomatis total_days saat tanggal berubah
  const handleDateChange = (field, value) => {
    const newForm = { ...formData, [field]: value };

    if (newForm.start_date && newForm.end_date) {
      const start = new Date(newForm.start_date);
      const end = new Date(newForm.end_date);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 biar inclusive
      newForm.total_days = diffDays > 0 ? diffDays : 0;
    }

    setFormData(newForm);
  };

  // 1. MODIFIKASI handleStatusChange: Ganti window.confirm dengan Swal
  const handleStatusChange = async (id, status) => {
    if (status === "rejected") {
      setCurrentRejectId(id);
      setShowNotedModal(true);
      return;
    }

    const result = await MySwal.fire({
      title: 'Konfirmasi',
      text: `Yakin ingin mengubah status menjadi ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Ubah!',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(
        `${API_BASE_URL}/pengajuancuti/${id}/status`,
        { status },
        { headers: authHeader }
      );

      fetchData();
      // Notifikasi berhasil
      showAlert("success", "Berhasil", `Status berhasil diubah menjadi ${status}.`);
    } catch (error) {
      console.error("Gagal mengubah status:", error);
      // Notifikasi gagal
      showAlert("error", "Gagal", "Terjadi kesalahan saat mengubah status.");
    }
  };

  // 2. MODIFIKASI handleRejectSubmit: Ganti alert() dengan Swal
  const handleRejectSubmit = async () => {
    if (!rejectNote.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: 'Perhatian!',
        text: 'Harap isi alasan penolakan (noted).',
      });
      return;
    }

    try {
      const payload = {
        status: "rejected",
        notes: rejectNote,
        // approver_id: currentUserId, // uncomment kalau ada variable currentUserId
      };

      await axios.put(
        `${API_BASE_URL}/pengajuancuti/${currentRejectId}/status`,
        payload,
        { headers: authHeader }
      );

      setShowNotedModal(false);
      setRejectNote("");
      setCurrentRejectId(null);
      fetchData();
      // Notifikasi berhasil
      showAlert("success", "Berhasil", "Pengajuan berhasil ditolak dan catatan disimpan.");
    } catch (error) {
      console.error("Gagal mengubah status:", error);
      // Notifikasi gagal
      showAlert("error", "Gagal", "Terjadi kesalahan saat menolak pengajuan.");
    }
  };

  // 3. MODIFIKASI handleSave: Ganti alert() validasi dan sukses/gagal dengan Swal
  const handleSave = async () => {
    const selectedCuti = masterCutis.find((c) => c.id == formData.master_cutis_id);
    const maxDays = selectedCuti ? selectedCuti.max_days : 0;

    // 🚫 Validasi wajib isi
    if (!formData.user_id) {
      showAlert("warning", "Validasi", "Pilih nama karyawan terlebih dahulu!");
      return;
    }
    if (!formData.master_cutis_id) {
      showAlert("warning", "Validasi", "Pilih jenis cuti terlebih dahulu!");
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      showAlert("warning", "Validasi", "Isi tanggal mulai dan tanggal selesai!");
      return;
    }

    // 🚫 Validasi lama cuti tidak boleh melebihi batas
    if (maxDays && parseInt(formData.total_days) > maxDays) {
      showAlert("warning", "Validasi", `Maksimal ${maxDays} hari untuk jenis cuti ${selectedCuti.name}!`);
      return;
    }

    // 🔧 Pastikan semua numeric dikirim sebagai integer
    const payload = {
      ...formData,
      user_id: parseInt(formData.user_id),
      master_cutis_id: parseInt(formData.master_cutis_id),
      total_days: parseInt(formData.total_days),
    };

    try {
      if (formData.id) {
        // update
        await axios.put(
          `${API_BASE_URL}/pengajuancuti/${formData.id}`,
          payload,
          { headers: authHeader }
        );
        showAlert("success", "Berhasil", "Data cuti berhasil diubah!");
      } else {
        // create
        await axios.post(`${API_BASE_URL}/pengajuancuti`, payload, { headers: authHeader });
        showAlert("success", "Berhasil", "Pengajuan cuti berhasil dibuat!");
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Gagal menyimpan data:", error.response?.data || error);
      // Notifikasi gagal
      showAlert(
        "error",
        "Gagal",
        error.response?.data?.message || "Terjadi kesalahan pada server saat menyimpan data."
      );
    }
  };

  // 4. MODIFIKASI handleDelete: Ganti window.confirm dengan Swal
  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: 'Yakin Ingin Hapus?',
      text: "Pengajuan cuti ini akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_BASE_URL}/pengajuancuti/${id}`,
          { headers: authHeader }
        );
        fetchData();
        // Notifikasi berhasil
        showAlert("success", "Berhasil", "Pengajuan cuti berhasil dihapus.");
      } catch (error) {
        console.error("Gagal menghapus data:", error);
        // Notifikasi gagal
        showAlert("error", "Gagal", "Terjadi kesalahan saat menghapus data.");
      }
    }
  };

  const columns = [
    { Header: "Nomor", accessor: (_row, index) => index + 1, sort: false },
    { Header: "Nama", accessor: "user.name", sort: true },
    { Header: "Jenis Cuti", accessor: (row) => row.master_cuti?.name || "-", sort: true },
    { Header: "Mulai Tanggal", accessor: "start_date", sort: true },
    { Header: "Sampai Tanggal", accessor: "end_date", sort: true },
    { Header: "Total Hari", accessor: "total_days", sort: true },
    { Header: "Alasan", accessor: "reason", sort: true },
    {
      Header: "Status",
      accessor: "status",
      sort: true,
      Cell: ({ value: status }) => {
        if (status === "approved") {
          return <span className="badge bg-success">&#10003; Approve</span>;
        } else if (status === "rejected") {
          return <span className="badge bg-purple" style={{ backgroundColor: "#d22a2aff" }}>&#10005; Reject</span>;
        } else {
          return <span className="badge bg-secondary">Pending</span>;
        }
      },
    },
    { Header: "Noted", accessor: "notes", sort: true },
    { Header: "Approved at", accessor: "approved_at", sort: true },

   {
      Header: "Aksi",
      Cell: ({ row }) => {
        // Cek permission
        const canUpdate = hasPermission("Cuti.update");
        const canDelete = hasPermission("Cuti.delete");
        const canApprove = user?.role?.name === "Superadmin" || user?.role?.name === "Admin";
        
        // Jika tidak ada permission, tampilkan "-"
        if (!canUpdate && !canDelete && !canApprove) {
          return <span className="text-muted">-</span>;
        }
        
        return (
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="light"
              className="border-0 bg-transparent shadow-none p-0"
            >
              <FaEllipsisV />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {canUpdate && (
                <Dropdown.Item onClick={() => handleShowEdit(row.original)}>
                  Edit
                </Dropdown.Item>
              )}
              
              {canDelete && (
                <Dropdown.Item onClick={() => handleDelete(row.original.id)}>
                  Delete
                </Dropdown.Item>
              )}
              
              {(canUpdate || canDelete) && canApprove && <Dropdown.Divider />}
              
              {canApprove && (
                <>
                  <Dropdown.Item
                    onClick={() => handleStatusChange(row.original.id, "approved")}
                    className="text-success"
                  >
                    Approve
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleStatusChange(row.original.id, "rejected")}
                    className="text-danger"
                  >
                    Reject
                  </Dropdown.Item>
                </>
              )}
            </Dropdown.Menu>
          </Dropdown>
        );
      },
    },
  ];
  
  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "All", value: data.length },
  ];

  // 💡 Variabel bantu untuk menonaktifkan input tanggal
  const isApproved = formData.id && formData.status === "approved";

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Cuti", path: "/cuti/pengajuan-cuti" },
          { label: "Pengajuan Cuti", path: "/cuti/pengajuan-cuti", active: true },
        ]}
        title={"Pengajuan Cuti"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
             <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title mb-0">Daftar Pengajuan Cuti</h4>
                {hasPermission("Cuti.create") && ( // ← Tambahkan cek permission ini
                  <Button variant="primary" onClick={handleShowAdd}>
                    <FaPlus className="me-2" /> Buat Cuti
                  </Button>
                )}
              </div>


              {loading ? (
                <p>Memuat data...</p>
              ) : (
                <Table
                  columns={columns}
                  data={filteredData}
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

      {/* 🔹 Modal Form Tambah/Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Nama</Form.Label>
              {(user?.role?.name === "User" || user?.role?.name === "Direktur") ? (
                // Untuk User & Direktur: tampilkan nama sendiri (readonly)
                <Form.Control
                  type="text"
                  value={user.name}
                  readOnly
                  disabled
                />
              ) : (
                // Untuk role lain: bisa pilih nama
                <Form.Select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                >
                  <option value="">-- Pilih Nama --</option>
                  {data.map((item) => (
                    <option key={item.user.id} value={item.user.id}>
                      {item.user.name}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Jenis Cuti</Form.Label>
              <Form.Select
                value={formData.master_cutis_id}
                onChange={(e) => setFormData({ ...formData, master_cutis_id: e.target.value })}
                disabled={isApproved} // 💡 Nonaktifkan jika sudah approved
              >
                <option value="">-- Pilih Jenis Cuti --</option>
                {masterCutis.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (max {item.max_days} hari)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Mulai Tanggal</Form.Label>
              <Form.Control
                type="date"
                value={formData.start_date}
                onChange={(e) => handleDateChange("start_date", e.target.value)}
                // 💡 Modifikasi di sini: disabled jika sudah approved
                disabled={isApproved} 
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Sampai Tanggal</Form.Label>
              <Form.Control
                type="date"
                value={formData.end_date}
                onChange={(e) => handleDateChange("end_date", e.target.value)}
                // 💡 Modifikasi di sini: disabled jika sudah approved
                disabled={isApproved}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Total Hari</Form.Label>
              <Form.Control 
                type="number" 
                value={formData.total_days} 
                readOnly 
                disabled={isApproved} // 💡 Nonaktifkan jika sudah approved (sebagai tambahan)
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Alasan (opsional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.reason || ""}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                disabled={isApproved} // 💡 Nonaktifkan jika sudah approved
              />      
            </Form.Group>

            {/* Catatan Penolakan, hanya terlihat saat rejected dan oleh Superadmin (Logika ini sudah benar) */}
           {formData.status === "rejected" &&
              (user?.role?.name === "Superadmin" || user?.role?.name === "Admin") && (
                <Form.Group className="mb-2">
                  <Form.Label>Catatan Penolakan</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Tuliskan alasan penolakan di sini..."
                  />
                </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isApproved}>
            {/* 💡 Nonaktifkan tombol simpan juga jika sudah approved dan user bukan admin/superadmin yang mungkin hanya ingin melihat */}
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🔹 Modal Noted saat Reject (Tidak ada perubahan, karena ini hanya untuk proses reject) */}
      <Modal show={showNotedModal} onHide={() => setShowNotedModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Alasan Penolakan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Tulis alasan penolakan:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Contoh: Dokumen tidak lengkap atau tanggal tidak sesuai..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotedModal(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleRejectSubmit}>
            Kirim Penolakan
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Advanced;