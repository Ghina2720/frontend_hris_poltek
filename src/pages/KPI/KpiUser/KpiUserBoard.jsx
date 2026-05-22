import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PageTitle from "../../../components/PageTitle"; // Sesuaikan path alias jika perlu
import { useAuthContext } from "@/context/useAuthContext.jsx";
import Swal from "sweetalert2";

const KpiUserBoard = () => {
  const { holdingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [holding, setHolding] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

  // 🔧 Instance axios
  const token = localStorage.getItem("authToken");
  const api = axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // 🔐 VALIDASI AKSES (Sama dengan WorkOrganizer)
  useEffect(() => {
    if (user && holdingId) {
      const userHoldingId = user.holding_id;
      const currentHoldingId = parseInt(holdingId);
      const userRoleName = user.role?.name;

      const isSuperAdmin = userRoleName === 'Admin' || userRoleName === 'Superadmin';
      const isAllowed = isSuperAdmin || userHoldingId === currentHoldingId;

      if (!isAllowed) {
        Swal.fire({
          title: "Akses Ditolak",
          text: "Anda tidak memiliki akses ke data KPI holding ini!",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "Kembali"
        }).then(() => {
          navigate("/kpi/holdings", { replace: true });
        });
        return;
      }
      setAccessChecked(true);
    }
  }, [user, holdingId, navigate]);

  // 🔥 FETCH DATA USER & HOLDING
  useEffect(() => {
    if (!accessChecked) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Get Holding Detail
        const holdingRes = await api.get("/holdings");
        const holdingData = holdingRes.data.find(h => h.id === parseInt(holdingId));
        
        if (!holdingData) {
          setError("Holding tidak ditemukan");
          setLoading(false);
          return;
        }
        setHolding(holdingData);

        // 2. Get Users (Hanya yang memiliki jabatan / Staf Ahli)
        const usersRes = await api.get("/users");
        const filteredUsers = usersRes.data.filter(u => 
            u.holding_id === parseInt(holdingId) && u.jabatan_detail_id !== null
        );
        setUsers(filteredUsers);
        
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data staf");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [holdingId, accessChecked]);

  if (!accessChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Memeriksa akses...</span>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "KPI Management", path: "/kpi/holdings" },
          {
            label: holding ? holding.name : `Board Holding ${holdingId}`,
            path: `/kpi/monitoring/holding/${holdingId}`,
            active: true,
          },
        ]}
        title={
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={() => navigate("/kpi/holdings")}
            >
              ←
            </Button>
            <span>
              {holding ? `KPI Board: ${holding.name}` : `KPI Board #${holdingId}`}
            </span>
          </div>
        }
      />

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {users.length > 0 ? (
        <Row className="mt-3">
          {users.map((u) => (
            <Col md={3} sm={4} xs={6} key={u.id} className="mb-3">
              <Card
                className="text-center shadow-sm h-100 border-0"
                style={{
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: hoveredCard === u.id ? "translateY(-5px)" : "translateY(0)",
                  border: hoveredCard === u.id ? "1px solid #dee2e6" : "1px solid transparent"
                }}
                onMouseEnter={() => setHoveredCard(u.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate(`/kpi/monitoring/user/${u.id}`)}
              >
                <Card.Body>
                  <div className="pt-2 pb-2">
                    <img
                      src={
                        u.foto
                          ? `${API_BASE.replace('/api', '')}/storage/${u.foto}`
                          : "/default-avatar.jpg" // Atur ke default avatar Anda
                      }
                      alt={u.name}
                      className="rounded-circle img-thumbnail"
                      style={{
                        width: "90px",
                        height: "90px",
                        objectFit: "cover",
                        transition: "all 0.3s ease",
                        transform: hoveredCard === u.id ? "scale(1.05)" : "scale(1)"
                      }}
                    />
                    <h5 
                      className="mt-3 text-dark fw-bold"
                      style={{ transition: "all 0.3s ease" }}
                    >
                      {u.name}
                    </h5>
                    <p className="text-muted small mb-3">
                        {u.jabatan_detail?.nama_jabatan || u.jabatan?.nama_jabatan || "Staf Ahli"}
                    </p>

                    <Button
                      variant={hoveredCard === u.id ? "primary" : "light"}
                      className="btn-sm rounded-pill px-3"
                      style={{ transition: "all 0.3s ease" }}
                    >
                      Lihat Report KPI
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        !loading && <Alert variant="info">Belum ada staf ahli yang terdaftar di holding ini.</Alert>
      )}
    </>
  );
};

export default KpiUserBoard;