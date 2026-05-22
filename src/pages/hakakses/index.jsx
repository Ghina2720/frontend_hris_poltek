import { useEffect, useState } from "react";
import axios from "axios";
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
import { FaEdit } from "react-icons/fa";
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const columns = [
  { Header: "ID", accessor: "id", sort: true },
  { Header: "Role Name", accessor: "role_name", sort: true },
  {
    Header: "Aksi",
    Cell: ({ row, onEdit }) => (
      <div className="d-flex gap-2">
        <FaEdit
          className="text-warning"
          style={{ cursor: "pointer" }}
          onClick={() => onEdit(row.original)}
        />
      </div>
    ),
  },
];

const sizePerPageList = [
  { text: "5", value: 5 },
  { text: "10", value: 10 },
  { text: "25", value: 25 },
];

const Advanced = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal Edit
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    role_name: "",
    permissions: [],
  });

  const [allPermissions, setAllPermissions] = useState([]); // semua permission dari API
  const { user } = useAuthContext();
  const token = user?.token || localStorage.getItem("authToken");

  const axiosAuth = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  // Ambil semua role
  const fetchRoles = () => {
    setLoading(true);
    axiosAuth
      .get("/roles")
      .then((res) => setRoles(res.data.message || []))
      .catch(() => setError("Gagal mengambil data roles."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Ambil semua permission
  const fetchPermissions = async () => {
    try {
      const res = await axiosAuth.get("/permissions");
      setAllPermissions(res.data.message || []);
    } catch (error) {
      console.error("Gagal mengambil daftar permission:", error);
    }
  };

  // Ketika klik Edit
  const handleEdit = async (role) => {
    try {
      setLoading(true);

      // ambil detail role (beserta permission-nya)
      const [roleRes, permRes] = await Promise.all([
        axiosAuth.get(`/roles/${role.id}`),
        axiosAuth.get("/permissions"),
      ]);

      

      const roleData = roleRes.data.message;
      setFormData({
        id: roleData.id,
        role_name: roleData.role_name,
        permissions: roleData.permissions || [],
      });

      setAllPermissions(permRes.data.message || []);
      setShowModal(true);
    } catch (error) {
      alert("Gagal memuat data role atau permission.");
    } finally {
      setLoading(false);
    }
  };

  // Simpan perubahan role (PUT /roles/{id})
  const handleSave = () => {
    if (!formData.id) return;

    axiosAuth
      .put(`/roles/${formData.id}`, {
        role_name: formData.role_name,
        permissions: formData.permissions,
      })
      .then(() => {
        fetchRoles();
        setShowModal(false);
        setFormData({ id: null, role_name: "", permissions: [] });
      })
      .catch(() => alert("Gagal menyimpan perubahan role."));
  };

  return (
    <>
      <PageTitle title="Hak Akses Role Table" />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Hak Akses Role</h4>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : (
                <Table
                  columns={columns.map((col) =>
                    col.Header === "Aksi"
                      ? {
                          ...col,
                          Cell: ({ row }) =>
                            col.Cell({
                              row,
                              onEdit: handleEdit,
                            }),
                        }
                      : col
                  )}
                  data={roles}
                  pageSize={5}
                  sizePerPageList={sizePerPageList}
                  isSortable={true}
                  pagination={true}
                  isSearchable={true}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Hak Akses Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            
            <Form.Group>
              <Form.Label>Daftar Hak Akses</Form.Label>
              <div className="d-flex flex-wrap gap-3">
                {allPermissions.length === 0 ? (
                  <p>Tidak ada permission ditemukan.</p>
                ) : (
                  allPermissions.map((perm) => (
                    <Form.Check
                      key={perm.id}
                      type="checkbox"
                      label={perm.name}
                      checked={formData.permissions.includes(perm.name)}
                      onChange={(e) => {
                        let updated = [...formData.permissions];
                        if (e.target.checked) {
                          updated.push(perm.name);
                        } else {
                          updated = updated.filter((p) => p !== perm.name);
                        }
                        setFormData({ ...formData, permissions: updated });
                      }}
                    />
                  ))
                )}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Advanced;
