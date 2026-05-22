import { useEffect, useState } from "react";
import { Card, Col, Row, Button, Modal, Form, Image } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { useNavigate } from "react-router-dom";


const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
const API = `${API_BASE}/izin`;
const API_PERIHAL = `${API_BASE}/perihal-izin`;
const API_USERS = `${API_BASE}/users`;

const MySwal = withReactContent(Swal);

const toImageUrl = (pathOrUrl) => {
  if (!pathOrUrl) return "";
  return /^https?:\/\//i.test(pathOrUrl)
    ? pathOrUrl
    : `${API_BASE.replace(/\/api$/, "")}/storage/${pathOrUrl}`;
};

const toInputDateTime = (val) => val || "";

// filter data berdasarkan role
const filterByLogin = (rows, currentUser) => {
  if (currentUser?.role?.name === "Superadmin" || currentUser?.role?.name === "Admin") return rows;

  if (currentUser?.role?.name === "Direktur") {
    // hanya data user yang seholding
    return rows.filter(
      (r) => r.user?.holding_id === currentUser.holding_id
    );
  }

  // user biasa hanya lihat data mereka sendiri
  return rows.filter((r) => String(r.user_id) === String(currentUser.id));
};

const Advanced = () => {
  const { user: currentUser, hasPermission } = useAuthContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Tambah Izin");
  const [currentData, setCurrentData] = useState({
    id: null,
    user_id: "",
    perihal_izin_id: "",
    bukti: "",
    status: "",
    catatan_penolakan: "",
    datetime: "",
    display_name: "",
  });

  const [buktiFile, setBuktiFile] = useState(null);
  const [buktiPreview, setBuktiPreview] = useState("");
  const [perihalList, setPerihalList] = useState([]);
  const [userList, setUserList] = useState([]);

  const showAlert = (icon, title, text) => {
    MySwal.fire({
      icon,
      title,
      text,
      showConfirmButton: false,
      timer: 2000,
      customClass: { popup: "swal2-uikit-style" },
    });
  };

  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const token = localStorage.getItem("authToken");
  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchData = () => {
    if (!currentUser) return;
    setLoading(true);
    axios
      .get(API, { headers: authHeader })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.message ?? [];
        setData(filterByLogin(rows, currentUser));
      })
      .catch((e) => {
        console.error(e);
        showAlert("error", "Gagal Memuat Data", "Terjadi kesalahan saat mengambil data izin.");
      })
      .finally(() => setLoading(false));
  };

  const fetchPerihal = () => {
    axios
      .get(API_PERIHAL, { headers: authHeader })
      .then((res) => {
        setPerihalList(Array.isArray(res.data) ? res.data : res.data?.message ?? []);
      })
      .catch((e) => console.error("FETCH PERIHAL ERROR", e));
  };

  const fetchUsers = () => {
    axios
      .get(API_USERS, { headers: authHeader })
      .then((res) => {
        let users = Array.isArray(res.data) ? res.data : [];
        if (currentUser.role?.name === "Direktur") {
          // hanya user seholding untuk direktur
          users = users.filter((u) => u.holding_id === currentUser.holding_id);
        }
        setUserList(users);
      })
      .catch((err) => console.error("FETCH USERS ERROR", err));
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      fetchPerihal();
      if (["Superadmin", "Admin", "Direktur"].includes(currentUser.role?.name)) {
        fetchUsers();
      }
    }
  }, [currentUser]);

  const resetForm = () => {
    if (!currentUser) return;
    setCurrentData({
      id: null,
      user_id:
        ["Superadmin", "Admin", "Direktur"].includes(currentUser.role?.name)
          ? ""
          : currentUser.id,
      perihal_izin_id: "",
      bukti: "",
      status: "belum approve",
      catatan_penolakan: "",
      datetime: "",
      display_name: currentUser.name,
    });
    setBuktiFile(null);
    setBuktiPreview("");
  };

   const handleAddIzin = () => {
      // Superadmin selalu bisa create izin tanpa batasan waktu
      if (currentUser?.role?.name === "Superadmin","Admin") {
        navigate("/izin/form");
        return;
      }

      const now = new Date();
      const hour = now.getHours();

      const jamBatasPagi = 7;   // 07:00
      const jamMulaiSore = 16;  // 16:00

      if (hour >= jamBatasPagi && hour < jamMulaiSore) {
        // Jam 07:00 - 15:59 → tidak bisa tambah izin untuk hari ini
        MySwal.fire({
          icon: "info",
          title: "Tidak Bisa Menambah Izin",
          text: "Izin hari ini sudah lewat jam 07:00. Silakan tambah izin untuk hari esok setelah jam 16:00.",
        });
      } else if (hour >= jamMulaiSore) {
        // Jam 16:00 - 23:59 → hanya bisa tambah izin untuk hari esok
        navigate("/izin/form?forTomorrow=true");
      } else {
        // Jam 00:00 - 06:59 → bisa tambah izin untuk hari ini atau hari esok
        navigate("/izin/form");
      }
    };

    const handleEdit = (row) => {
    if (!hasPermission("Izin.update")) { // ← Tambahkan cek permission
      return MySwal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Anda tidak memiliki izin untuk mengedit data izin",
      });
    }
    navigate(`/izin/edit/${row.id}`);
  };

  const handleDelete = (id) => {
    if (!hasPermission("Izin.delete")) { // ← Tambahkan cek permission
      return MySwal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Anda tidak memiliki izin untuk menghapus data izin",
      });
    }
    MySwal.fire({
      title: "Yakin?",
      text: "Data izin ini akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${API}/${id}`, { headers: authHeader })
          .then(() => {
            fetchData();
            showAlert("success", "Berhasil", "Data berhasil dihapus.");
          })
          .catch((err) => {
            console.error(err);
            showAlert("error", "Gagal", "Terjadi kesalahan saat menghapus data.");
          });
      }
    });
  };

  const handleBuktiChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setBuktiFile(file);
    setBuktiPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const form = new FormData();
    form.append("user_id", currentData.user_id || "");
    form.append("perihal_izin_id", currentData.perihal_izin_id || "");
    form.append("status", currentData.status ?? "belum approve");
    form.append("catatan_penolakan", currentData.catatan_penolakan ?? "");
    form.append("datetime", currentData.datetime ?? "");
    if (buktiFile) form.append("bukti", buktiFile);

    try {
      if (currentData.id) {
        form.append("_method", "PUT");
        await axios.post(`${API}/${currentData.id}`, form, {
          headers: { ...authHeader, "Content-Type": "multipart/form-data" },
        });
        showAlert("success", "Berhasil", "Data berhasil diubah!");
      } else {
        await axios.post(API, form, {
          headers: { ...authHeader, "Content-Type": "multipart/form-data" },
        });
        showAlert("success", "Berhasil", "Data berhasil ditambahkan!");
      }

      fetchData();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("SUBMIT ERROR", err);
      showAlert("error", "Gagal", "Terjadi kesalahan saat menyimpan data.");
    }
  };

  const handleApprove = async (id) => {
    const result = await MySwal.fire({
      title: "Approve Izin?",
      text: "Anda yakin ingin menyetujui izin ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Approve!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.patch(`${API}/${id}/approve`, {}, { headers: authHeader });
      fetchData();
      showAlert("success", "Berhasil", "Izin berhasil disetujui!");
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal", "Gagal menyetujui data.");
    }
  };

  const handleReject = async (id) => {
    const { value: reason } = await MySwal.fire({
      title: "Tolak Izin",
      input: "text",
      inputLabel: "Masukkan Catatan Penolakan:",
      inputPlaceholder: "Catatan penolakan...",
      showCancelButton: true,
      confirmButtonText: "Tolak",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (!value) return "Catatan penolakan tidak boleh kosong!";
      },
    });

    if (reason) {
      try {
        await axios.patch(
          `${API}/${id}/reject`,
          { catatan_penolakan: reason },
          { headers: authHeader }
        );
        fetchData();
        showAlert("success", "Berhasil", "Izin berhasil ditolak!");
      } catch (err) {
        console.error(err);
        showAlert("error", "Gagal", "Gagal menolak data.");
      }
    }
  };

  const columns = [
    { Header: "Nomor", accessor: (row, index) => index + 1, Cell: ({ row }) => row.index + 1 },
    { Header: "Name", accessor: (row) => row.user?.name || "-" },
    { 
      Header: "Perihal", 
      accessor: "perihal_izin.perhal",
      Cell: ({ row }) => {
        const perihal = row.original.perihal_izin?.perhal || "-";
        const terlambatSampai = row.original.terlambat_sampai;
        
        if (perihal === "Izin Terlambat" && terlambatSampai) {
          return (
            <div>
              <div>{perihal}</div>
              <small className="text-muted">Sampai: {terlambatSampai}</small>
            </div>
          );
        }
        return perihal;
      }
    },
    // ⬅️ KOLOM DETAIL DITAMBAHKAN DI SINI
    { 
      Header: "Detail", 
      accessor: "detail",
      Cell: ({ value }) => {
        if (!value) return <span className="text-muted">-</span>;
        return value.length > 50 ? value.substring(0, 50) + '...' : value;
      }
    },
    {
      Header: "Bukti",
      accessor: "bukti",
      Cell: ({ row }) => {
        const path = row.original.bukti;
        if (!path) return "-";
        const imgUrl = toImageUrl(path);
        return (
          <a href={imgUrl} target="_blank" rel="noreferrer">
            <img
              src={imgUrl}
              alt="bukti"
              style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }}
            />
          </a>
        );
      },
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: ({ row }) => {
        const status = row.original.status || "belum approve";
        if (status === "approve") return <span className="badge bg-success">✓ Approve</span>;
        if (status === "reject") return <span className="badge bg-danger">✗ Reject</span>;
        return <span className="badge bg-secondary">{status}</span>;
      },
    },
    { Header: "Catatan Penolakan", accessor: "catatan_penolakan" },
    { Header: "Date Time", accessor: "datetime", Cell: ({ row }) => formatDateTime(row.original.datetime) },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        const rowData = row.original;
        if (!currentUser) return null;
        const canEditDelete =
          ["Superadmin","Admin", "Direktur"].includes(currentUser.role?.name) ||
          String(rowData.user_id) === String(currentUser.id);

        if (!canEditDelete) return null;

        return (
          <div className="d-flex gap-2">
            <FaEdit className="text-warning" style={{ cursor: "pointer" }} onClick={() => handleEdit(rowData)} />
            <FaTrash className="text-danger" style={{ cursor: "pointer" }} onClick={() => handleDelete(rowData.id)} />
            {["Superadmin", "Admin","Direktur SDM"].includes(currentUser.role?.name) &&
                rowData.status !== "approve" &&
                rowData.status !== "reject" && (
                <>
                  <Button size="sm" variant="success" onClick={() => handleApprove(rowData.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(rowData.id)}>
                    Reject
                  </Button>
                </>
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
        title={"Izin Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Izin Data</h4>
                {hasPermission("Izin.create") && ( // ← Tambahkan cek permission ini
                  <Button variant="primary" onClick={handleAddIzin}>
                    <FaPlus className="me-1" /> Tambah Izin
                  </Button>
                )}
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : (
                <Table
                  columns={columns}
                  data={data}
                  pageSize={5}
                  sizePerPageList={sizePerPageList}
                  isSortable
                  pagination
                  isSearchable
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Form */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>User</Form.Label>
              {["Superadmin", "Admin", "Direktur"].includes(currentUser.role?.name) ? (
                <Form.Select
                  value={currentData.user_id}
                  onChange={(e) => setCurrentData({ ...currentData, user_id: e.target.value })}
                >
                  <option value="">-- Pilih User --</option>
                  {userList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Control type="text" value={currentData.display_name} disabled />
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Perihal</Form.Label>
              <Form.Select
                value={currentData.perihal_izin_id}
                onChange={(e) => setCurrentData({ ...currentData, perihal_izin_id: e.target.value })}
              >
                <option value="">-- Pilih Perihal --</option>
                {perihalList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.perhal}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bukti (Foto)</Form.Label>
             <Form.Control
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                capture="environment" // Buka kamera belakang
                onChange={handleBuktiChange}
              />
            {(buktiPreview || currentData.bukti) && (
              <div className="mt-2">
                {buktiPreview?.startsWith("blob:") ||
                /\.(jpg|jpeg|png|heic)$/i.test(currentData.bukti) ? (
                  <Image
                    src={buktiPreview || toImageUrl(currentData.bukti)}
                    alt="preview"
                    thumbnail
                    style={{ width: 160, height: 160, objectFit: "cover" }}
                  />
                ) : (
                  <a
                    href={buktiPreview || toImageUrl(currentData.bukti)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Lihat File
                  </a>
                )}
              </div>
            )}

            </Form.Group>

          {currentData.id && ["Superadmin", "Admin", "Direktur"].includes(currentUser.role?.name) && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={currentData.status || ""}
                    onChange={(e) =>
                      setCurrentData({ ...currentData, status: e.target.value })
                    }
                  >
                    <option value="">-- Pilih Status --</option>
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Catatan Penolakan</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentData.catatan_penolakan || ""}
                    onChange={(e) =>
                      setCurrentData({
                        ...currentData,
                        catatan_penolakan: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Date Time</Form.Label>
              <Form.Control
                type="date"
                value={currentData.datetime ? currentData.datetime.split("T")[0] : ""}
                onChange={(e) => {
                  const today = new Date();
                  const hours = String(today.getHours()).padStart(2, "0");
                  const minutes = String(today.getMinutes()).padStart(2, "0");
                  const combined = `${e.target.value}T${hours}:${minutes}`;
                  setCurrentData({ ...currentData, datetime: combined });
                }}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              Simpan
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default Advanced;