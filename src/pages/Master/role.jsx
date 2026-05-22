import { useEffect, useState } from "react";
import axios from "axios";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";
import { MENU_ITEMS } from "../../constants/menu";
import { useAuthContext } from "@/context/useAuthContext.jsx";

const MySwal = withReactContent(Swal);
const CRUD = ["read", "create", "update", "delete"];

const generatePermissionsFromMenu = (menu) => {
  const result = [];

  const walk = (items) => {
    items.forEach((item) => {
      if (item.isTitle) return;

      if (item.key) {
        // Jika ini adalah absensi, hanya tampilkan read permission
        if (item.key.toLowerCase().includes('absensi') || 
            item.label.toLowerCase().includes('absensi')) {
          result.push({
            label: item.label,
            key: item.key,
            permissions: [`${item.key}.read`], // Hanya read saja
          });
        } 
        // Jika ini adalah rekap-absen, tampilkan read dan delete saja
        else if (item.key.toLowerCase().includes('rekap-absen') || 
                item.label.toLowerCase().includes('rekap absen')) {
          result.push({
            label: item.label,
            key: item.key,
            permissions: [
              `${item.key}.read`,
              `${item.key}.delete`
            ], // Hanya read dan delete
          });
        }
        // Menu lainnya, tampilkan semua CRUD
        else {
          result.push({
            label: item.label,
            key: item.key,
            permissions: CRUD.map((a) => `${item.key}.${a}`),
          });
        }
      }

      if (item.children) walk(item.children);
    });
  };

  walk(menu);
  return result;
};

const PERMISSION_GROUPS = generatePermissionsFromMenu(MENU_ITEMS);

