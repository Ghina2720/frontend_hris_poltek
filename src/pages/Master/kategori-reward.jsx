import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
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

// Helper untuk badge kode
const CodeBadge = ({ value }) => {
  const colors = {
    'RPDN': 'success',
    'RPLN': 'primary'
  };
  
  const color = colors[value] || 'secondary';
  return <span className={`badge bg-${color} text-white`}>{value}</span>;
};

// Helper untuk format poin
const PoinFormat = ({ value }) => {
  return <span className="fw-bold text-primary">{value} Poin</span>;
};

const CategoryReward = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    kode: "RPDN",
    poin: ""
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/category-reward");
      
      // Ambil array dari res.data.data
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

  useEffect(() => {
    fetchData();
  }, []);

  // Handle save
  const handleSave = async () => {
    // Validasi
    if (!form.kode) {
      Swal.fire({
        icon: "warning",
        title: "Validasi",
        text: "Kode reward wajib dipilih"
      });
      return;
    }

    if (!form.poin || form.poin < 0) {
      Swal.fire({
        icon: "warning",
        title: "Validasi",
        text: "Poin wajib diisi dan tidak boleh negatif"
      });
      return;
    }

    try {
      if (editId) {
        await axiosInstance.put(`/category-reward/${editId}`, form);
      } else {
        await axiosInstance.post("/category-reward", form);
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

  // Handle edit
  const handleEdit = (row) => {
    setEditId(row.id);
    setForm({
      name: row.name || "",
      kode: row.kode || "RPDN",
      poin: row.poin || ""
    });
    setShowModal(true);
  };

  // Handle delete
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
      await axiosInstance.delete(`/category-reward/${id}`);
      
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

  // Reset form
  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      kode: "RPDN",
      poin: ""
    });
  };

  // Columns definition
  const columns = [
    { 
      Header: "No", 
      accessor: "no", 
      sort: true,
      width: 70 
    },
    { 
      Header: "Nama", 
      accessor: "name", 
      sort: true,
      Cell: ({ value }) => value || <span className="text-muted">-</span>
    },
    { 
      Header: "Kode", 
      accessor: "kode", 
      sort: true,
      Cell: ({ value }) => <CodeBadge value={value} />
    },
    { 
      Header: "Poin", 
      accessor: "poin", 
      sort: true,
      Cell: ({ value }) => <PoinFormat value={value} />
    },
    {
      Header: "Aksi",
      width: 100,
      Cell: ({ row }) => (
        <div className="d-flex gap-2">
          <FaEdit
            className="text-warning"
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

  // Options untuk dropdown kode
  const kodeOptions = [
    { value: "RPDN", label: "RPDN - Reward Perjalanan Dalam Negeri" },
    { value: "RPLN", label: "RPLN - Reward Perjalanan Luar Negeri" }
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Master", path: "/master" },
          { label: "Kategori Reward", path: "/master/kategori-reward", active: true }
        ]}
        title={"Kategori Reward"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Data Kategori Reward</h4>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <FaPlus className="me-2" />
                  Tambah Kategori
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
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editId ? "Edit Kategori Reward" : "Tambah Kategori Reward"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Reward</Form.Label>
              <Form.Control
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Masukkan nama reward (opsional)"
              />
              {/* <Form.Text className="text-muted">
                Kosongkan jika ingin menggunakan nama default sesuai kode
              </Form.Text> */}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kode <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={form.kode}
                onChange={(e) => setForm({ ...form, kode: e.target.value })}
              >
                {kodeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Poin <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="1"
                value={form.poin}
                onChange={(e) => setForm({ ...form, poin: e.target.value })}
                placeholder="Masukkan jumlah poin"
              />
              <Form.Text className="text-muted">
                Jumlah poin yang dibutuhkan untuk reward ini
              </Form.Text>
            </Form.Group>

            <div className="alert alert-info mt-3">
              <small>
                <strong>Informasi:</strong><br/>
                • RPDN: Reward Perjalanan Dalam Negeri (default 100 poin)<br/>
                • RPLN: Reward Perjalanan Luar Negeri (default 200 poin)
              </small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CategoryReward;