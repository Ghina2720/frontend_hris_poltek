import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PageTitle from "../../components/PageTitle";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import Swal from "sweetalert2";

const WorkOrganizerBoard = () => {
  const { holdingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [boards, setBoards] = useState([]);
  const [holding, setHolding] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

  // 🔧 Buat instance axios dengan token
  const token = localStorage.getItem("authToken");
  const api = axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // 🔐 VALIDASI AKSES HOLDING
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
          text: "Anda tidak memiliki akses ke holding ini!",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "Kembali ke Holding Saya"
        }).then(() => {
          navigate(`/workorganizer/holding/${userHoldingId}/board`, { replace: true });
        });
        return;
      }

      setAccessChecked(true);
    }
  }, [user, holdingId, navigate]);

  // Fungsi untuk mendapatkan nama bulan
  const getCurrentMonthName = () => {
    return new Date().toLocaleString('id-ID', { month: 'long' });
  };

  // 🔥 OPTIMIZED: Fetch data dengan projects_done_monthly
  useEffect(() => {
    if (!accessChecked) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Validasi holding exists
        const holdingRes = await api.get("/holdings");
        const holdingData = holdingRes.data.find(h => h.id === parseInt(holdingId));
        
        if (!holdingData) {
          setError("Holding tidak ditemukan");
          setLoading(false);
          return;
        }
        setHolding(holdingData);

        // 2. Get users dari holding ini
        // const usersRes = await api.get("/users");
        // const filteredUsers = usersRes.data.filter(u => u.holding_id === parseInt(holdingId));
        // setUsers(filteredUsers);

        const usersRes = await api.get(`/users?holding_id=${holdingId}`);
        // ⬇️ Nggak perlu filter lagi, backend udah kirim yang sesuai!
        setUsers(usersRes.data);

        // 3. Get boards data (sudah include projects_done_monthly)
        const boardsRes = await api.post(`/boards/generate/${holdingId}`);
        const boardsWithStats = boardsRes.data;

        // 4. Langsung ambil projects_done_monthly dari board data
        const stats = {};
        usersRes.data.forEach(u => {
          const userBoard = boardsWithStats.find(b => b.user_id === u.id);
          stats[u.id] = userBoard?.projects_done_monthly || 0;
        });
        
        setMonthlyStats(stats);
        setBoards(boardsWithStats);
        
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [holdingId, accessChecked]);

  // Tampilkan loading selama validasi akses
  if (!accessChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Memeriksa akses holding...</span>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "My Task", path: "/workorganizer/holding" },
          {
            label: holding ? holding.name : `Board Holding ${holdingId}`,
            path: `/workorganizer/holding/${holdingId}/board`,
            active: true,
          },
        ]}
        title={
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={() => navigate(-1)}
            >
              ←
            </Button>
            <span>
              {holding ? `Board: ${holding.name}` : `Board Holding #${holdingId}`}
            </span>
          </div>
        }
      />

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {users.length > 0 && (
        <Row className="mt-3">
          {users.map((u) => (
            <Col md={3} sm={4} xs={6} key={u.id} className="mb-3">
              <Card
                className="text-center shadow-sm h-100"
                style={{
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: hoveredCard === u.id ? "translateY(-5px)" : "translateY(0)",
                  border: hoveredCard === u.id ? "1px solid #dee2e6" : "1px solid rgba(0,0,0,.125)"
                }}
                onMouseEnter={() => setHoveredCard(u.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() =>
                  navigate(`/workorganizer/holding/${holdingId}/user/${u.id}/tasks`)
                }
              >
                <Card.Body>
                  <div className="pt-2 pb-2">
                    <img
                      src={
                        u.foto
                          ? `${API_BASE.replace('/api', '')}/storage/${u.foto}`
                          : new URL("@/assets/images/users/user-6.jpg", import.meta.url).href
                      }
                      alt="User Avatar"
                      className="rounded-circle img-thumbnail"
                      style={{
                        width: "90px",
                        height: "90px",
                        objectFit: "cover",
                        objectPosition: "center",
                        transition: "all 0.3s ease",
                        transform: hoveredCard === u.id ? "scale(1.05)" : "scale(1)"
                      }}
                    />
                    <h4 
                      className="mt-3 text-dark"
                      style={{ transition: "all 0.3s ease", transform: hoveredCard === u.id ? "scale(1.02)" : "scale(1)" }}
                    >
                      {u.name}
                    </h4>

                    <Button
                      variant="light"
                      className="btn-sm"
                      style={{
                        transition: "all 0.3s ease",
                        transform: hoveredCard === u.id ? "scale(1.05)" : "scale(1)",
                        boxShadow: hoveredCard === u.id ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
                      }}
                    >
                      Click to View Tasks
                    </Button>

                    <Row className="mt-1">
                      <Col xs={12}>
                        <div className="mt-3">
                          <p className="mb-0 text-muted text-truncate">{getCurrentMonthName()}</p>
                          {/* 🔥 TAMPILKAN projects_done_monthly DARI DATABASE */}
                          <h5>{monthlyStats[u.id] || 0}</h5>
                          <p className="mb-0 text-muted text-truncate">Completed Projects</p>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
};

export default WorkOrganizerBoard;