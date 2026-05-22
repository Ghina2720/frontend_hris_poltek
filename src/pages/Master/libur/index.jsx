import { useEffect, useState } from "react";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useAuthContext } from "@/context/useAuthContext.jsx";

// components
import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";

const MySwal = withReactContent(Swal);

// 🔧 Ambil base URL langsung dari .env
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const sizePerPageList = [
  { text: "5", value: 5 },
  { text: "10", value: 10 },
  { text: "25", value: 25 },
];

const Advanced = () => {
  const { hasPermission } = useAuthContext();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: null, nama_libur: "", tanggal_libur: "" });
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("authToken");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchData = () => {
    setLoading(true);
    axios
      .get(`${API_BASE}/libur`, axiosConfig)
      .then((res) => {
        if (res.data.success) {
          const mapped = res.data.message.map((item, index) => ({
            ...item,
            nomor: index + 1,
          }));
          setData(mapped);
        }
      })
      .catch((err) => {
        console.error("Error fetching libur:", err);
        MySwal.fire("Error", "Gagal memuat data libur!", "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    axios
      .post(`${API_BASE}/libur/generate-minggu`, {}, axiosConfig)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        console.error("Error generate libur Minggu:", err);
        MySwal.fire("Error", "Gagal generate libur Minggu!", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.nama_libur.trim() || !form.tanggal_libur.trim()) {
      return MySwal.fire("Peringatan", "Semua field wajib diisi!", "warning");
    }

    try {
      setLoading(true);

      if (isEdit) {
        await axios.put(
          `${API_BASE}/libur/${form.id}`,
          {
            nama_libur: form.nama_libur,
            tanggal_libur: form.tanggal_libur,
          },
          axiosConfig
        );

        MySwal.fire("Berhasil", "Data libur berhasil diperbarui!", "success");
      } else {
        await axios.post(
          `${API_BASE}/libur`,
          {
            nama_libur: form.nama_libur,
            tanggal_libur: form.tanggal_libur,
          },
          axiosConfig
        );

        MySwal.fire("Berhasil", "Data libur berhasil ditambahkan!", "success");
      }

      setShowModal(false);
      setForm({ id: null, nama_libur: "", tanggal_libur: "" });
      fetchData();
    } catch (error) {
      console.error("Error saving data:", error);
      MySwal.fire("Error", "Gagal menyimpan data!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await MySwal.fire({
      title: "Yakin ingin menghapus?",
      text: "Data yang dihapus tidak dapat dipulihkan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      await axios.delete(`${API_BASE}/libur/${id}`, axiosConfig);

      MySwal.fire("Berhasil", "Data berhasil dihapus!", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting data:", error);
      MySwal.fire("Error", "Gagal menghapus data!", "error");
    } finally {
      setLoading(false);
    }
  };

  const bulanNama = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const sekarang = new Date();
  const namaBulan = bulanNama[sekarang.getMonth()];

  const columns = [
    { Header: "Nomor", accessor: "nomor", sort: true },
    { Header: "Nama Libur", accessor: "nama_libur", sort: true },
    { Header: "Tanggal", accessor: "tanggal_libur", sort: true },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        // Cek permission
        const canUpdate = hasPermission("master-libur.update");
        const canDelete = hasPermission("master-libur.delete");
        
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
                onClick={() => {
                  setIsEdit(true);
                  setForm({
                    id: row.original.id,
                    nama_libur: row.original.nama_libur,
                    tanggal_libur: row.original.tanggal_libur,
                  });
                  setShowModal(true);
                }}
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

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Search Table", path: "/features/tables/advanced", active: true },
        ]}
        title={"Data Libur"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Data Libur {namaBulan}</h4>
                {hasPermission("master-libur.create") && ( // ← Tambahkan cek permission ini
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsEdit(false);
                      setForm({ id: null, nama_libur: "", tanggal_libur: "" });
                      setShowModal(true);
                    }}
                  >
                    <FaPlus /> Tambah Libur
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2">Loading data...</p>
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

      {/* Modal Form */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? "Edit Libur" : "Tambah Libur"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Libur</Form.Label>
              <Form.Control
                type="text"
                value={form.nama_libur}
                onChange={(e) => setForm({ ...form, nama_libur: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tanggal Libur</Form.Label>
              <Form.Control
                type="date"
                value={form.tanggal_libur}
                onChange={(e) => setForm({ ...form, tanggal_libur: e.target.value })}
              />
            </Form.Group>
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

export default Advanced;