const Advanced = () => {
  const { hasPermission } = useAuthContext(); 
  const [data, setData] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([]);
  const [selectedRoleName, setSelectedRoleName] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: "",
    permissions: [],
  });

  const showPermissionsDetail = (role) => {
    setSelectedRoleName(role.role_name);
    setSelectedRolePermissions(role.permissions || []);
    setShowDetailModal(true);
  };

  const togglePermission = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const getGroupedPermissions = (permissions) => {
    const grouped = {};
    
    permissions.forEach(perm => {
      const [menuKey, action] = perm.split('.');
      
      if (!grouped[menuKey]) {
        grouped[menuKey] = {
          label: getMenuLabel(menuKey),
          key: menuKey,
          actions: []
        };
      }
      
      if (!grouped[menuKey].actions.includes(action)) {
        grouped[menuKey].actions.push(action);
      }
    });
    
    return Object.values(grouped);
  };

  const base = import.meta.env.VITE_API_BASE_URL;
  const url = `${base.replace(/\/+$/, "")}/roles`;

  const getAuthHeader = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await axios.get(url, { headers: getAuthHeader() });

      let items = [];
      if (Array.isArray(res.data)) items = res.data;
      else if (Array.isArray(res.data?.data)) items = res.data.data;
      else if (Array.isArray(res.data?.message)) items = res.data.message;

      // Ubah mapping untuk menyertakan permissions
      const rows = await Promise.all(items.map(async (r, i) => {
        try {
          // Ambil detail role untuk mendapatkan permissions
          const detailRes = await axios.get(`${url}/${r.id}`, {
            headers: getAuthHeader(),
          });
          
          const roleData = detailRes.data.message || detailRes.data;
          const permissions = roleData.permissions || [];
          
          return {
            no: i + 1,
            id: r.id,
            role_name: r.name || "",
            permissions: permissions,
            permission_count: permissions.length
          };
        } catch (error) {
          console.error(`Error fetching details for role ${r.id}:`, error);
          return {
            no: i + 1,
            id: r.id,
            role_name: r.name || "",
            permissions: [],
            permission_count: 0
          };
        }
      }));

      setData(rows);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAllPermissions = (groupPerms) => {
    const allSelected = groupPerms.every((perm) => form.permissions.includes(perm));

    setForm((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !groupPerms.includes(p)) // hapus semua dari grup
        : [...new Set([...prev.permissions, ...groupPerms])],     // tambahkan semua
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

 const handleSave = async () => {
    try {
      if (!form.name.trim()) {
        return MySwal.fire("Perhatian", "Nama role tidak boleh kosong!", "warning");
      }

      const payload = {
        role_name: form.name,
        permissions: form.permissions,
      };

      console.log("Payload yang dikirim:", payload);

      let savedRole;

      if (form.id) {
        // Update role yang sudah ada
        const res = await axios.put(`${url}/${form.id}`, payload, {
          headers: getAuthHeader(),
        });
        
        savedRole = res.data?.message || res.data;
        MySwal.fire("Berhasil", "Role berhasil diperbarui!", "success");
        
        // Update data di state secara langsung
        setData(prevData => 
          prevData.map(item => {
            if (item.id === form.id) {
              return {
                ...item,
                role_name: form.name,
                permissions: form.permissions,
                permission_count: form.permissions.length
              };
            }
            return item;
          })
        );
        
        // Jika modal detail sedang terbuka untuk role ini, update juga
        if (selectedRoleName === form.name) {
          setSelectedRolePermissions(form.permissions);
        }
      } else {
        // Create role baru
        const res = await axios.post(url, payload, {
          headers: getAuthHeader(),
        });
        
        savedRole = res.data?.message || res.data;
        MySwal.fire("Berhasil", "Role berhasil ditambahkan!", "success");
        
        // Setelah berhasil save, fetch data terbaru
        await fetchData();
      }

      setShowModal(false);
    } catch (e) {
      console.error("Error saat menyimpan:", e);
      MySwal.fire(
        "Error",
        e?.response?.data?.message || "Gagal menyimpan data",
        "error"
      );
    }
  };

  // Tambahkan useEffect untuk sinkronisasi data ketika modal detail terbuka
  useEffect(() => {
    // Jika modal detail sedang terbuka, sinkronkan data
    if (showDetailModal && selectedRoleName) {
      const currentRole = data.find(role => role.role_name === selectedRoleName);
      if (currentRole) {
        // Perbarui permissions dengan data terbaru dari state
        setSelectedRolePermissions(currentRole.permissions || []);
      }
    }
  }, [data, showDetailModal, selectedRoleName]);

  const handleEdit = async (row) => {
    try {
      const res = await axios.get(`${url}/${row.id}`, {
        headers: getAuthHeader(),
      });

      // PERBAIKI INI: ambil data dari struktur response backend
      const roleData = res.data.message || res.data;
      
      setForm({
        id: row.id,
        name: roleData.role_name || roleData.name || "", // Backend mengembalikan 'role_name'
        permissions: roleData.permissions || [],
      });

      setShowModal(true);
    } catch (e) {
      console.error("Error saat edit:", e);
      MySwal.fire("Error", "Gagal mengambil detail role", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await MySwal.fire({
      title: "Yakin hapus?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${url}/${id}`, { headers: getAuthHeader() });

      MySwal.fire("Berhasil", "Data berhasil dihapus!", "success");
      fetchData();
    } catch (e) {
      MySwal.fire("Error", e?.response?.data?.message || "Gagal menghapus data", "error");
    }
  };

  const getMenuLabel = (menuKey) => {
    const menuItem = PERMISSION_GROUPS.find(g => g.key === menuKey);
    return menuItem ? menuItem.label : menuKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const translateAction = (action) => {
    const translations = {
      'read': 'Lihat',
      'create': 'Tambah',
      'update': 'Edit',
      'delete': 'Hapus'
    };
    return translations[action] || action;
  };

  const columns = [
    { Header: "No", accessor: "no", sort: false, width: 70 },
    { Header: "Nama Role", accessor: "role_name", sort: true },
    { 
      Header: "Hak Akses", 
      accessor: "permissions", 
      sort: true,
      width: 400,
      Cell: ({ row }) => {
        const permissions = row.original.permissions || [];
        const groupedPermissions = getGroupedPermissions(permissions);
        
        if (permissions.length === 0) {
          return <span className="text-muted">Tidak ada hak akses</span>;
        }
        
        return (
          <div>

            {/* Link ke detail */}
            <div className="mt-2">
              <small 
                className="text-primary cursor-pointer"
                onClick={() => showPermissionsDetail(row.original)}
                style={{ cursor: 'pointer' }}
              >
                Lihat detail →
              </small>
            </div>
          </div>
        );
      }
    },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        // Cek permission
        const canUpdate = hasPermission("master-role.update");
        const canDelete = hasPermission("master-role.delete");
        
        // Jika tidak ada permission, tampilkan "-"
        if (!canUpdate && !canDelete) {
          return <span className="text-muted">-</span>;
        }
        
        return (
          <div className="d-flex gap-2">
            {canUpdate && (
              <FaEdit
                className="text-warning"
                style={{ cursor: "pointer" }}
                onClick={() => handleEdit(row.original)}
                title="Edit"
              />
            )}
            {canDelete && (
              <FaTrash
                className="text-danger"
                style={{ cursor: "pointer" }}
                onClick={() => handleDelete(row.original.id)}
                title="Hapus"
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Roles CRUD", path: "/features/tables/advanced", active: true },
        ]}
        title={"Roles Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <h4 className="header-title">Role Data</h4>
                {hasPermission("master-role.create") && ( // ← Tambahkan cek permission ini
                  <Button
                    onClick={() => {
                      setForm({ 
                        id: null, 
                        name: "",
                        permissions: [] 
                      });
                      setShowModal(true);
                    }}
                  >
                    + Tambah Role
                  </Button>
                )}
              </div>

              {err && <div className="alert alert-danger">{err}</div>}

              <Table
                keyField="no"
                columns={columns}
                data={data}
                pageSize={5}
                sizePerPageList={[
                  { text: "5", value: 5 },
                  { text: "10", value: 10 },
                  { text: "25", value: 25 },
                  { text: "All", value: data.length || 5 },
                ]}
                isSortable={true}
                pagination={true}
                isSearchable={true}
                loading={loading}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal create/edit - TIDAK DIUBAH */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{form.id ? "Edit Role" : "Tambah Role"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Role</Form.Label>
              <Form.Control
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </Form.Group>

            <hr />

            <Form.Label className="fw-bold">Hak Akses</Form.Label>

            {PERMISSION_GROUPS.map((group) => {
              const allChecked = group.permissions.every((perm) => form.permissions.includes(perm));

              return (
                <div key={group.key} className="border rounded p-2 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">{group.label}</div>
                    <Form.Check 
                      type="checkbox"
                      label="All"
                      checked={allChecked}
                      onChange={() => toggleAllPermissions(group.permissions)}
                    />
                  </div>

                  <Row>
                    {group.permissions.map((perm) => (
                      <Col md={3} key={perm}>
                        <Form.Check
                          type="checkbox"
                          label={perm.split(".")[1].toUpperCase()}
                          checked={form.permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              );
            })}
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

      {/* Modal Detail Hak Akses */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detail Hak Akses - {selectedRoleName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRolePermissions.length === 0 ? (
            <div className="text-center py-3">
              <div className="text-muted">Tidak ada hak akses</div>
            </div>
          ) : (
            <div>
              <div className="mt-3">
                {getGroupedPermissions(selectedRolePermissions).map((group, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="fw-medium mb-2">{group.label}</div>
                    <div className="d-flex flex-wrap gap-2">
                      {group.actions.map((action, i) => (
                        <span key={i} className="badge bg-light text-dark border">
                          {translateAction(action)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Advanced;