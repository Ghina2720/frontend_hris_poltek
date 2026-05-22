import React from "react";
import { Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return <React.Fragment>
      <footer className="footer">
        <div className="container-fluid">
          <Row>
             <Col md={6}>
              2025 - {currentYear} &copy; by{" "}
              <Link to="#">Intention Development SCI</Link>
            </Col>
            {/* <Col md={6}>
              2025 &copy; by{" "}
              <Link to="#">Intention Development</Link>
            </Col> */}

            <Col md={6}>
              {/* <div className="d-none d-md-flex gap-4 align-item-center justify-content-md-end footer-links">
                <Link to="#">About Us</Link>
                <Link to="#">Help</Link>
                <Link to="#">Contact Us</Link>
              </div> */}
            </Col>
          </Row>
        </div>
      </footer>
    </React.Fragment>;
};
export default Footer;