import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Card, Col, Row, Button, Modal, Form, Table as BsTable, Badge, Alert 
} from "react-bootstrap";  // ← Alert sudah ditambahkan
import { FaEdit, FaTrash, FaCalendarAlt, FaPlus } from "react-icons/fa";
import { useAuthContext } from "@/context/useAuthContext.jsx";

import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";

const Advanced = () => {
  const { hasPermission } = useAuthContext(); 
  
  // State untuk Rules Utama
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    id: null,
    rules_name: "",
    jam_masuk: "",
    jam_telat: "",
    jam_pulang: "",
  });

  // State untuk Periode Khusus
  const [periodeData, setPeriodeData] = useState([]);
  const [showPeriodeModal, setShowPeriodeModal] = useState(false);
  const [periodeForm, setPeriodeForm] = useState({
    id: null,
    nama_periode: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    jam_masuk: "",
    jam_telat: "",
    jam_pulang: "",
    keterangan: ""
  });

  const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
  const token = localStorage.getItem("authToken");

  const api = axios.create({
    baseURL,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      Accept: "application/json",
    },
    withCredentials: true,
  });

  // Fetch Rules Utama
  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/rules-absen");
      const items = Array.isArray(res.data?.message) ? res.data.message : [];
      const rows = items.map((r, i) => ({
        no: i + 1,
        id: r.id,
        rules_name: r.rules_name,
        jam_masuk: r.jam_masuk,
        jam_telat: r.jam_telat,
        jam_pulang: r.jam_pulang,
      }));
      setData(rows);
    } catch (e) {
      if (e.response?.status === 401) {
        setErr("🔒 Sesi login Anda sudah berakhir. Silakan login kembali.");
      } else {
        setErr(e.message || "Gagal memuat data.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Periode Khusus
  const fetchPeriodeData = async () => {
    try {
      const res = await api.get("/rules-absen-periode");
      setPeriodeData(res.data.data || []);
    } catch (e) {
      console.error("Gagal fetch periode:", e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPeriodeData();
  }, []);

  // CRUD Rules Utama
  const handleSave = async () => {
    try {
      if (form.id) {
        await api.put(`/rules-absen/${form.id}`, form);
      } else {
        await api.post("/rules-absen", form);
      }
      fetchData();
      setShowModal(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Gagal menyimpan data");
    }
  };

  // CRUD Periode Khusus
  const handleSavePeriode = async () => {
    try {
      if (periodeForm.id) {
        await api.put(`/rules-absen-periode/${periodeForm.id}`, periodeForm);
      } else {
        await api.post("/rules-absen-periode", periodeForm);
      }
      fetchPeriodeData();
      setShowPeriodeModal(false);
      resetPeriodeForm();
    } catch (e) {
      alert(e?.response?.data?.message || "Gagal menyimpan periode");
    }
  };

  const handleEditPeriode = (row) => {
    setPeriodeForm(row);
    setShowPeriodeModal(true);
  };

  const handleDeletePeriode = async (id) => {
    if (!window.confirm("Yakin hapus periode ini?")) return;
    try {
      await api.delete(`/rules-absen-periode/${id}`);
      fetchPeriodeData();
    } catch (e) {
      alert(e?.response?.data?.message || "Gagal menghapus periode");
    }
  };

  const resetPeriodeForm = () => {
    setPeriodeForm({
      id: null,
      nama_periode: "",
      tanggal_mulai: "",
      tanggal_selesai: "",
      jam_masuk: "",
      jam_telat: "",
      jam_pulang: "",
      keterangan: ""
    });
  };

  const handleEdit = (row) => {
    setForm(row);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus data ini?")) return;
    try {
      await api.delete(`/rules-absen/${id}`);
      fetchData();
    } catch (e) {
      alert(e?.response?.data?.message || "Gagal menghapus data");
    }
  };

  // Kolom untuk Rules Utama
  const columns = [
    { Header: "No", accessor: "no", sort: false, width: 70 },
    { Header: "Rules Name", accessor: "rules_name", sort: true },
    { Header: "Jam Masuk", accessor: "jam_masuk", sort: true },
    { Header: "Jam Telat", accessor: "jam_telat", sort: true },
    { Header: "Jam Pulang", accessor: "jam_pulang", sort: true },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        const canUpdate = hasPermission("master-aturan-absen.update");
        const canDelete = hasPermission("master-aturan-absen.delete");
        
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

  // Kolom untuk Periode Khusus
  // Kolom untuk Periode Khusus
const periodeColumns = [
  { Header: "Periode", accessor: "nama_periode" },
  { 
    Header: "Tanggal", 
    accessor: "tanggal",
    Cell: ({ row }) => {
      // Ambil tanggal mentah dari database
      const mulai = row.original.tanggal_mulai;
      const selesai = row.original.tanggal_selesai;
      
      // Log untuk debug
      console.log("Tanggal mentah:", { mulai, selesai });
      
      // Pastikan formatnya bersih
      const tanggalMulai = mulai ? mulai.split('T')[0] : '';
      const tanggalSelesai = selesai ? selesai.split('T')[0] : '';
      
      return (
        <span>
          {tanggalMulai} s/d {tanggalSelesai}
        </span>
      );
    }
  },
  { Header: "Jam Masuk", accessor: "jam_masuk" },
  { Header: "Jam Telat", accessor: "jam_telat" },
  { Header: "Jam Pulang", accessor: "jam_pulang" },
  {
    Header: "Status",
    accessor: "status",
    Cell: () => <Badge bg="success">Aktif</Badge>
  },
  {
    Header: "Aksi",
    Cell: ({ row }) => (
      <div className="d-flex gap-2">
        <FaEdit
          className="text-warning"
          style={{ cursor: "pointer" }}
          onClick={() => handleEditPeriode(row.original)}
          title="Edit"
        />
        <FaTrash
          className="text-danger"
          style={{ cursor: "pointer" }}
          onClick={() => handleDeletePeriode(row.original.id)}
          title="Hapus"
        />
      </div>
    )
  }
];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Rules Absen", path: "/features/tables/advanced", active: true },
        ]}
        title={"Rules Absen & Periode Khusus"}
      />

      <Row>
        <Col>
          {/* Card untuk Rules Utama */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <h4 className="header-title">Aturan Default</h4>
                {hasPermission("master-aturan-absen.create") && (
                  <Button
                    onClick={() => {
                      if (data.length >= 1) {
                        alert("⚠️ Hanya boleh ada satu aturan default. Silakan edit data yang sudah ada.");
                        return;
                      }
                      setForm({
                        id: null,
                        rules_name: "",
                        jam_masuk: "",
                        jam_telat: "",
                        jam_pulang: "",
                      });
                      setShowModal(true);
                    }}
                  >
                    + Tambah Rules Default
                  </Button>
                )}
              </div>

              {err && <div className="alert alert-danger">{err}</div>}

              <Table
                keyField="no"
                columns={columns}
                data={data}
                pageSize={5}
                sizePerPageList={[
                  { text: "5", value: 5 },
                  { text: "10", value: 10 },
                  { text: "25", value: 25 },
                  { text: "All", value: data.length || 5 },
                ]}
                isSortable={true}
                pagination={true}
                isSearchable={true}
                loading={loading}
              />
            </Card.Body>
          </Card>

        
          {/* Card untuk Periode Khusus */}
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3 align-items-center">
                <div>
                  <h4 className="header-title mb-0">
                    <FaCalendarAlt className="me-2 text-primary" />
                    Periode Khusus Event(Ramadhan, Libur Nasional, dll)
                  </h4>
                </div>
                {hasPermission("master-aturan-absen.create") && (
                  <Button
                    variant="success"
                    onClick={() => {
                      resetPeriodeForm();
                      setShowPeriodeModal(true);
                    }}
                  >
                    <FaPlus className="me-2" />
                    Tambah Periode
                  </Button>
                )}
              </div>

              {/* Menggunakan komponen Table yang sama dengan Rules Utama */}
              <Table
                keyField="id"
                columns={periodeColumns}
                data={periodeData}
                pageSize={5}
                sizePerPageList={[
                  { text: "5", value: 5 },
                  { text: "10", value: 10 },
                  { text: "All", value: periodeData.length || 5 },
                ]}
                isSortable={true}
                pagination={true}
                isSearchable={true}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Rules Utama */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{form.id ? "Edit Rules Default" : "Tambah Rules Default"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Rules Name</Form.Label>
              <Form.Control
                type="text"
                value={form.rules_name}
                onChange={(e) => setForm({ ...form, rules_name: e.target.value })}
                placeholder="Contoh: Aturan Normal"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Jam Masuk</Form.Label>
              <Form.Control
                type="time"
                value={form.jam_masuk}
                onChange={(e) => setForm({ ...form, jam_masuk: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Jam Telat</Form.Label>
              <Form.Control
                type="time"
                value={form.jam_telat}
                onChange={(e) => setForm({ ...form, jam_telat: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Jam Pulang</Form.Label>
              <Form.Control
                type="time"
                value={form.jam_pulang}
                onChange={(e) => setForm({ ...form, jam_pulang: e.target.value })}
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

      {/* Modal Periode Khusus */}
      <Modal show={showPeriodeModal} onHide={() => setShowPeriodeModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCalendarAlt className="me-2" />
            {periodeForm.id ? "Edit Periode Khusus" : "Tambah Periode Khusus"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Periode <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={periodeForm.nama_periode}
                onChange={(e) => setPeriodeForm({ ...periodeForm, nama_periode: e.target.value })}
                placeholder="Contoh: Ramadhan 2026"
                required
              />
              <Form.Text className="text-muted">
                Beri nama yang mudah diingat, misal "Ramadhan 2026" atau "Libur Lebaran"
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal Mulai <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={periodeForm.tanggal_mulai}
                    onChange={(e) => setPeriodeForm({ ...periodeForm, tanggal_mulai: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal Selesai <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={periodeForm.tanggal_selesai}
                    onChange={(e) => setPeriodeForm({ ...periodeForm, tanggal_selesai: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Jam Masuk</Form.Label>
                  <Form.Control
                    type="time"
                    value={periodeForm.jam_masuk}
                    onChange={(e) => setPeriodeForm({ ...periodeForm, jam_masuk: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Jam Telat</Form.Label>
                  <Form.Control
                    type="time"
                    value={periodeForm.jam_telat}
                    onChange={(e) => setPeriodeForm({ ...periodeForm, jam_telat: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Jam Pulang</Form.Label>
                  <Form.Control
                    type="time"
                    value={periodeForm.jam_pulang}
                    onChange={(e) => setPeriodeForm({ ...periodeForm, jam_pulang: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Keterangan (Opsional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={periodeForm.keterangan}
                onChange={(e) => setPeriodeForm({ ...periodeForm, keterangan: e.target.value })}
                placeholder="Contoh: Selama Ramadhan, jam masuk diundur menjadi 08:00"
              />
            </Form.Group>

            <Alert variant="info">
              <strong>Catatan:</strong> Periode khusus akan otomatis menggantikan aturan default 
              untuk tanggal-tanggal yang masuk dalam rentang ini. Di luar rentang, aturan default akan berlaku.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPeriodeModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSavePeriode}>
            Simpan Periode
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Advanced;