import { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PageTitle from "../../components/PageTitle";
import { useAuthContext } from "../../context/useAuthContext";
import Swal from "sweetalert2";
import { FiCalendar, FiTrendingUp, FiUsers } from "react-icons/fi";

const ProgramHoldingCard = ({ id, name, logo, description, tahun_aktif, progress }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [isHovered, setIsHovered] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(logo);

  const token = localStorage.getItem("authToken");

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  // Roles yang bisa edit logo program holding
  const allowedRoles = ["Superadmin", "Direktur", "Admin"];
  const canEdit = allowedRoles.includes(user?.role?.name);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setSelectedFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSaveLogo = async () => {
    if (!selectedFile) return;

    const form = new FormData();
    form.append("logo", selectedFile);

    try {
      await api.post(`/holdings/${id}/logo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowModal(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Gagal!",
        text: "Gagal memperbarui logo",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  // Warna progress bar berdasarkan persentase
  const getProgressColor = (percent) => {
    if (percent >= 80) return "success";
    if (percent >= 60) return "info";
    if (percent >= 40) return "warning";
    return "danger";
  };

  return (
    <>
      <Card
        className="mb-4 shadow-sm border-0"
        style={{
          cursor: "pointer",
          transition: "all 0.3s ease",
          transform: isHovered ? "translateY(-8px)" : "translateY(0)",
          border: isHovered ? "1px solid #dee2e6" : "1px solid rgba(0,0,0,.125)",
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowEdit(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowEdit(false);
        }}
        onClick={() => navigate(`/program-holding/holding/${id}`)}
      >
        <Card.Body className="text-center">
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* Logo Holding */}
            {logo ? (
              <img
                src={logo}
                alt={name}
                className="rounded-circle mb-3"
                style={{
                  objectFit: "cover",
                  width: "90px",
                  height: "90px",
                  transition: "0.3s",
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }}
              />
            ) : (
              <div
                className="bg-light d-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: "90px",
                  height: "90px",
                  fontSize: "32px",
                  color: "#6c757d",
                  fontWeight: "bold",
                  backgroundColor: "#e3f2fd",
                }}
              >
                <FiCalendar size={32} />
              </div>
            )}

            {/* Tombol Edit Logo */}
            {showEdit && canEdit && (
              <Button
                variant="dark"
                size="sm"
                className="position-absolute"
                style={{
                  top: "0",
                  right: "0",
                  padding: "2px 6px",
                  fontSize: "10px",
                  borderRadius: "50%",
                  opacity: 0.85,
                  zIndex: 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
              >
                ✎
              </Button>
            )}
          </div>

          <h5
            className="fw-bold mb-1"
            style={{
              transition: "0.3s",
              transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
          >
            {name}
          </h5>

          {/* Badge Tahun Aktif */}
          {tahun_aktif && (
            <Badge bg="primary" className="mb-2">
              {tahun_aktif} Active
            </Badge>
          )}

          {description && (
            <p className="text-muted small mb-3">{description}</p>
          )}

          

          {/* Action Buttons */}
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/program-holding/holding/${id}`);
              }}
            >
              <FiTrendingUp className="me-1" />
              View Program
            </Button>
            
           
          </div>
        </Card.Body>
      </Card>

      {/* Modal Edit Logo */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Logo Holding</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <img
              src={preview}
              alt="Preview"
              className="rounded-circle"
              style={{ width: "120px", height: "120px", objectFit: "cover" }}
            />
          </div>
          <Form.Group controlId="formFile">
            <Form.Label>Pilih Logo Baru</Form.Label>
            <Form.Control 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveLogo} 
            disabled={!selectedFile}
          >
            Simpan Logo
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const ProgramHolding = () => {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProgramBoards: 0,
    averageProgress: 0,
    activeThisYear: 0,
  });

  const { user } = useAuthContext();
  const navigate = useNavigate();
  const isSuperadmin = user?.role?.name === "Superadmin" || user?.role?.name === "Admin";

 // GANTI seluruh useEffect di holding.jsx dengan ini:
useEffect(() => {
  const fetchHoldingsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const response = await api.get("/holdings");
      let holdingsData = response.data;

      // ✅ PERBAIKAN: Gunakan holding_id langsung
      const userRole = user?.role?.name;
      const isSuperadminOrAdmin = userRole === "Superadmin" || userRole === "Admin";

      if (!isSuperadminOrAdmin && user?.holding_id) {
        // Hanya tampilkan holding milik user
        holdingsData = holdingsData.filter(h => h.id === user.holding_id);
      }

      // ... (sisanya tetap sama)
      const holdingsWithStats = holdingsData.map(holding => ({
        ...holding,
        tahun_aktif: holding.tahun_aktif || null,
        progress: holding.progress || holding.persentase || 0,
        logo_url: holding.logo_url || holding.logo || null,
        description: holding.description || "",
      }));

      // Hitung statistik...
      setHoldings(holdingsWithStats);
      
    } catch (err) {
      console.error("Error fetching holdings:", err);
      setError("Gagal memuat data holdings.");
    } finally {
      setLoading(false);
    }
  };

  fetchHoldingsData();
}, [user]);



  // Handle create new program board untuk holding yang belum punya
  const handleCreateProgramBoard = async (holdingId, holdingName) => {
    const currentYear = new Date().getFullYear();
    
    const result = await Swal.fire({
      title: "Buat Program Board?",
      html: `Buat program board untuk <strong>${holdingName}</strong> tahun <strong>${currentYear}</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Buat Program",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("authToken");
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      // Panggil endpoint untuk auto-generate program board
      await api.post(`/holdings/${holdingId}/program-boards/auto-generate`, {
        tahun: currentYear,
      });

      Swal.fire({
        title: "Berhasil!",
        text: "Program board berhasil dibuat",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      }).then(() => {
        window.location.reload();
      });
    } catch (err) {
      console.error("Error creating program board:", err);
      Swal.fire({
        title: "Gagal!",
        text: err.response?.data?.message || "Gagal membuat program board",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Program Holding", path: "/program-holding/holding" },
          { label: "Holdings", path: "/program-holding/holding", active: true },
        ]}
     
      />

      <h5 className="fw-bold mb-3">List Program Holdings</h5>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Memuat data program holdings...</div>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {!loading && !error && holdings.length === 0 && (
        <Alert variant="info">
          <Alert.Heading>Tidak Ada Holdings</Alert.Heading>
          <p>
            Tidak ada holding yang ditemukan. {isSuperadmin 
              ? "Anda bisa membuat holding baru dari menu Manage Holdings."
              : "Hubungi administrator untuk menambahkan holding."}
          </p>
        </Alert>
      )}

      <Row>
        {holdings.map((holding) => (
          <Col md={4} lg={3} key={holding.id}>
            <ProgramHoldingCard
              id={holding.id}
              name={holding.name}
              logo={holding.logo_url}
              description={holding.description}
              tahun_aktif={holding.tahun_aktif}
              progress={holding.progress}
            />
            
            
          </Col>
        ))}
      </Row>
    </>
  );
};

export default ProgramHolding;