import { useEffect, useState } from "react";
import { Card, Col, Row, Spinner, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PageTitle from "../../../components/PageTitle";
import { useAuthContext } from "../../../context/useAuthContext";

const KpiHoldingList = () => {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  useEffect(() => {
    const api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });

    api.get("/holdings").then((res) => {
      setHoldings(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isPrivileged = ["Superadmin", "Admin", "Direktur"].includes(user?.role?.name);
  const myHoldings = isPrivileged ? holdings : holdings.filter(h => h.id === user?.holding_id);

  return (
    <>
      <PageTitle breadCrumbItems={[{ label: "KPI", active: true }]} title="KPI Monitoring" />
      <Row>
        {loading ? <Spinner animation="border" /> : myHoldings.map((h) => (
          <Col md={3} key={h.id}>
            <Card className="text-center shadow-sm border-0" onClick={() => navigate(`/kpi/monitoring/holding/${h.id}/board`)} style={{ cursor: 'pointer' }}>
              <Card.Body>
                <img src={h.logo_url} alt="" className="rounded-circle mb-3" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                <h5 className="fw-bold">{h.name}</h5>
                <Button variant="soft-primary" size="sm" className="rounded-pill">Monitor KPI</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default KpiHoldingList;