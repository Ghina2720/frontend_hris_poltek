import { useEffect, useState } from "react";
import axios from "axios";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx";

// 🔹 Import SweetAlert2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const Advanced = () => {
  const { hasPermission } = useAuthContext(); 
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ 
    nama_jabatan: "", 
    nominal_denda: "",
    skor: "" // 🔹 Field skor opsional
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // 🔹 Base URL (sudah termasuk /api)
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // 🔹 Ambil token dari localStorage
  const token = localStorage.getItem("authToken");

  // 🔹 Axios instance dengan auth
  const axiosAuth = axios.create({
    baseURL: baseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  // 🔹 Load Data
  const loadData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await axiosAuth.get("/jabatans");
      const d = res.data;

      const items = Array.isArray(d)
        ? d
        : Array.isArray(d?.data)
        ? d.data
        : Array.isArray(d?.message)
        ? d.message
        : [];

      const rows = items.map((item, i) => ({
        no: i + 1,
        ...item,
      }));

      setData(rows);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Columns
  const columns = [
    { Header: "Nomor", accessor: "no", sort: false, width: 70 },
    { Header: "Nama Jabatan", accessor: "nama_jabatan", sort: true },
    // { Header: "Nominal Denda", accessor: "nominal_denda", sort: true },
    // { 
    //   Header: "Skor", 
    //   accessor: "skor", 
    //   sort: true,
    //   Cell: ({ value }) => value ?? 0 // Tampilkan 0 jika null/undefined
    // },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        // Cek permission
        const canUpdate = hasPermission("master-jabatans.update");
        const canDelete = hasPermission("master-jabatans.delete");
        
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
    { text: "All", value: data.length || 5 },
  ];

  // 🔹 Modal control
  const handleShow = () => setShowModal(true);
  const handleClose = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ 
      nama_jabatan: "", 
      nominal_denda: "",
      skor: "" 
    });
  };

  // 🔹 Save (Tambah / Edit) - SKOR BOLEH KOSONG
  const handleSave = async () => {
    if (!form.nama_jabatan) {
      MySwal.fire({
        icon: "warning",
        title: "Nama jabatan wajib diisi!",
      });
      return;
    }

    // 🔹 Validasi skor: boleh kosong, tapi jika diisi harus angka non-negatif
    if (form.skor !== "" && form.skor !== null && parseInt(form.skor) < 0) {
      MySwal.fire({
        icon: "warning",
        title: "Skor tidak boleh negatif!",
      });
      return;
    }

    // 🔹 Siapkan data untuk dikirim (jika skor kosong, kirim null atau hapus field)
    const dataToSend = {
      nama_jabatan: form.nama_jabatan,
      nominal_denda: form.nominal_denda || null,
      skor: form.skor === "" ? null : form.skor // Jika kosong, kirim null
    };

    try {
      if (editId) {
        await axiosAuth.put(`/jabatans/${editId}`, dataToSend);

        MySwal.fire({
          icon: "success",
          title: "Berhasil diperbarui!",
          text: "Data jabatan berhasil diupdate.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await axiosAuth.post("/jabatans", dataToSend);

        MySwal.fire({
          icon: "success",
          title: "Berhasil ditambahkan!",
          text: "Data jabatan berhasil disimpan.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      await loadData();
      handleClose();
    } catch (e) {
      console.error(e);
      MySwal.fire({
        icon: "error",
        title: "Gagal menyimpan!",
        text: e?.response?.data?.message || e.message,
      });
    }
  };

  // 🔹 Edit - UPDATED dengan field skor
  const handleEdit = (jabatan) => {
    setEditId(jabatan.id);
    setForm({
      nama_jabatan: jabatan.nama_jabatan,
      nominal_denda: jabatan.nominal_denda || "",
      skor: jabatan.skor !== null ? jabatan.skor : "", // Jika null, tampilkan kosong
    });
    setShowModal(true);
  };

  // 🔹 Hapus (SweetAlert Confirm)
  const handleDelete = async (id) => {
    const confirm = await MySwal.fire({
      title: "Hapus Jabatan?",
      text: "Data yang dihapus tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axiosAuth.delete(`/jabatans/${id}`);

      MySwal.fire({
        icon: "success",
        title: "Berhasil dihapus!",
        timer: 1300,
        showConfirmButton: false,
      });

      loadData();
    } catch (e) {
      console.error(e);
      MySwal.fire({
        icon: "error",
        title: "Gagal menghapus!",
        text: e?.response?.data?.message || e.message,
      });
    }
  };

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Jabatan Table", path: "/features/tables/advanced", active: true },
        ]}
        title={"Jabatan Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Jabatan Data</h4>
                {hasPermission("master-jabatans.create") && (
                  <Button variant="primary" onClick={handleShow}>
                    <FaPlus className="me-2" />
                    Tambah Jabatan
                  </Button>
                )}
              </div>

              {err && <div className="alert alert-danger">{err}</div>}

              <Table
                keyField="no"
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

      {/* Modal Tambah / Edit */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{editId ? "Edit Jabatan" : "Tambah Jabatan"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Jabatan <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={form.nama_jabatan}
                onChange={(e) => setForm({ ...form, nama_jabatan: e.target.value })}
                placeholder="Masukkan nama jabatan"
              />
            </Form.Group>

            {/* 🔹 INPUT SKOR (OPSIONAL) */}
            {/* <Form.Group className="mb-3">
              <Form.Label>
                Skor Jabatan <span className="text-muted">(Opsional)</span>
              </Form.Label>
              <Form.Control
                type="number"
                value={form.skor}
                onChange={(e) => setForm({ ...form, skor: e.target.value })}
                min="0"
                placeholder="Masukkan skor jabatan (opsional)"
              />
              <Form.Text className="text-muted">
                Skor awal yang akan diberikan kepada talent setiap tahunnya. Biarkan kosong jika tidak ingin diisi.
              </Form.Text>
            </Form.Group> */}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
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