import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import PageTitle from "../../components/PageTitle";
import { useAuthContext } from "../../context/useAuthContext";
import { FiCalendar, FiTrendingUp, FiPlus, FiEye } from "react-icons/fi";

const HoldingDetail = () => {
  const { holdingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [holding, setHolding] = useState(null);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
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

        // 1. Fetch holding detail
        const holdingRes = await api.get(`/holdings/${holdingId}`);
        setHolding(holdingRes.data);

        // 2. Fetch semua boards untuk holding ini
        const boardsRes = await api.get(`/holdings/${holdingId}/program-boards`);
        setBoards(boardsRes.data.data || boardsRes.data);

      } catch (err) {
        console.error("Error fetching holding detail:", err);
        setError("Gagal memuat data holding");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [holdingId]);

  // Handler untuk membuat board baru
  const handleCreateBoard = async () => {
    const yearToCreate = currentYear;
    
    // Cek apakah board untuk tahun ini sudah ada
    const existingBoard = boards.find(board => board.tahun === yearToCreate);
    if (existingBoard) {
      Swal.fire({
        title: "Board Sudah Ada",
        text: `Board untuk tahun ${yearToCreate} sudah tersedia.`,
        icon: "info",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Buat Program Board Baru?",
      html: `Buat program board untuk <strong>${holding?.name}</strong> tahun <strong>${yearToCreate}</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Buat Board",
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

      const response = await api.post(`/holdings/${holdingId}/program-boards/auto-generate`, {
        tahun: yearToCreate,
      });

      const newBoard = response.data.board;
      setBoards(prev => [...prev, newBoard]);

      Swal.fire({
        title: "Berhasil!",
        text: `Program board ${yearToCreate} berhasil dibuat`,
        icon: "success",
        confirmButtonColor: "#3085d6",
      });

    } catch (err) {
      console.error("Error creating board:", err);
      Swal.fire({
        title: "Gagal!",
        text: err.response?.data?.message || "Gagal membuat board",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  // Navigasi ke board trello
  const navigateToBoard = (boardId, tahun) => {
    navigate(`/program-holding/holding/${holdingId}/board/${boardId}`);
  };

  // Format progress bar color
  const getProgressColor = (percent) => {
    if (percent >= 80) return "success";
    if (percent >= 60) return "info";
    if (percent >= 40) return "warning";
    return "danger";
  };

  // Filter boards berdasarkan tahun (terbaru dulu)
  const sortedBoards = [...boards].sort((a, b) => b.tahun - a.tahun);

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Program Holding", path: "/program-holding/holding" },
          { 
            label: holding?.name || `Holding ${holdingId}`, 
            path: `/program-holding/holding/${holdingId}`,
            active: true 
          },
        ]}
        title={
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => navigate("/program-holding/holding")}
              >
                ←
              </Button>
              <div>
                <h4 className="mb-0">{holding?.name || `Holding ${holdingId}`}</h4>
                <small className="text-muted">
                  {holding?.description || "Detail program holding"}
                </small>
              </div>
            </div>
            
           
          </div>
        }
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-3">
          <Alert.Heading>Gagal Memuat Data</Alert.Heading>
          <p>{error}</p>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Coba Lagi
          </Button>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Memuat data holding...</div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Stats Overview */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                      <FiCalendar size={24} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="mb-0">{sortedBoards.length}</h5>
                      <small className="text-muted">Total Program Boards</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                      <FiTrendingUp size={24} className="text-success" />
                    </div>
                    <div>
                      <h5 className="mb-0">
                        {boards.length > 0 
                          ? Math.round(boards.reduce((sum, b) => sum + (b.persentase || 0), 0) / boards.length) 
                          : 0}%
                      </h5>
                      <small className="text-muted">Average Progress</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                      <FiEye size={24} className="text-info" />
                    </div>
                    <div>
                      <h5 className="mb-0">{holding?.tahun_aktif || "-"}</h5>
                      <small className="text-muted">Active Year</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
           {/* Tombol Create Board hanya untuk Superadmin/Admin */}
            {(user?.role?.name === "Superadmin" || user?.role?.name === "Admin") && (
              <Button
                variant="primary"
                onClick={handleCreateBoard}
              >
                <FiPlus className="me-1" />
                Buat Board {currentYear}
              </Button>
            )}

          {/* List of Boards */}
          <h5 className="fw-bold mb-3">Program Boards per Tahun</h5>
          
          {sortedBoards.length === 0 ? (
            <Alert variant="info">
              <Alert.Heading>Tidak Ada Program Boards</Alert.Heading>
              <p>
                {user?.role?.name === "Superadmin" || user?.role?.name === "Admin"
                  ? "Buat program board baru untuk mulai menambahkan program."
                  : "Belum ada program board yang tersedia. Hubungi admin untuk membuat board baru."}
              </p>
            </Alert>
          ) : (
            <Row>
              {sortedBoards.map((board) => (
                <Col md={4} lg={3} key={board.id}>
                  <Card
                    className="mb-4 shadow-sm border-0 hover-card"
                    style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                    onClick={() => navigateToBoard(board.id, board.tahun)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <Card.Body className="text-center">
                      {/* Tahun */}
                      <div className="mb-3">
                        <Badge bg="primary" className="px-3 py-2" style={{ fontSize: "1rem" }}>
                          <FiCalendar className="me-1" />
                          {board.tahun}
                        </Badge>
                      </div>

                      {/* Status */}
                      <div className="mb-3">
                        <Badge bg={board.status === 'active' ? 'success' : 'secondary'}>
                          {board.status === 'active' ? 'Aktif' : 'Arsip'}
                        </Badge>
                        {board.tahun === currentYear && (
                          <Badge bg="warning" className="ms-1">
                            Tahun Ini
                          </Badge>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small className="text-muted">Progress</small>
                          <small className="fw-bold">{board.persentase || 0}%</small>
                        </div>
                        <ProgressBar
                          now={board.persentase || 0}
                          variant={getProgressColor(board.persentase || 0)}
                          style={{ height: "6px" }}
                        />
                      </div>

                      {/* Info */}
                      <small className="text-muted d-block mb-2">
                        Dibuat: {new Date(board.created_at).toLocaleDateString('id-ID')}
                      </small>

                      {/* Action Button */}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToBoard(board.id, board.tahun);
                        }}
                      >
                        <FiEye className="me-1" />
                        Buka Board
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </>
  );
};

export default HoldingDetail;