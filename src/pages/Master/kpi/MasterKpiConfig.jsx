import { useEffect, useState, useCallback } from "react";
import { Card, Col, Row, Button, Tabs, Tab, Table, Modal, Form, Badge } from "react-bootstrap";
import { FiPlus, FiTrash, FiEdit, FiCode } from "react-icons/fi";
import axios from "axios";
import PageTitle from "../../../components/PageTitle";
import Swal from "sweetalert2";

const MasterKpiConfig = () => {
    const [activeTab, setActiveTab] = useState("formulas");
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        code: "",
        name: "",
        description: "",
        source_type: "api",
        endpoint: "",
        config: "" // String untuk textarea
    });

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("authToken");
    
    const axiosAuth = axios.create({ 
        baseURL: baseUrl, 
        headers: { Authorization: `Bearer ${token}` } 
    });

    const loadData = useCallback(async () => {
        try {
            const res = await axiosAuth.get(`/kpi/${activeTab}`);
            setData(res.data.data || []);
        } catch (e) {
            console.error("Gagal mengambil data", e);
            setData([]);
        }
    }, [activeTab]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleEdit = (item) => {
        setEditId(item.id);
        setForm({
            code: item.code || "",
            name: item.name || "",
            description: item.description || "",
            source_type: item.source_type || "api",
            endpoint: item.endpoint || "",
            // Mengubah object JSON dari DB menjadi string rapi (indentasi 2 spasi)
            config: item.config ? JSON.stringify(item.config, null, 2) : "" 
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Apakah anda yakin?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus!'
        });

        if (result.isConfirmed) {
            try {
                await axiosAuth.delete(`/kpi/${activeTab}/${id}`);
                Swal.fire('Deleted!', 'Data berhasil dihapus.', 'success');
                loadData();
            } catch (e) {
                Swal.fire('Error', 'Gagal menghapus data', 'error');
            }
        }
    };

    const handleSave = async () => {
        try {
            // Validasi & Parsing JSON Config
            let parsedConfig = null;
            if (form.config && form.config.trim() !== "") {
                try {
                    parsedConfig = JSON.parse(form.config);
                } catch (e) {
                    return Swal.fire("JSON Error", "Format Configuration harus berupa JSON yang valid!", "error");
                }
            }

            const payload = {
                ...form,
                endpoint: form.endpoint === "" ? null : form.endpoint,
                config: parsedConfig // Dikirim sebagai Object/Array ke BE
            };

            if (editId) {
                await axiosAuth.put(`/kpi/${activeTab}/${editId}`, payload);
            } else {
                await axiosAuth.post(`/kpi/${activeTab}`, payload);
            }

            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: `Data ${activeTab} berhasil disimpan`,
                timer: 1500,
                showConfirmButton: false
            });

            setShowModal(false);
            setEditId(null);
            setForm({ code: "", name: "", description: "", source_type: "api", endpoint: "", config: "" });
            loadData();

        } catch (e) {
            console.error("Save Error:", e);
            Swal.fire("Error", e.response?.data?.message || "Gagal menyimpan data", "error");
        }
    };

    return (
        <>
            <PageTitle title="KPI Configuration" breadCrumbItems={[{ label: "Master", path: "/" }, { label: "KPI Config", active: true }]} />
            
            <Card className="shadow-sm">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="nav-bordered">
                            <Tab eventKey="formulas" title="🔢 Calculation Formulas" />
                            <Tab eventKey="data-sources" title="🔌 External Data Sources" />
                        </Tabs>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => { 
                                setEditId(null);
                                setForm({ code: "", name: "", description: "", source_type: "api", endpoint: "", config: "" }); 
                                setShowModal(true); 
                            }}
                        >
                            <FiPlus className="me-1" /> Tambah {activeTab === 'formulas' ? 'Formula' : 'Source'}
                        </Button>
                    </div>

                    <Table responsive hover className="align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Code</th>
                                <th>Name / Description</th>
                                {activeTab === 'data-sources' && <th>Type & Endpoint</th>}
                                <th>Config Snippet</th>
                                <th className="text-center" style={{ width: "120px" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? data.map(item => (
                                <tr key={item.id}>
                                    <td><Badge bg="light" className="text-primary border">{item.code}</Badge></td>
                                    <td>
                                        <div className="fw-bold">{item.name}</div>
                                        <small className="text-muted text-truncate d-inline-block" style={{maxWidth: '200px'}}>{item.description || '-'}</small>
                                    </td>
                                    {activeTab === 'data-sources' && (
                                        <td>
                                            <Badge bg="info" className="me-2 text-uppercase">{item.source_type}</Badge>
                                            <small className="text-muted d-block">{item.endpoint || <span className="fst-italic text-black-50">No Endpoint</span>}</small>
                                        </td>
                                    )}
                                    <td>
                                        {item.config ? (
                                            <Badge bg="soft-secondary" className="text-dark border font-monospace">
                                                <FiCode className="me-1"/> JSON Set
                                            </Badge>
                                        ) : <small className="text-muted">-</small>}
                                    </td>
                                    <td className="text-center">
                                        <Button variant="link" className="text-warning p-0 me-2" onClick={() => handleEdit(item)}><FiEdit size={18} /></Button>
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(item.id)}><FiTrash size={18} /></Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={activeTab === 'data-sources' ? 5 : 4} className="text-center p-4 text-muted">
                                        Belum ada data {activeTab} tersedia
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>{editId ? 'Edit' : 'Tambah'} {activeTab === 'formulas' ? 'Formula' : 'Source'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Unique Code</Form.Label>
                                <Form.Control 
                                    value={form.code}
                                    disabled={!!editId}
                                    onChange={e => setForm({...form, code: e.target.value.toUpperCase().replace(/\s+/g, '_')})} 
                                    placeholder="CONTOH: SALES_LINEAR" 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Display Name</Form.Label>
                                <Form.Control 
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})} 
                                    placeholder="Masukkan nama tampilan"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {activeTab === 'data-sources' && (
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Source Type</Form.Label>
                                    <Form.Select value={form.source_type} onChange={e => setForm({...form, source_type: e.target.value})}>
                                        <option value="api">External API</option>
                                        <option value="system">Internal System</option>
                                        <option value="upload">Manual Upload</option>
                                        <option value="checklist">Checklist</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Endpoint</Form.Label>
                                    <Form.Control 
                                        value={form.endpoint || ""}
                                        onChange={e => setForm({...form, endpoint: e.target.value})} 
                                        placeholder="/api/v1/sync"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Description</Form.Label>
                        <Form.Control 
                            as="textarea" rows={2}
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})} 
                        />
                    </Form.Group>

                    <Form.Group className="mb-0">
                        <Form.Label className="fw-bold text-primary">Configuration (JSON Structure)</Form.Label>
                        <Form.Control 
                            as="textarea" rows={6}
                            value={form.config}
                            onChange={e => setForm({...form, config: e.target.value})} 
                            placeholder={`{\n  "math": "(realization/target)*100",\n  "max_score": 100\n}`}
                            style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#f8f9fa' }}
                        />
                        <Form.Text className="text-muted">
                            Gunakan format JSON yang valid. Ini akan diproses oleh sistem scoring.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                    <Button variant="primary" onClick={handleSave}>
                        {editId ? 'Perbarui Data' : 'Simpan Data'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default MasterKpiConfig;