import { useEffect, useState } from "react";
import axios from "axios";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";
import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const KpiGlobalTemplate = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [jabatanDetails, setJabatanDetails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    jabatan_detail_id: "",
    periode_start: "",
    periode_end: "",
    persentase_total: 100,
    kategori_holding: ""
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("authToken");

  const axiosAuth = axios.create({
    baseURL: baseUrl,
    headers: { Authorization: `Bearer ${token}` }
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth.get("/kpi/global-templates");
      const rows = (res.data?.data || []).map((item, i) => ({
        no: i + 1,
        ...item,
        jabatan_name: item.jabatan_detail?.nama_jabatan || "N/A",
        periode: `${item.periode_start} s/d ${item.periode_end}`
      }));
      setData(rows);
    } catch (e) {
      Swal.fire("Error", "Gagal load data template", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadJabatanDetails = async () => {
    const res = await axiosAuth.get("/jabatan-details");
    setJabatanDetails(res.data || []);
  };

  useEffect(() => {
    loadData();
    loadJabatanDetails();
  }, []);

  const handleSave = async () => {
    try {
      if (editId) {
        await axiosAuth.put(`/kpi/global-templates/${editId}`, form);
      } else {
        await axiosAuth.post("/kpi/global-templates", form);
      }
      Swal.fire("Berhasil", "Template disimpan", "success");
      loadData();
      setShowModal(false);
    } catch (e) {
      Swal.fire("Error", "Cek kembali inputan (kombinasi periode mungkin duplikat)", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: 'Apakah anda yakin?',
        text: "Menghapus template ini akan menghapus semua indikator di dalamnya!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
        try {
        await axiosAuth.delete(`/kpi/global-templates/${id}`);
        Swal.fire('Terhapus!', 'Template berhasil dihapus.', 'success');
        loadData(); // Reload tabel
        } catch (e) {
        Swal.fire('Error', 'Gagal menghapus data', 'error');
        }
    }
  };

  const columns = [
    { Header: "No", accessor: "no" },
    { Header: "Jabatan Detail", accessor: "jabatan_name" },
    { Header: "Periode", accessor: "periode" },
    { Header: "Target %", accessor: "persentase_total" },
    {
      Header: "Aksi",
      Cell: ({ row }) => (
        <div className="d-flex gap-2">
          <Button 
            variant="info" 
            size="sm" 
            title="Atur Indikator"
            onClick={() => navigate(`/master/kpi-global-templates/detail/${row.original.id}`)}
            >
            <FaEye />
          </Button>
          <Button variant="warning" size="sm" onClick={() => {
            setEditId(row.original.id);
            setForm(row.original);
            setShowModal(true);
          }}><FaEdit /></Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row.original.id)}><FaTrash /></Button>
        </div>
      )
    }
  ];

  return (
    <>
      <PageTitle title="Master KPI Global Template" breadCrumbItems={[{ label: "KPI", active: true }]} />
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Button className="mb-3" onClick={() => { setEditId(null); setShowModal(true); }}>
                <FaPlus /> Tambah Template
              </Button>
              <Table columns={columns} data={data} loading={loading} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>{editId ? 'Edit' : 'Tambah'} Template KPI</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Jabatan Detail</Form.Label>
            <Form.Select value={form.jabatan_detail_id} onChange={e => setForm({...form, jabatan_detail_id: e.target.value})}>
              <option value="">Pilih Jabatan</option>
              {jabatanDetails.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Periode Mulai</Form.Label>
            <Form.Control type="date" value={form.periode_start} onChange={e => setForm({...form, periode_start: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Periode Selesai</Form.Label>
            <Form.Control type="date" value={form.periode_end} onChange={e => setForm({...form, periode_end: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Total Bobot (%)</Form.Label>
            <Form.Control type="number" value={form.persentase_total} onChange={e => setForm({...form, persentase_total: e.target.value})} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSave}>Simpan Template</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default KpiGlobalTemplate;