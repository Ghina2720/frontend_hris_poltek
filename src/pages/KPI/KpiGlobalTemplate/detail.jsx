import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Col, Row, Button, Modal, Form, Badge, Accordion, Table } from "react-bootstrap";
// Import icons
import { FiPlus, FiTrash, FiArrowLeft, FiEdit2, FiInfo, FiEye, FiSend, FiFileText, FiLink } from "react-icons/fi";
import PageTitle from "../../../components/PageTitle";
import Swal from "sweetalert2";

const KpiGlobalDetail = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();

    // Data States
    const [templateInfo, setTemplateInfo] = useState(null);
    const [kinerjaUtama, setKinerjaUtama] = useState([]);
    const [helpers, setHelpers] = useState({ formulas: [], data_sources: [] });
    const [loading, setLoading] = useState(false);

    // Modal Kinerja Utama (Level 2)
    const [showModalKU, setShowModalKU] = useState(false);
    const [formKU, setFormKU] = useState({ name: "", bobot: 0 });
    const [editKUId, setEditKUId] = useState(null);

    // Modal KPI Template/Task (Level 3)
    const [showModalTask, setShowModalTask] = useState(false);
    const [activeKUId, setActiveKUId] = useState(null);
    const [editTaskId, setEditTaskId] = useState(null);
    const [formTask, setFormTask] = useState({
        task: "",
        bobot: 0,
        target_value: 100,
        rules: "",
        minimal_bukti: 0, 
        evidence_type: "file",
        evidence_ext: "pdf,jpg,png",      
        formula_id: "",
        data_source_id: "",
        is_required: false
    });

    const [showModalGenerate, setShowModalGenerate] = useState(false);
    const [genPeriod, setGenPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("authToken");
    const axiosAuth = axios.create({
        baseURL: baseUrl,
        headers: { Authorization: `Bearer ${token}` }
    });

    // --- LOAD DATA ---
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const resTemp = await axiosAuth.get(`/kpi/global-templates/${templateId}`);
            setTemplateInfo(resTemp.data.data);

            const resKU = await axiosAuth.get(`/kpi/kinerja-utama/template/${templateId}`);
            setKinerjaUtama(resKU.data.data);
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "Gagal mengambil data struktur KPI", "error");
        } finally {
            setLoading(false);
        }
    }, [templateId]);

    const loadHelpers = async () => {
        try {
            const res = await axiosAuth.get('/kpi/helpers');
            setHelpers(res.data);
        } catch (e) { console.error("Gagal load helpers", e); }
    };

    useEffect(() => {
        loadData();
        loadHelpers();
    }, [loadData]);

    // --- KINERJA UTAMA LOGIC ---
    const handleSaveKU = async () => {
        try {
            const payload = { ...formKU, kpi_global_template_id: templateId };
            if (editKUId) {
                await axiosAuth.put(`/kpi/kinerja-utama/${editKUId}`, payload);
            } else {
                await axiosAuth.post(`/kpi/kinerja-utama`, payload);
            }
            Swal.fire("Berhasil", "Kategori disimpan", "success");
            setShowModalKU(false);
            setEditKUId(null);
            setFormKU({ name: "", bobot: 0 });
            loadData();
        } catch (e) {
            Swal.fire("Error", e.response?.data?.message || "Gagal menyimpan", "error");
        }
    };

    const deleteKU = async (id) => {
        const confirm = await Swal.fire({
            title: 'Hapus Kategori?',
            text: "Seluruh indikator di dalamnya akan terhapus!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus'
        });
        if (confirm.isConfirmed) {
            await axiosAuth.delete(`/kpi/kinerja-utama/${id}`);
            loadData();
        }
    };

    // --- KPI TASK LOGIC ---
    const handleEditTask = (task) => {
        setActiveKUId(task.kinerja_utama_template_id);
        setEditTaskId(task.id);
        setFormTask({
            task: task.task,
            bobot: task.bobot,
            target_value: task.target_value,
            rules: task.rules || "",
            minimal_bukti: task.minimal_bukti || 0,
            evidence_type: task.evidence_type || "file",
            evidence_ext: task.evidence_ext || "pdf,jpg,png",       
            formula_id: task.formula_id || "",
            data_source_id: task.data_source_id || "",
            is_required: task.is_required === 1 || task.is_required === true
        });
        setShowModalTask(true);
    };

    const handleSaveTask = async () => {
        try {
            const payload = { 
                ...formTask, 
                kinerja_utama_template_id: activeKUId,
                formula_id: formTask.formula_id || null,
                data_source_id: formTask.data_source_id || null,
                minimal_bukti: parseInt(formTask.minimal_bukti),
                is_required: formTask.is_required ? 1 : 0
            };

            if (editTaskId) {
                await axiosAuth.put(`/kpi/templates/${editTaskId}`, payload);
            } else {
                await axiosAuth.post(`/kpi/templates`, payload);
            }

            Swal.fire("Berhasil", "Indikator berhasil disimpan", "success");
            setShowModalTask(false);
            setEditTaskId(null);
            setFormTask({ task: "", bobot: 0, target_value: 100, rules: "", minimal_bukti: 0, evidence_type: "file", evidence_ext: "pdf,jpg,png", formula_id: "", data_source_id: "", is_required: false });
            loadData(); 
        } catch (e) {
            Swal.fire("Error", e.response?.data?.message || "Gagal menyimpan indikator", "error");
        }
    };

    const deleteTask = async (id) => {
        const confirm = await Swal.fire({ title: 'Hapus Indikator?', icon: 'warning', showCancelButton: true });
        if (confirm.isConfirmed) {
            await axiosAuth.delete(`/kpi/templates/${id}`);
            loadData();
        }
    };

    // const handleGenerateToStaff = async () => {
    //     if (totalBobotKU !== 100) {
    //         return Swal.fire("Perhatian", `Total bobot saat ini ${totalBobotKU}%. Harus 100% untuk generate ke staf.`, "warning");
    //     }
    //     const confirm = await Swal.fire({
    //         title: 'Generate KPI ke Staff?',
    //         text: "KPI akan didistribusikan ke seluruh staf dengan jabatan ini.",
    //         icon: 'question',
    //         showCancelButton: true,
    //         confirmButtonText: 'Ya, Generate Sekarang',
    //         showLoaderOnConfirm: true,
    //         preConfirm: async () => {
    //             try {
    //                 const res = await axiosAuth.post(`/kpi/global-templates/${templateId}/generate`);
    //                 return res.data;
    //             } catch (error) {
    //                 Swal.showValidationMessage(`Gagal: ${error.response?.data?.message}`);
    //             }
    //         },
    //         allowOutsideClick: () => !Swal.isLoading()
    //     });
    //     if (confirm.isConfirmed) Swal.fire("Berhasil", confirm.value.message, "success");
    // };

    const handleGenerateToStaff = async () => {
        if (totalBobotKU !== 100) {
            return Swal.fire("Perhatian", `Total bobot ${totalBobotKU}%. Harus 100%.`, "warning");
        }
        
        // Tampilkan konfirmasi dengan input bulan/tahun (bisa pakai SweetAlert2 Mixin atau Modal Bootstrap)
        setShowModalGenerate(true); 
    };

    const handleSyncCategoryToStaff = async (kuId) => {
        // Ambil nama bulan untuk pesan konfirmasi yang lebih jelas
        const monthName = new Date(0, genPeriod.month - 1).toLocaleString('id-ID', { month: 'long' });

        const confirm = await Swal.fire({
            title: 'Sinkronkan Kategori?',
            text: `Kategori ini akan ditambahkan ke rapor staf periode ${monthName} ${genPeriod.year}. Pastikan rapor staf untuk periode ini sudah di-generate sebelumnya!`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Sinkronkan',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
        });

        if (confirm.isConfirmed) {
            try {
                await axiosAuth.post(`/kpi/global-templates/${templateId}/sync-category`, {
                    kinerja_utama_template_id: kuId,
                    month: genPeriod.month, // Mengambil dari state genPeriod
                    year: genPeriod.year    // Mengambil dari state genPeriod
                });
                Swal.fire("Berhasil", `Kategori telah ditambahkan ke rapor staf periode ${monthName}.`, "success");
            } catch (error) {
                Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan sistem", "error");
            }
        }
    };

    // Fungsi eksekusi setelah pilih periode
    const confirmGenerate = async () => {
        try {
            const res = await axiosAuth.post(`/kpi/global-templates/${templateId}/generate`, {
                month: genPeriod.month,
                year: genPeriod.year
            });
            Swal.fire("Berhasil", res.data.message, "success");
            setShowModalGenerate(false);
        } catch (error) {
            Swal.fire("Error", error.response?.data?.message, "error");
        }
    };

    const totalBobotKU = kinerjaUtama.reduce((acc, curr) => acc + Number(curr.bobot), 0);

    return (
        <div className="container-fluid">
            <PageTitle title="KPI Designer" breadCrumbItems={[{ label: "KPI Global", path: "/master/kpi-global/index" }, { label: "Designer", active: true }]} />

            {/* ACTION HEADER */}
            <Row className="mb-3">
                <Col className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}><FiArrowLeft /> Kembali</Button>
                        <Button variant="info" size="sm" className="text-white" onClick={() => navigate(`/master/kpi-global-templates/preview/${templateId}`)}><FiEye /> Preview</Button>
                    </div>
                    <Button variant={totalBobotKU === 100 ? "primary" : "outline-primary"} size="sm" onClick={handleGenerateToStaff} disabled={totalBobotKU !== 100}><FiSend /> Generate ke Staf</Button>
                </Col>
            </Row>

            {/* INFO CARD */}
            <Card className="bg-primary text-white border-0 shadow-sm mb-4">
                <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="mt-0">{templateInfo?.jabatan_detail?.nama_jabatan}</h4>
                        <p className="mb-0 opacity-75">Periode: {templateInfo?.periode_start} s/d {templateInfo?.periode_end}</p>
                    </div>
                    <div className="text-end">
                        <h3 className="mt-0">{totalBobotKU}% / 100%</h3>
                        <small>Total Kumulatif Bobot</small>
                    </div>
                </Card.Body>
            </Card>

            {/* STRUKTUR TABEL */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0 fw-bold">Struktur Penilaian</h5>
                <Button variant="success" size="sm" onClick={() => { setEditKUId(null); setFormKU({name:"", bobot:0}); setShowModalKU(true); }}><FiPlus /> Tambah Kategori</Button>
            </div>

            <Accordion defaultActiveKey="0">
                {kinerjaUtama.map((ku, index) => (
                    <Accordion.Item eventKey={index.toString()} key={ku.id} className="mb-3 border shadow-sm">
                        <Accordion.Header>
                            <div className="d-flex justify-content-between w-100 align-items-center pe-3">
                                <div><strong>{ku.name}</strong><Badge bg="soft-primary" className="text-primary ms-2">{ku.bobot}%</Badge></div>
                                <small className="text-muted">{ku.kpi_templates?.length || 0} Task</small>
                            </div>
                        </Accordion.Header>
                        <Accordion.Body className="p-0">
                            <div className="d-flex gap-2 p-3 bg-light border-bottom">
                                <Button 
                                    variant="outline-info" 
                                    size="sm" 
                                    onClick={() => handleSyncCategoryToStaff(ku.id)}
                                >
                                    <FiSend /> Sync Kategori
                                </Button>
                                <Button variant="outline-warning" size="sm" onClick={() => { setEditKUId(ku.id); setFormKU({name: ku.name, bobot: ku.bobot}); setShowModalKU(true); }}><FiEdit2 /> Edit Kategori</Button>
                                <Button variant="outline-danger" size="sm" onClick={() => deleteKU(ku.id)}><FiTrash /> Hapus</Button>
                                <Button variant="primary" size="sm" className="ms-auto" onClick={() => { 
                                    setActiveKUId(ku.id); 
                                    setEditTaskId(null); 
                                    setFormTask({task: "", bobot: 0, target_value: 100, rules: "", minimal_bukti: 0, evidence_type: "file", evidence_ext: "pdf,jpg,png", formula_id: "", data_source_id: "", is_required: false}); 
                                    setShowModalTask(true); 
                                }}><FiPlus /> Tambah Task</Button>
                            </div>

                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-3" style={{ width: '40%' }}>Indikator Penilaian (Task)</th>
                                        <th className="text-center">Bobot</th>
                                        <th className="text-center">Target</th>
                                        <th className="text-center">Source</th>
                                        <th className="text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ku.kpi_templates?.length > 0 ? (
                                        ku.kpi_templates.map(task => (
                                            <tr key={task.id}>
                                                <td className="ps-3">
                                                    <div className="fw-medium text-dark">{task.task}</div>
                                                    {task.rules && <small className="text-muted d-block mt-1"><FiInfo className="me-1" />{task.rules}</small>}
                                                </td>
                                                <td className="text-center fw-bold text-primary">{task.bobot}%</td>
                                                <td className="text-center">{task.target_value}</td>
                                                <td className="text-center">
                                                    <Badge bg={task.data_source_id ? "soft-info" : "soft-secondary"} className={task.data_source_id ? "text-info" : "text-secondary"}>
                                                        {helpers.data_sources.find(ds => ds.id === task.data_source_id)?.name || "Input Manual"}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <Button variant="link" className="text-warning p-0 me-3" onClick={() => handleEditTask(task)}><FiEdit2 size={16}/></Button>
                                                    <Button variant="link" className="text-danger p-0" onClick={() => deleteTask(task.id)}><FiTrash size={16}/></Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="text-center text-muted py-4">Belum ada indikator.</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>

            {/* MODAL KATEGORI */}
            <Modal show={showModalKU} onHide={() => setShowModalKU(false)}>
                <Modal.Header closeButton className="bg-light"><Modal.Title>{editKUId ? 'Edit' : 'Tambah'} Kategori</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Nama Kategori</Form.Label>
                        <Form.Control value={formKU.name} onChange={e => setFormKU({...formKU, name: e.target.value})} placeholder="Contoh: Key Result Area" />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fw-bold">Bobot (%)</Form.Label>
                        <Form.Control type="number" value={formKU.bobot} onChange={e => setFormKU({...formKU, bobot: e.target.value})} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-light"><Button variant="primary" onClick={handleSaveKU} className="w-100">Simpan Kategori</Button></Modal.Footer>
            </Modal>

            {/* MODAL TASK (INDIKATOR) - MODEL KEDUA SESUAI PERMINTAAN */}
            <Modal show={showModalTask} onHide={() => setShowModalTask(false)} size="lg" backdrop="static">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>{editTaskId ? 'Edit' : 'Tambah'} Indikator Penilaian</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Deskripsi Task / Indikator</Form.Label>
                        <Form.Control as="textarea" rows={2} value={formTask.task} onChange={e => setFormTask({...formTask, task: e.target.value})} placeholder="Tuliskan indikator pencapaian..." />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-primary">Panduan / Aturan Bukti (Rules)</Form.Label>
                        <Form.Control as="textarea" rows={2} value={formTask.rules} onChange={e => setFormTask({...formTask, rules: e.target.value})} placeholder="Contoh: Lampirkan link dokumen atau screenshot laporan..." />
                    </Form.Group>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Label className="fw-bold">Bobot (%)</Form.Label>
                            <Form.Control type="number" value={formTask.bobot} onChange={e => setFormTask({...formTask, bobot: e.target.value})} />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="fw-bold">Target Value</Form.Label>
                            <Form.Control type="number" value={formTask.target_value} onChange={e => setFormTask({...formTask, target_value: e.target.value})} />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="fw-bold">Min. Bukti</Form.Label>
                            <Form.Control type="number" value={formTask.minimal_bukti} onChange={e => setFormTask({...formTask, minimal_bukti: e.target.value})} />
                        </Col>
                    </Row>

                    <hr />
                    <h6 className="fw-bold mb-3 text-secondary">Konfigurasi Bukti & Sistem</h6>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Tipe Bukti</Form.Label>
                                <Form.Select value={formTask.evidence_type} onChange={e => setFormTask({...formTask, evidence_type: e.target.value})}>
                                    <option value="file">File Upload (PDF/JPG)</option>
                                    <option value="link">Link / URL</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Ekstensi (Pisahkan dengan koma)</Form.Label>
                                <Form.Control value={formTask.evidence_ext} onChange={e => setFormTask({...formTask, evidence_ext: e.target.value})} placeholder="pdf,jpg,png" />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Formula Perhitungan</Form.Label>
                            <Form.Select value={formTask.formula_id} onChange={e => setFormTask({...formTask, formula_id: e.target.value})}>
                                <option value="">Pilih Formula</option>
                                {helpers.formulas.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Sumber Data</Form.Label>
                            <Form.Select value={formTask.data_source_id} onChange={e => setFormTask({...formTask, data_source_id: e.target.value})}>
                                <option value="">Input Manual (Bukti User)</option>
                                {helpers.data_sources.map(ds => <option key={ds.id} value={ds.id}>{ds.name} (Sistem)</option>)}
                            </Form.Select>
                        </Col>
                    </Row>

                    <Form.Check 
                        type="switch"
                        id="required-switch"
                        label="Wajib mengunggah bukti untuk indikator ini"
                        checked={formTask.is_required}
                        onChange={e => setFormTask({...formTask, is_required: e.target.checked})}
                        className="mt-2"
                    />
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowModalTask(false)}>Batal</Button>
                    <Button variant="primary" onClick={handleSaveTask}>Simpan Indikator</Button>
                </Modal.Footer>
            </Modal>

            {/* MODAL GENERATE PERIODE */}
            <Modal show={showModalGenerate} onHide={() => setShowModalGenerate(false)} centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>Pilih Periode Penilaian</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted small">
                        KPI akan digenerate untuk seluruh staf dengan jabatan <strong>{templateInfo?.jabatan_detail?.nama_jabatan}</strong>.
                    </p>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Bulan</Form.Label>
                                <Form.Select 
                                    value={genPeriod.month} 
                                    onChange={e => setGenPeriod({...genPeriod, month: parseInt(e.target.value)})}
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i+1} value={i+1}>
                                            {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Tahun</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    value={genPeriod.year} 
                                    onChange={e => setGenPeriod({...genPeriod, year: parseInt(e.target.value)})}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowModalGenerate(false)}>Batal</Button>
                    <Button variant="primary" onClick={confirmGenerate}>
                        <FiSend className="me-1" /> Proses Generate
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default KpiGlobalDetail;