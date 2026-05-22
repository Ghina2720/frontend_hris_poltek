import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";

import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";
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
});

// 🔹 Currency formatter
const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));

const Advanced = () => {
  const { hasPermission } = useAuthContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Modal state
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, nama: "", gaji: "" });

  // ===== Fetch =====
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: payload } = await api.get("/status-talent");

      const rows = Array.isArray(payload)
        ? payload
        : payload?.message ?? [];

      setData(rows.map((r, i) => ({ no: i + 1, ...r })));
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
      Swal.fire("Error", err, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== Modal =====
  const openCreate = () => {
    setMode("create");
    setForm({ id: null, nama: "", gaji: "" });
    setShow(true);
  };

  const openEdit = (row) => {
    setMode("edit");
    setForm({ id: row.id, nama: row.nama, gaji: String(row.gaji) });
    setShow(true);
  };

  // ===== Save (Create / Update) =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nama.trim()) {
      return Swal.fire("Peringatan", "Nama wajib diisi!", "warning");
    }
    if (isNaN(Number(form.gaji))) {
      return Swal.fire("Peringatan", "Gaji harus berupa angka", "warning");
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/status-talent", {
          nama: form.nama.trim(),
          gaji: Number(form.gaji),
        });

        Swal.fire("Berhasil", "Status talent berhasil ditambahkan!", "success");
      } else {
        await api.put(`/status-talent/${form.id}`, {
          nama: form.nama.trim(),
          gaji: Number(form.gaji),
        });

        Swal.fire("Berhasil", "Status talent berhasil diupdate!", "success");
      }

      setShow(false);
      fetchData();
    } catch (e) {
      Swal.fire("Gagal", e?.response?.data?.message || "Gagal menyimpan data", "error");
    } finally {
      setSaving(false);
    }
  };

  // ===== Delete =====
  const handleDelete = async (row) => {
    Swal.fire({
      title: "Yakin hapus?",
      text: `Data "${row.nama}" tidak dapat dikembalikan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await api.delete(`/status-talent/${row.id}`);
        Swal.fire("Terhapus!", "Data berhasil dihapus.", "success");
        fetchData();
      } catch (e) {
        Swal.fire("Gagal", e?.response?.data?.message || "Gagal menghapus data", "error");
      }
    });
  };

  // ===== Columns =====
  const columns = useMemo(
    () => [
      { Header: "No", accessor: (r) => r.no, sort: false },
      { Header: "Nama", accessor: (r) => r.nama, sort: true },
      {
        Header: "Gaji",
        accessor: (r) => r.gaji,
        sort: true,
        Cell: ({ value }) => rupiah(value),
      },
      {
        Header: "Aksi",
        Cell: ({ row }) => {
          // Cek permission
          const canUpdate = hasPermission("master-status-talent.update");
          const canDelete = hasPermission("master-status-talent.delete");
          
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
    []
  );

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Status Talent", path: "/features/tables/advanced", active: true },
        ]}
        title="Status Talent Table"
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <h4>Status Talent</h4>
                {hasPermission("master-status-talent.create") && ( 
                <Button onClick={openCreate}>
                  <FaPlus className="me-2" /> Tambah
                </Button>
                )}
              </div>

              {loading && <div>Loading...</div>}
              {err && <div className="text-danger">{err}</div>}

              {!loading && !err && (
                <Table
                  keyField="no"
                  columns={columns}
                  data={data}
                  pageSize={10}
                  isSortable
                  pagination
                  isSearchable
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal */}
      <Modal show={show} onHide={() => setShow(false)}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {mode === "create" ? "Tambah Status Talent" : "Edit Status Talent"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama</Form.Label>
              <Form.Control
                type="text"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                autoFocus
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Gaji</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={form.gaji}
                onChange={(e) => setForm((f) => ({ ...f, gaji: e.target.value }))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShow(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default Advanced;
