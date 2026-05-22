import { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Image,
  Button,
  Spinner,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { FaEdit } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import PageTitle from "../../components/PageTitle";

// Gunakan API_BASE dari .env
const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

// Fungsi untuk menghindari error loop gambar
const handleImageError = (e, fallback = "/logo-poltek-panjang.png") => {
  e.target.onerror = null;
  e.target.src = fallback;
};

const CompanySettings = () => {
  const [company, setCompany] = useState({
    nama_perusahaan: "Perusahaan Contoh",
    alamat_perusahaan: "Jl. Contoh No. 123, Cirebon",
    logo_perusahaan: "default-logo.png",
    logo_kecil: "default-logo-small.png",
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nama_perusahaan: "",
    alamat_perusahaan: "",
    logo_perusahaan: null,
    logo_kecil: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 🔧 Buat instance axios dengan token
  const token = localStorage.getItem("authToken");
  const api = axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Ambil data dari API
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await api.get("/setting"); // gunakan instance axios dengan token
        const data = response.data.message[0];
        if (data) setCompany(data);
      } catch (err) {
        console.error("Gagal mengambil data perusahaan:", err);
        setError("Tidak dapat memuat data perusahaan dari server.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, []);

  // Handle perubahan form
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo_perusahaan" || name === "logo_kecil") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Buka modal edit
  const handleEdit = () => {
    if (company) {
      setFormData({
        nama_perusahaan: company.nama_perusahaan || "",
        alamat_perusahaan: company.alamat_perusahaan || "",
        logo_perusahaan: null,
        logo_kecil: null,
      });
    }
    setShowModal(true);
  };

  // Simpan perubahan (update ke API)
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData();
    form.append("nama_perusahaan", formData.nama_perusahaan);
    form.append("alamat_perusahaan", formData.alamat_perusahaan);
    if (formData.logo_perusahaan) {
      form.append("logo_perusahaan", formData.logo_perusahaan);
    }
    if (formData.logo_kecil) {
      form.append("logo_kecil", formData.logo_kecil);
    }

    try {
      await api.post(`/setting/update/${company.id}`, form, {
        headers: { "Content-Type": "multipart/form-data" }, // tetap pakai multipart
      });

      // Refresh data
      const res = await api.get("/setting"); // pakai instance axios
      setCompany(res.data.message[0]);
      setShowModal(false);

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data perusahaan berhasil diperbarui.",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error("Gagal memperbarui data perusahaan:", err);
      setError("Terjadi kesalahan saat menyimpan data.");

      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Terjadi kesalahan saat menyimpan data perusahaan.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle title={"Setting Perusahaan"} />

      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title mb-0">Profil Perusahaan</h4>
                <Button variant="warning" size="sm" onClick={handleEdit}>
                  <FaEdit className="me-1" /> Edit
                </Button>
              </div>

              <hr />

              {error && <Alert variant="danger">{error}</Alert>}

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 mb-0">Memuat data perusahaan...</p>
                </div>
              ) : company ? (
                <>
                  <div className="text-center mb-4">
                    <Image
                      src={`${API_BASE.replace("/api", "/storage")}/${company.logo_perusahaan}`}
                      alt="Logo Perusahaan"
                      fluid
                      style={{
                        maxWidth: "150px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                        backgroundColor: "#f9f9f9",
                      }}
                      onError={(e) => handleImageError(e)}
                    />

                    <div className="mt-3">
                      <p className="fw-bold mb-1">Logo Kecil:</p>
                      <Image
                        src={`${API_BASE.replace("/api", "/storage")}/${company.logo_kecil}`}
                        alt="Logo Kecil"
                        fluid
                        style={{
                          maxWidth: "80px",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          backgroundColor: "#f9f9f9",
                        }}
                        onError={(e) => handleImageError(e)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <h5 className="fw-bold">Nama Perusahaan:</h5>
                    <p className="text-muted mb-0">{company.nama_perusahaan}</p>
                  </div>

                  <div>
                    <h5 className="fw-bold">Alamat:</h5>
                    <p className="text-muted mb-0">{company.alamat_perusahaan}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted">
                  Data perusahaan tidak ditemukan.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Profil Perusahaan</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama Perusahaan</Form.Label>
              <Form.Control
                type="text"
                name="nama_perusahaan"
                value={formData.nama_perusahaan}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Alamat Perusahaan</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="alamat_perusahaan"
                value={formData.alamat_perusahaan}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Logo Perusahaan</Form.Label>
              <Form.Control
                type="file"
                name="logo_perusahaan"
                accept="image/*"
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Biarkan kosong jika tidak ingin mengganti logo besar.
              </Form.Text>
            </Form.Group>

            <Form.Group>
              <Form.Label>Logo Kecil</Form.Label>
              <Form.Control
                type="file"
                name="logo_kecil"
                accept="image/*"
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Biarkan kosong jika tidak ingin mengganti logo kecil.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default CompanySettings;
