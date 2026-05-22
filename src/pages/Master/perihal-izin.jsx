import { useEffect, useState } from "react";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2"; // ⬅️ Import SweetAlert2

// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx";

// 🔹 Ambil base URL dari .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Advanced = () => {
  const { hasPermission } = useAuthContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    perhal: "",
    deskripsi: "",
    maksimal_izin_terlambat: "",
  });

  // 🔐 Ambil token dari localStorage
  const token = localStorage.getItem("authToken");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/perihal-izin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      const items = json.message || [];

      // 🟢 Tambahkan nomor urut global
      const rows = items.map((item, i) => ({
        no: i + 1,
        ...item,
      }));
      setData(rows);
    } catch (err) {
      console.error("Error fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const method = formData.id ? "PUT" : "POST";
      const url = formData.id
        ? `${API_BASE_URL}/perihal-izin/${formData.id}`
        : `${API_BASE_URL}/perihal-izin`;

      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Data berhasil ${formData.id ? "diupdate" : "ditambahkan"}!`,
        timer: 1500,
        showConfirmButton: false,
      });

      fetchData();
      setShowModal(false);
      setFormData({
        id: null,
        perhal: "",
        deskripsi: "",
        maksimal_izin_terlambat: "",
      });
    } catch (err) {
      console.error("Error save data:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat menyimpan data",
      });
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Apakah kamu yakin?",
      text: "Data akan terhapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`${API_BASE_URL}/perihal-izin/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Data berhasil dihapus!",
            timer: 1500,
            showConfirmButton: false,
          });

          fetchData();
        } catch (err) {
          console.error("Error delete data:", err);
          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: "Terjadi kesalahan saat menghapus data",
          });
        }
      }
    });
  };

  const columns = [
    { Header: "Nomor", accessor: "no", sort: false, width: 70 },
    { Header: "Perihal Izin", accessor: "perhal", sort: true },
    { Header: "Deskripsi", accessor: "deskripsi", sort: true },
    { Header: "Maksimal Izin Terlambat", accessor: "maksimal_izin_terlambat", sort: true },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        // Cek permission
        const canUpdate = hasPermission("master-perihal-izin.update");
        const canDelete = hasPermission("master-perihal-izin.delete");
        
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
                  setFormData(row.original);
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
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Search Table", path: "/features/tables/advanced", active: true },
        ]}
        title={"Perihal Izin Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
             <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Perihal Izin Data</h4>
                {hasPermission("master-perihal-izin.create") && ( // ← Tambahkan cek permission ini
                  <Button
                    variant="primary"
                    onClick={() => {
                      setFormData({
                        id: null,
                        perhal: "",
                        deskripsi: "",
                        maksimal_izin_terlambat: "",
                      });
                      setShowModal(true);
                    }}
                  >
                    <FaPlus /> Tambah Data
                  </Button>
                )}
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : (
                <Table
                  keyField="no"
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
          <Modal.Title>{formData.id ? "Edit Data" : "Tambah Data"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Perihal</Form.Label>
              <Form.Control
                type="text"
                name="perhal"
                value={formData.perhal}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Maksimal Izin Terlambat</Form.Label>
              <Form.Control
                type="time"
                name="maksimal_izin_terlambat"
                value={formData.maksimal_izin_terlambat}
                onChange={handleChange}
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
