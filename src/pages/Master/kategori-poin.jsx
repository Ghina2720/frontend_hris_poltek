import { Card, Col, Row, Button, Modal, Form, Badge } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
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

// Helper untuk eksekusi
const EksekusiBadge = ({ value }) => {
  if (value === 'plus') {
    return <span className="text-success fw-bold">(+Plus)</span>;
  } else if (value === 'minus') {
    return <span className="text-danger fw-bold">(-Minus)</span>;
  }
  return <span className="text-muted">-</span>;
};

// Helper untuk kode
const CodeBadge = ({ value }) => {
  return <span className="fw-bold">{value}</span>;
};

// Helper untuk poin
const PoinBadge = ({ value }) => {
  return <span className="fw-bold">{value || 0} Poin</span>;
};

const Advanced = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "KT",
    detail: "",
    eksekusi: "plus",
    poin: "",
    approval_step: "1",
    approval_1: "",
    approval_2: "",
    approval_3: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/category-poin");
      const items = res.data.data || [];
      const withNumber = items.map((item, index) => ({
        ...item,
        no: index + 1
      }));
      setData(withNumber);
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

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await axiosInstance.get("/roles");
      let rolesData = [];
      if (res.data?.message && Array.isArray(res.data.message)) {
        rolesData = res.data.message;
      } else if (Array.isArray(res.data)) {
        rolesData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        rolesData = res.data.data;
      }
      setRoles(rolesData);
    } catch (err) {
      console.error("Error fetching roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  // ✅ Validasi approval roles (tanpa validasi duplikat)
  const validateApprovalRoles = () => {
    const step = parseInt(form.approval_step);
    
    // Step 0: tanpa approval
    if (step === 0) {
      return null;
    }
    
    // Validasi step 1-3 wajib diisi
    if (step >= 1 && !form.approval_1) {
      return "Approval Step 1 wajib diisi";
    }
    if (step >= 2 && !form.approval_2) {
      return "Approval Step 2 wajib diisi";
    }
    if (step >= 3 && !form.approval_3) {
      return "Approval Step 3 wajib diisi";
    }
    
    // ✅ Validasi role exists di sistem
    const rolesToCheck = [];
    if (step >= 1 && form.approval_1) rolesToCheck.push(form.approval_1);
    if (step >= 2 && form.approval_2) rolesToCheck.push(form.approval_2);
    if (step >= 3 && form.approval_3) rolesToCheck.push(form.approval_3);
    
    const roleNames = roles.map(r => r.name);
    const invalidRoles = rolesToCheck.filter(role => !roleNames.includes(role));
    
    if (invalidRoles.length > 0) {
      return `Role "${invalidRoles.join(', ')}" tidak ditemukan di sistem`;
    }
    
    return null;
  };

  const handleSave = async () => {
    // Validasi nama
    if (!form.name) {
      Swal.fire({ icon: "warning", title: "Validasi", text: "Nama kategori wajib diisi" });
      return;
    }
    
    // Validasi poin
    const poinValue = parseInt(form.poin);
    if (isNaN(poinValue) || poinValue < 0) {
      Swal.fire({ 
        icon: "warning", 
        title: "Validasi", 
        text: "Nilai poin wajib diisi dengan angka yang valid dan tidak boleh negatif" 
      });
      return;
    }
    
    // ✅ Validasi approval roles
    const roleError = validateApprovalRoles();
    if (roleError) {
      Swal.fire({ icon: "warning", title: "Validasi", text: roleError });
      return;
    }

    try {
      if (editId) {
        await axiosInstance.put(`/category-poin/${editId}`, form);
      } else {
        await axiosInstance.post("/category-poin", form);
      }
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Data berhasil ${editId ? "diupdate" : "disimpan"}.`,
        timer: 1500,
        showConfirmButton: false
      });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error saving data:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan!",
        text: err?.response?.data?.message || err.message
      });
    }
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setForm({
      name: row.name || "",
      code: row.code || "KT",
      detail: row.detail || "",
      eksekusi: row.eksekusi || "plus",
      poin: row.poin || "",
      approval_step: row.approval_step?.toString() || "1",
      approval_1: row.approval_1 || "",
      approval_2: row.approval_2 || "",
      approval_3: row.approval_3 || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
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
      await axiosInstance.delete(`/category-poin/${id}`);
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

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      code: "KT",
      detail: "",
      eksekusi: "plus",
      poin: "",
      approval_step: "1",
      approval_1: "",
      approval_2: "",
      approval_3: ""
    });
  };

  // Columns
  const columns = [
    { Header: "No", accessor: "no", width: 60 },
    { Header: "Nama", accessor: "name" },
    { 
      Header: "Kode", 
      accessor: "code", 
      width: 80,
      Cell: ({ value }) => <CodeBadge value={value} />
    },
    { 
      Header: "Poin", 
      accessor: "poin", 
      width: 100,
      Cell: ({ value }) => <PoinBadge value={value || 0} />
    },
    { Header: "Detail", accessor: "detail" },
    { 
      Header: "Eksekusi", 
      accessor: "eksekusi", 
      width: 100,
      Cell: ({ value }) => <EksekusiBadge value={value} />
    },
    { Header: "Step", accessor: "approval_step", width: 70 },
    {
      Header: "Aksi",
      width: 100,
      Cell: ({ row }) => (
        <div className="d-flex gap-2">
          <FaEdit
            className="text-primary"
            style={{ cursor: "pointer" }}
            onClick={() => handleEdit(row.original)}
            title="Edit"
          />
          <FaTrash
            className="text-danger"
            style={{ cursor: "pointer" }}
            onClick={() => handleDelete(row.original.id)}
            title="Hapus"
          />
        </div>
      ),
    },
  ];

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "All", value: data.length || 5 },
  ];

  const codeOptions = [
    { value: "SJT", label: "SJT - Skor Jabatan Talent" },
    { value: "KT", label: "KT - Kinerja Talent" },
    { value: "IKT", label: "IKT - Inovasi Kinerja Talent" },
    { value: "PKT", label: "PKT - Penambahan Kompetensi Talent" },
    { value: "KTT", label: "KTT - Kekaryaan Tambahan Talent" },
    { value: "APS", label: "APS - Akumulasi Pengurangan Skor" }
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Master", path: "/master" },
          { label: "Kategori Poin", path: "/master/kategori-poin", active: true }
        ]}
        title={"Kategori Poin"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Kategori Poin</h4>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <FaPlus className="me-1" />
                  Tambah
                </Button>
              </div>

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

      {/* Modal Form */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="h5">
            {editId ? "Edit Kategori Poin" : "Tambah Kategori Poin"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Nama Kategori</Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nama kategori"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Kode</Form.Label>
                  <Form.Select
                    size="sm"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  >
                    {codeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Detail</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                size="sm"
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                placeholder="Detail kategori..."
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Eksekusi</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      id="plus"
                      label="Plus"
                      name="eksekusi"
                      value="plus"
                      size="sm"
                      checked={form.eksekusi === "plus"}
                      onChange={(e) => setForm({ ...form, eksekusi: e.target.value })}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      id="minus"
                      label="Minus"
                      name="eksekusi"
                      value="minus"
                      size="sm"
                      checked={form.eksekusi === "minus"}
                      onChange={(e) => setForm({ ...form, eksekusi: e.target.value })}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Nilai Poin</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    size="sm"
                    value={form.poin}
                    onChange={(e) => setForm({ ...form, poin: e.target.value })}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Approval Step</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="3"
                    size="sm"
                    value={form.approval_step}
                    onChange={(e) => {
                      const newStep = e.target.value;
                      setForm({ ...form, approval_step: newStep });
                      // Reset approval roles jika step dikurangi
                      if (parseInt(newStep) < 2) setForm(prev => ({ ...prev, approval_2: "" }));
                      if (parseInt(newStep) < 3) setForm(prev => ({ ...prev, approval_3: "" }));
                    }}
                    placeholder="1"
                  />
                  <Form.Text className="text-muted">
                    {form.approval_step === "0" 
                      ? "0 = Tanpa approval (langsung diterima)" 
                      : `${form.approval_step} step approval`}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-2 small fw-bold">Role Approver</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">
                    Step 1 
                    {form.approval_step !== "0" && <span className="text-danger ms-1">*</span>}
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    value={form.approval_1}
                    onChange={(e) => setForm({ ...form, approval_1: e.target.value })}
                    disabled={loadingRoles}
                    required={form.approval_step !== "0"}
                  >
                    <option value="">Pilih Role</option>
                    {!loadingRoles && roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              {form.approval_step >= "2" && (
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small">Step 2 <span className="text-danger ms-1">*</span></Form.Label>
                    <Form.Select
                      size="sm"
                      value={form.approval_2}
                      onChange={(e) => setForm({ ...form, approval_2: e.target.value })}
                      disabled={loadingRoles}
                    >
                      <option value="">Pilih Role</option>
                      {!loadingRoles && roles.map(role => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              
              {form.approval_step >= "3" && (
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small">Step 3 <span className="text-danger ms-1">*</span></Form.Label>
                    <Form.Select
                      size="sm"
                      value={form.approval_3}
                      onChange={(e) => setForm({ ...form, approval_3: e.target.value })}
                      disabled={loadingRoles}
                    >
                      <option value="">Pilih Role</option>
                      {!loadingRoles && roles.map(role => (
                        <option key={role.id} value={role.name}>{role.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>
            
            {/* Preview Flow Approval */}
            {form.approval_step !== "0" && (form.approval_1 || form.approval_2 || form.approval_3) && (
              <div className="mt-3 p-2 bg-light rounded small">
                <strong className="small">Preview Flow Approval:</strong>
                <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
                  <Badge bg="secondary">Pengajuan</Badge>
                  <span>→</span>
                  {form.approval_step >= "1" && form.approval_1 && (
                    <>
                      <Badge bg="primary">Step 1: {form.approval_1}</Badge>
                      {form.approval_step >= "2" && <span>→</span>}
                    </>
                  )}
                  {form.approval_step >= "2" && form.approval_2 && (
                    <>
                      <Badge bg="primary">Step 2: {form.approval_2}</Badge>
                      {form.approval_step >= "3" && <span>→</span>}
                    </>
                  )}
                  {form.approval_step >= "3" && form.approval_3 && (
                    <Badge bg="primary">Step 3: {form.approval_3}</Badge>
                  )}
                  <span>→</span>
                  <Badge bg="success">Selesai</Badge>
                </div>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Advanced;