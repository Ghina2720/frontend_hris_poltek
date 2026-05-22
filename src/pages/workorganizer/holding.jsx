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
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PageTitle from "../../components/PageTitle";
import { useAuthContext } from "../../context/useAuthContext";

const HoldingCard = ({ id, name, logo, description }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext(); // ⬅️ AMBIL ROLE USER

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

  const allowedRoles = ["Superadmin", "Direktur", "Admin"]; // ⬅️ ROLES YANG DIIZINKAN

  const canEdit = allowedRoles.includes(user?.role?.name); // ⬅️ CEK ROLE

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
      alert("Gagal memperbarui logo");
    }
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
        onClick={() => navigate(`/workorganizer/holding/${id}/board`)}
      >
        <Card.Body className="text-center">
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* Logo */}
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
                }}
              >
                {name?.charAt(0)}
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

          {description && (
            <p className="text-muted small mb-3">{description}</p>
          )}

          <Button
            variant="outline-primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/workorganizer/holding/${id}/board`);
            }}
          >
            View Board
          </Button>
        </Card.Body>
      </Card>

      {/* Popup Edit Logo */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Logo</Modal.Title>
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
            <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>

          <Button variant="primary" onClick={handleSaveLogo} disabled={!selectedFile}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const WorkOrganizerHolding = () => {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuthContext();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    const api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    api
      .get("/holdings")
      .then((res) => {
        setHoldings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat data holdings");
        setLoading(false);
      });
  }, []);

  const isSuperadmin = user?.role?.name === "Superadmin" || user?.role?.name === "Admin";
  const myHoldings = user
    ? isSuperadmin
      ? holdings
      : holdings.filter((h) => h.id === user.holding?.id)
    : [];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "My Task", path: "/workorganizer/holding" },
          { label: "Holdings", path: "/workorganizer/holding", active: true },
        ]}
        title="Holding List"
      />

      <h5 className="fw-bold mb-3">List Holdings</h5>

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {myHoldings.map((holding) => (
          <Col md={4} lg={3} key={holding.id}>
            <HoldingCard
              id={holding.id}
              name={holding.name}
              logo={holding.logo_url}
              description={holding.description}
            />
          </Col>
        ))}
      </Row>
    </>
  );
};

export default WorkOrganizerHolding;
