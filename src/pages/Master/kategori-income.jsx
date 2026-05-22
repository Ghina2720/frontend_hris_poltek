import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Card, Col, Row, Button, Modal, Form, Alert } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";

// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx"; 

// 🔹 Base API dari .env
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, ""),
});

// 🔹 Tambahkan interceptor untuk token Sanctum
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

const IncomeCategoryModal = ({ show, handleClose, onSubmit, category, mode, loading }) => {
  const [formData, setFormData] = useState({ name: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (category && mode === "edit") {
      setFormData({ name: category.name });
    } else {
      setFormData({ name: '' });
    }
    setErrors({});
  }, [category, mode, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'edit' ? 'Edit Kategori Income' : 'Tambah Kategori Income'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {errors.general && (
            <Alert variant="danger">{errors.general}</Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Nama Kategori <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukkan nama kategori"
              isInvalid={!!errors.name}
              required
              autoFocus
            />
            <Form.Control.Feedback type="invalid">
              {errors.name}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const Advanced = () => {
  const { hasPermission } = useAuthContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ===== Fetch Data =====
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: payload } = await api.get("/income-categories");

      const rows = Array.isArray(payload)
        ? payload
        : payload?.message ?? [];

      setData(rows.map((r, i) => ({ no: i + 1, ...r })));
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== Open Modal =====
  const openCreate = () => {
    setModalMode("create");
    setSelectedCategory(null);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setModalMode("edit");
    setSelectedCategory(row);
    setShowModal(true);
  };

  // ===== Handle Save (Create/Update) =====
  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setErr(null);

      if (!formData.name.trim()) {
        Swal.fire("Peringatan", "Nama kategori wajib diisi!", "warning");
        return;
      }

      if (modalMode === "create") {
        await api.post("/income-categories", formData);
        Swal.fire("Berhasil", "Kategori income berhasil ditambahkan!", "success");
      } else {
        await api.put(`/income-categories/${selectedCategory.id}`, formData);
        Swal.fire("Berhasil", "Kategori income berhasil diupdate!", "success");
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      if (error.response?.data?.errors) {
        Swal.fire("Error", Object.values(error.response.data.errors).join(', '), "error");
      } else {
        Swal.fire("Error", error.response?.data?.message || "Terjadi kesalahan", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // ===== Handle Delete =====
  const handleDelete = async (row) => {
    Swal.fire({
      title: "Yakin hapus?",
      text: `Kategori "${row.name}" tidak dapat dikembalikan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await api.delete(`/income-categories/${row.id}`);
        Swal.fire("Terhapus!", "Kategori berhasil dihapus.", "success");
        fetchData();
      } catch (e) {
        Swal.fire("Gagal", e?.response?.data?.message || "Gagal menghapus data", "error");
      }
    });
  };

  // ===== Columns =====
  const columns = useMemo(
    () => [
      { 
        Header: "No", 
        accessor: (r) => r.no, 
        sort: false 
      },
      { 
        Header: "Nama Kategori", 
        accessor: (r) => r.name, 
        sort: true 
      },
      {
        Header: "Aksi",
        Cell: ({ row }) => {
          // Cek permission
          const canUpdate = hasPermission("master-income-category.update");
          const canDelete = hasPermission("master-income-category.delete");
          
          // Jika tidak ada permission, tampilkan "-"
          if (!canUpdate && !canDelete) {
            return <span className="text-muted">-</span>;
          }
          
          return (
            <div className="d-flex gap-2">
              {canUpdate && (
                <FaEdit
                  className="text-warning"
                  style={{ cursor: "pointer" }}
                  onClick={() => openEdit(row.original)}
                  title="Edit"
                />
              )}
              {canDelete && (
                <FaTrash
                  className="text-danger"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleDelete(row.original)}
                  title="Hapus"
                />
              )}
            </div>
          );
        },
      },
    ],
    [hasPermission]
  );

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "All", value: data.length },
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Master", path: "/features/tables/advanced" },
          { label: "Kategori Income", path: "/features/tables/advanced", active: true },
        ]}
        title={"Kategori Income"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title mb-0">Kategori Income</h4>
                {hasPermission("master-income-category.create") && (
                  <Button variant="primary" onClick={openCreate}>
                    <FaPlus className="me-1" /> Tambah
                  </Button>
                )}
              </div>

              {err && !showModal && (
                <Alert variant="danger" onClose={() => setErr(null)} dismissible>
                  {err}
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">Belum ada data kategori income</p>
                  {hasPermission("master-income-category.create") && (
                    <Button variant="primary" onClick={openCreate}>
                      <FaPlus className="me-1" /> Tambah Kategori Pertama
                    </Button>
                  )}
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={data}
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

      {/* Modal Create/Edit */}
      <IncomeCategoryModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        category={selectedCategory}
        mode={modalMode}
        loading={saving}
      />
    </>
  );
};

export default Advanced;