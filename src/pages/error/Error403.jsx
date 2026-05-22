import React from "react";
import { Link } from "react-router-dom";
import { Row, Col, Card } from "react-bootstrap";
import { FiLock } from "react-icons/fi"; // Lock icon untuk forbidden

const Error403 = () => {
  return (
    <React.Fragment>
      <div className="account-pages mt-5 mb-5">
        <div className="container">
          <Row className="justify-content-center">
            <Col lg={4}>
              <Card>
                <Card.Body className="p-4">
                  <div className="text-center">
                    <FiLock size={100} className="text-danger mb-4" />
                    <h3 className="mt-4">Access Denied</h3>
                    <p className="text-muted mb-0">
                      You don't have permission to access this page. 
                      Please contact your administrator if you believe this is an error.
                    </p>
                  </div>
                </Card.Body>
              </Card>

              <Row>
                <Col className="text-center">
                  <p className="text-white-50">
                    Return to{" "}
                    <Link to="/dashboard-1" className="text-white ms-1">
                      <b>Dashboard</b>
                    </Link>
                  </p>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </div>

      <footer className="footer footer-alt">
        2025 - Intention Development
      </footer>
    </React.Fragment>
  );
};

export default Error403;