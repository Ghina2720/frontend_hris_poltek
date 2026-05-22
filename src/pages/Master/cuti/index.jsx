import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Col,
  Row,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";

// components
import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx"; 

// 🔹 API BASE
const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
const API_URL = `${API_BASE}/mastercuti`;

const Advanced = () => {
  const { hasPermission } = useAuthContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    max_days: "",
    count_holiday: "no",
  });

  const [saving, setSaving] = useState(false);

  // 🔹 AMBIL TOKEN dari localStorage
  const token = localStorage.getItem("authToken");

  // 🔹 FETCH DATA (GET)
  const fetchData = () => {
    setLoading(true);

    axios
      .get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat data dari server.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 SIMPAN DATA (POST / PUT)
  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = { ...formData };

    const request = editData
      ? axios.put(`${API_URL}/${editData.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      : axios.post(API_URL, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

    request
      .then((res) => {
        const newItem = res.data.data;

        if (editData) {
          setData((prev) =>
            prev.map((item) => (item.id === editData.id ? newItem : item))
          );
          Swal.fire({
            icon: "success",
            title: "Berhasil Diperbarui!",
            text: "Data cuti berhasil diperbarui.",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          setData((prev) => [newItem, ...prev]);
          Swal.fire({
            icon: "success",
            title: "Berhasil Disimpan!",
            text: "Data cuti baru berhasil ditambahkan.",
            timer: 1500,
            showConfirmButton: false,
          });
        }

        setShowModal(false);
        setEditData(null);
      })
      .catch((err) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan!",
          text: "Terjadi kesalahan saat menyimpan data.",
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // 🔹 DELETE DATA
  const handleDelete = (id) => {
    Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Data yang sudah dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(() => {
            setData((prev) => prev.filter((item) => item.id !== id));
            Swal.fire({
              icon: "success",
              title: "Berhasil Dihapus!",
              text: "Data cuti berhasil dihapus.",
              timer: 1500,
              showConfirmButton: false,
            });
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              title: "Gagal Menghapus!",
              text: "Terjadi kesalahan saat menghapus data.",
            });
          });
      }
    });
  };

  // 🔹 BUKA MODAL EDIT
  const handleEdit = (item) => {
    setEditData(item);
    setFormData({
      name: item.name,
      description: item.description,
      max_days: item.max_days,
      count_holiday: item.count_holiday,
    });
    setShowModal(true);
  };

  // 🔹 TABEL
  const columns = [
    {
      Header: "No",
      Cell: ({ row }) => row.index + 1,
      sort: false,
    },
    { Header: "Nama Cuti", accessor: "name", sort: true },
    { Header: "Deskripsi", accessor: "description", sort: true },
    { Header: "Maksimal Hari", accessor: "max_days", sort: true },
    {
      Header: "Count Holiday",
      accessor: "count_holiday",
      Cell: ({ value }) => (value === "yes" ? "Yes" : "No"),
      sort: true,
    },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        // Cek permission
        const canUpdate = hasPermission("master-cuti.update");
        const canDelete = hasPermission("master-cuti.delete");
        
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
                onClick={() => handleEdit(row.original)}
                title="Edit"
              />
            )}
            {canDelete && (
              <FaTrash
                className="text-danger"
                style={{ cursor: "pointer" }}
                onClick={() => handleDelete(row.original.id)}
                title="Hapus"
              />
            )}
          </div>
        );
      },
    },
  ];

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Master Cuti", path: "/features/tables/advanced", active: true },
        ]}
        title={"Master Cuti"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title mb-0">Data Master Cuti</h4>
                {hasPermission("master-cuti.create") && ( 
                <Button
                  onClick={() => {
                    setShowModal(true);
                    setEditData(null);
                    setFormData({
                      name: "",
                      description: "",
                      max_days: "",
                      count_holiday: "no",
                    });
                  }}
                >
                  <FaPlus className="me-1" /> Tambah Cuti
                </Button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
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

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editData ? "Edit Master Cuti" : "Tambah Master Cuti"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama Cuti</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Maksimal Hari</Form.Label>
              <Form.Control
                type="number"
                value={formData.max_days}
                onChange={(e) =>
                  setFormData({ ...formData, max_days: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Count Holiday</Form.Label>
              <Form.Select
                value={formData.count_holiday}
                onChange={(e) =>
                  setFormData({ ...formData, count_holiday: e.target.value })
                }
              >
                <option value="no">No (Hari Minggu tidak dihitung)</option>
                <option value="yes">Yes (Hari Minggu dihitung)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default Advanced;
