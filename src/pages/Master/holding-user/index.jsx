import { useState, useEffect } from "react";
import axios from "axios";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

// components
import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";

// kolom tabel
const columnsDef = (handleEdit, handleDelete) => [
  { Header: "No", accessor: "no", sort: false },
  {
  Header: "Holding",
  accessor: row => row.holding ? row.holding.name : "-",
  sort: true,
},
  { Header: "Holding User Name", accessor: "holding_name", sort: true },
  {
    Header: "Aksi",
    Cell: ({ row }) => (
      <div className="d-flex gap-2">
        <FaEdit
          className="text-warning"
          style={{ cursor: "pointer" }}
          onClick={() => handleEdit(row.original)}
        />
        <FaTrash
          className="text-danger"
          style={{ cursor: "pointer" }}
          onClick={() => handleDelete(row.original.id)}
        />
      </div>
    ),
  },
];

const sizePerPageList = [
  { text: "5", value: 5 },
  { text: "10", value: 10 },
  { text: "25", value: 25 },
];

const Advanced = () => {
  const [data, setData] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: "", holding_id: "", holding_name: "" });
  const [isEdit, setIsEdit] = useState(false);

  const base = import.meta.env.VITE_API_BASE_URL;
  const api = axios.create({ baseURL: base.replace(/\/+$/, "") });

  // ambil data holdings dulu
  const fetchHoldings = async () => {
    try {
      const res = await api.get("/holdings");
      const holdingData = Array.isArray(res.data) ? res.data : [];
      setHoldings(holdingData);
      return holdingData;
    } catch (err) {
      console.error("Gagal fetch holdings:", err);
      setHoldings([]);
      return [];
    }
  };


  // ambil data holding-users dan gabungkan dengan nama holding
  const fetchData = async () => {
    setLoading(true);
    try {
      const holdingData = holdings.length ? holdings : await fetchHoldings();
      const res = await api.get("/holding-users");
      const users = Array.isArray(res.data.message) ? res.data.message : [];

      const merged = users.map((u, i) => ({
        no: i + 1,
        ...u,
        holding_name_display: holdingData.find(h => h.id === u.holding_id)?.name || "-", // tampilkan nama holding
      }));

      setData(merged);
    } catch (err) {
      console.error("Gagal fetch data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setIsEdit(false);
    setFormData({ id: "", holding_id: "", holding_name: "" });
    setShowModal(true);
  };

  const handleEdit = (row) => {
    setIsEdit(true);
    setFormData({
      id: row.id,
      holding_id: row.holding_id,
      holding_name: row.holding_name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await api.delete(`/holding-users/${id}`);
      fetchData();
      alert("Data berhasil dihapus");
    } catch (err) {
      console.error("Gagal hapus data:", err);
      alert("Gagal hapus data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/holding-users/${formData.id}`, formData);
        alert("Data berhasil diperbarui");
      } else {
        await api.post("/holding-users", formData);
        alert("Data berhasil ditambahkan");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Gagal simpan data:", err);
      alert("Gagal simpan data");
    }
  };

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Holding User", path: "/features/tables/advanced", active: true },
        ]}
        title={"Holding User CRUD"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Holding User Data</h4>
                <Button onClick={handleCreate}>
                  <FaPlus /> Tambah
                </Button>
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : (
                <Table
                  columns={columnsDef(handleEdit, handleDelete)}
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

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? "Edit Data" : "Tambah Data"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Holding</Form.Label>
              <Form.Select
                value={formData.holding_id}
                onChange={(e) =>
                  setFormData({ ...formData, holding_id: e.target.value })
                }
                required
              >
                <option value="">-- Pilih Holding --</option>
                {holdings.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Holding User Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.holding_name}
                onChange={(e) =>
                  setFormData({ ...formData, holding_name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              {isEdit ? "Update" : "Simpan"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Advanced;
