import { Card, Col, Row, Button, Form, Modal } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuthContext } from "@/context/useAuthContext.jsx";

/** Ambil token dari localStorage */
const token = localStorage.getItem("authToken");

/** Base URL langsung dari .env */
const baseURL = import.meta.env.VITE_API_BASE_URL;

/** axios instance langsung di file ini */
const axiosInstance = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

/** util: sel panjang dengan scroll horizontal */
const LongCell = ({ value, max = 320 }) => {
  if (!value) return <span>-</span>;
  return (
    <div
      className="overflow-auto text-nowrap"
      style={{
        maxWidth: max,
        overflowY: "hidden",
      }}
      title={value}
    >
      <code className="d-inline-block">{value}</code>
    </div>
  );
};

const columns = (handleEdit, handleDelete, hasPermission) => [
  {
    Header: "No",
    accessor: "no",
    sort: false,
    width: 70,
  },
  {
    Header: "Logo",
    accessor: "logo_url",
    Cell: ({ value }) =>
      value ? (
        <img src={value} alt="logo" width="40" height="40" className="rounded-circle" />
      ) : (
        <span className="text-muted">-</span>
      ),
    width: 80,
  },
  { Header: "Nama Holding", accessor: "name", sort: true },
  // { 
  //   Header: "Kategori", 
  //   accessor: "kategori", 
  //   sort: true,
  //   Cell: ({ value }) => {
  //     if (!value) return <span className="text-muted">-</span>;
      
  //     // Styling badge berdasarkan kategori
  //     const badgeClass = value === 'profit' 
  //       ? 'bg-success' 
  //       : 'bg-info';
      
  //     const label = value === 'profit' 
  //       ? 'Profit' 
  //       : 'Non Profit';
      
  //     return (
  //       <span className={`badge ${badgeClass} text-white`}>
  //         {label}
  //       </span>
  //     );
  //   }
  // },
  {
    Header: "Aksi",
    width: 90,
    Cell: ({ row }) => {
      // Cek permission
      const canUpdate = hasPermission("master-holding.update");
      const canDelete = hasPermission("master-holding.delete");
      
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

const Advanced = () => {
  const { hasPermission } = useAuthContext();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: "",
    api_key: "",
    token: "",
    logo_url: "",      
    logo_file: null,
    kategori: "profit"  // ⭐ TAMBAHKAN DENGAN DEFAULT VALUE
  });

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/holdings");
      const withNumber = res.data.map((item, index) => ({
        ...item,
        no: index + 1,
        kategori: item.kategori || "profit" // fallback kalau data lama
      }));
      setData(withNumber);
    } catch (err) {
      console.error("Error fetching holdings:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat data!",
        text: "Pastikan login berhasil atau periksa koneksi.",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("api_key", form.api_key);
      fd.append("token", form.token);
      fd.append("kategori", form.kategori); // ⭐ TAMBAHKAN KATEGORI

      if (form.logo_file) {
        fd.append("logo", form.logo_file);
      }

      if (form.id) {
        // UPDATE
        await axiosInstance.post(`/holdings/${form.id}?_method=PUT`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // CREATE
        await axiosInstance.post(`/holdings`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data berhasil disimpan.",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowModal(false);
      fetchData();
    } catch (e) {
      console.error("Error saving holding:", e);
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan!",
        text: "Periksa koneksi atau data input.",
      });
    }
  };

  const handleEdit = (row) => {
    setForm({
      id: row.id,
      name: row.name,
      api_key: row.api_key || "",
      token: row.token || "",
      logo_url: row.logo_url || "", 
      logo_file: null,
      kategori: row.kategori || "profit", // ⭐ TAMBAHKAN KATEGORI
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
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axiosInstance.delete(`/holdings/${id}`);
      fetchData();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data berhasil dihapus.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error("Error deleting holding:", e);
      Swal.fire({
        icon: "error",
        title: "Gagal menghapus!",
        text: "Terjadi kesalahan saat menghapus data.",
      });
    }
  };

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Holding CRUD", path: "/features/tables/advanced", active: true },
        ]}
        title={"Holding Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <h4 className="header-title">Holding Data</h4>
                {hasPermission("master-holding.create") && (
                  <Button
                    onClick={() => {
                      setForm({ 
                        id: null, 
                        name: "", 
                        api_key: "", 
                        token: "",
                        kategori: "profit" // ⭐ RESET DENGAN DEFAULT
                      });
                      setShowModal(true);
                    }}
                  >
                    + Tambah Holding
                  </Button>
                )}
              </div>

              <div className="table-responsive">
                <Table
                  keyField="no"
                  columns={columns(handleEdit, handleDelete, hasPermission)}
                  data={data}
                  pageSize={5}
                  sizePerPageList={[
                    { text: "5", value: 5 },
                    { text: "10", value: 10 },
                    { text: "25", value: 25 },
                    { text: "All", value: Math.max(data.length, 1) },
                  ]}
                  isSortable
                  pagination
                  isSearchable
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Form - TAMBAHKAN INPUT KATEGORI */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{form.id ? "Edit Holding" : "Tambah Holding"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Logo Holding</Form.Label>

              {form.logo_url && (
                <div className="mb-2">
                  <img
                    src={form.logo_url}
                    alt="Preview"
                    width="70"
                    height="70"
                    className="rounded-circle border"
                  />
                </div>
              )}

              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm({
                    ...form,
                    logo_file: e.target.files[0],
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nama Holding</Form.Label>
              <Form.Control
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </Form.Group>

            {/* ⭐ TAMBAHAN INPUT KATEGORI */}
            {/* <Form.Group className="mb-3">
              <Form.Label>
                Kategori Holding <span className="text-danger">*</span>
              </Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  id="profit"
                  label="Profit"
                  name="kategori"
                  value="profit"
                  checked={form.kategori === "profit"}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                />
                <Form.Check
                  inline
                  type="radio"
                  id="non_profit"
                  label="Non Profit"
                  name="kategori"
                  value="non_profit"
                  checked={form.kategori === "non_profit"}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                />
              </div>
            </Form.Group> */}

            {/* ⭐ TAMBAHKAN JUGA FIELD API_KEY DAN TOKEN KALAU DIPERLUKAN */}
            {/* <Form.Group className="mb-3">
              <Form.Label>API Key</Form.Label>
              <Form.Control
                type="text"
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              />
            </Form.Group> */}

            {/* <Form.Group className="mb-3">
              <Form.Label>Token</Form.Label>
              <Form.Control
                type="text"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
              />
            </Form.Group> */}
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