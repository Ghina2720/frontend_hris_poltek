import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PageTitle from "@/components/PageTitle";

const KpiReportDetail = () => {
    const { scoreId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", variant: "" });
    
    const [modal, setModal] = useState({ show: false, indicator: null });
    const [evidenceModal, setEvidenceModal] = useState({ show: false, data: null });
    const [evidenceValue, setEvidenceValue] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [nominalValue, setNominalValue] = useState(""); // 1. TAMBAHKAN STATE INI

    const [isAddingAdditional, setIsAddingAdditional] = useState(false);
    const [additionalTask, setAdditionalTask] = useState("");
    const [selectedCatId, setSelectedCatId] = useState(null);

    // State tambahan untuk sinkronisasi profil sertifikat
    const [certData, setCertData] = useState({ nomor: '', masa_berlaku: '', kompetensi: '' });

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });

    const isCurrentPeriod = () => {
        if (!data?.header?.periode_start) return false;
        
        const today = new Date();
        const periodDate = new Date(data.header.periode_start);
        
        // Cek apakah bulan dan tahun sama dengan sekarang
        return (
            today.getMonth() === periodDate.getMonth() && 
            today.getFullYear() === periodDate.getFullYear()
        );
    };

    const fetchReport = async () => {
        try {
            const res = await api.get(`/kpi/report/${scoreId}`);
            setData(res.data.data);
        } catch (err) {
            setMessage({ text: "Gagal memuat detail report", variant: "danger" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [scoreId]);

    const handleSaveAdditional = async () => {
        if (!additionalTask) return;
        
        setIsSubmitting(true); // Opsional: gunakan state loading jika ingin
        try {
            await api.post('/kpi/additional-task', {
                kinerja_utama_score_id: selectedCatId,
                task: additionalTask
            });
            
            // Reset state
            setAdditionalTask("");
            setIsAddingAdditional(false);
            
            // Notifikasi sukses
            setMessage({ text: "Task tambahan berhasil ditambahkan!", variant: "success" });
            
            fetchReport(); 
        } catch (err) {
            setMessage({ text: "Gagal menambah task tambahan.", variant: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSync = async (kpiScoreId) => {
        setIsSubmitting(true);
        setMessage({ text: "", variant: "" });
        try {
            const res = await api.post(`/kpi/score/${kpiScoreId}/recalculate`);
            setMessage({ 
                text: res.data.message || "Sinkronisasi data berhasil!", 
                variant: "success" 
            });
            fetchReport();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Gagal memperbarui data sistem.";
            setMessage({ text: errorMsg, variant: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        setEvidenceValue(e.target.files[0]);
    };

    const submitEvidence = async (kpiScoreId, type, value) => {
        if (type !== 'checklist' && !value) {
            setMessage({ text: "Harap masukkan bukti yang diminta", variant: "warning" });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('kpi_score_id', kpiScoreId);
        formData.append('type', type);
        formData.append('data', value);

        if (nominalValue) formData.append('nominal_value', nominalValue);

        // Tambahkan data sertifikat ke formData jika diisi
        if (certData.nomor) formData.append('nomor_sertifikat', certData.nomor);
        if (certData.masa_berlaku) formData.append('masa_berlaku', certData.masa_berlaku);
        if (certData.kompetensi) formData.append('kompetensi_nama', certData.kompetensi);

        try {
            await api.post(`/kpi/evidence`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ text: "Berhasil! Bukti disimpan dan skor diperbarui.", variant: "success" });
            setModal({ show: false, indicator: null });
            setEvidenceValue(null);
            setCertData({ nomor: '', masa_berlaku: '', kompetensi: '' }); // Reset data sertifikat
            fetchReport(); 
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Gagal mengirim bukti.";
            setMessage({ text: errorMsg, variant: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderModalContent = () => {
        const ind = modal.indicator;
        if (!ind) return null;

        const isHybrid = ind.source_type === 'hybrid';
        const isInputOnly = ind.source_type === 'input';
        const isChecklist = ind.source_type === 'checklist';
        const isFileUpload = ['pdf', 'image', 'upload', 'file'].includes(ind.source_type);
        const isLink = ind.source_type === 'link';
        const isCertificate = ind.formula_code === 'F_CERT_PROFILE';

        // 1. TAMPILAN KHUSUS CHECKLIST
        if (isChecklist) {
            return (
                <div className="text-center py-4">
                    <i className="mdi mdi-checkbox-marked-circle-outline text-success display-4"></i>
                    <h5 className="mt-3">Konfirmasi Selesai</h5>
                    <p className="text-muted small">Tandai tugas ini sebagai selesai.</p>
                    <Button 
                        variant="success" className="w-100 mt-2 fw-bold"
                        disabled={isSubmitting}
                        onClick={() => submitEvidence(ind.id, 'checklist', 'DONE')}
                    >
                        {isSubmitting ? <Spinner animation="border" size="sm" /> : 'YA, SUDAH SELESAI'}
                    </Button>
                </div>
            );
        }

        // 2. TAMPILAN UNTUK INPUT, HYBRID, FILE, ATAU LINK
        return (
            <Form onSubmit={(e) => { e.preventDefault(); submitEvidence(ind.id, ind.source_type, evidenceValue); }}>
                <div className="bg-light p-3 mb-3 rounded border">
                    <small className="d-block fw-bold text-muted mb-1">ATURAN / PANDUAN:</small>
                    <small className="text-dark d-block">{ind.rules || "Lampirkan bukti pendukung."}</small>
                </div>

                {/* INPUT NOMINAL (Hanya muncul jika Input Only atau Hybrid) */}
                {(isInputOnly || isHybrid) && (
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold text-primary">Nominal Realisasi</Form.Label>
                        <Form.Control 
                            type="number" 
                            placeholder="Masukkan angka capaian..."
                            value={nominalValue}
                            onChange={(e) => setNominalValue(e.target.value)} 
                            required 
                        />
                        <Form.Text className="text-muted">Masukkan angka capaian target Anda.</Form.Text>
                    </Form.Group>
                )}

                {/* INPUT BUKTI (File atau Link) - Muncul jika Hybrid atau memang tipe File/Link */}
                {(isHybrid || isFileUpload || isLink) && (
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">
                            {isFileUpload || isHybrid ? 'Pilih File Bukti' : 'Masukkan Link (URL)'}
                        </Form.Label>
                        
                        {isFileUpload || isHybrid ? (
                            <Form.Control type="file" onChange={handleFileChange} required={!isHybrid} />
                        ) : (
                            <Form.Control 
                                type="url"
                                placeholder="Contoh: https://drive.google.com/..."
                                value={evidenceValue || ""} 
                                onChange={(e) => setEvidenceValue(e.target.value)} 
                                required 
                            />
                        )}
                    </Form.Group>
                )}

                {/* FORM TAMBAHAN UNTUK SERTIFIKAT */}
                {isCertificate && isFileUpload && (
                    <div className="p-3 border rounded bg-light mb-3">
                        <h6 className="mt-0 mb-3 text-primary small fw-bold text-uppercase">
                            <i className="mdi mdi-certificate me-1"></i> Informasi Sertifikat
                        </h6>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold">Nama Kompetensi</Form.Label>
                            <Form.Control 
                                type="text" size="sm" 
                                placeholder="Misal: Sertifikasi Digital Marketing"
                                value={certData.kompetensi}
                                onChange={(e) => setCertData({...certData, kompetensi: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Nomor Sertifikat</Form.Label>
                                    <Form.Control 
                                        type="text" size="sm" 
                                        value={certData.nomor}
                                        onChange={(e) => setCertData({...certData, nomor: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Masa Berlaku</Form.Label>
                                    <Form.Control 
                                        type="date" size="sm" 
                                        value={certData.masa_berlaku}
                                        onChange={(e) => setCertData({...certData, masa_berlaku: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                )}

                <div className="mt-4 d-flex gap-2">
                    <Button variant="light" className="flex-grow-1" onClick={() => setModal({show:false, indicator:null})}>Batal</Button>
                    <Button type="submit" variant="primary" className="flex-grow-1" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Simpan Bukti'}
                    </Button>
                </div>
            </Form>
        );
    };

    const renderEvidencePreview = () => {
        const ind = evidenceModal.data;
        if (!ind || !ind.evidences) return null;

        const storageBaseUrl = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage';

        return (
            <div className="table-responsive">
                <Table hover striped borderless className="align-middle">
                    <thead className="table-light small text-uppercase">
                        <tr>
                            <th style={{ width: '50px' }}>No</th>
                            <th>Tanggal & Waktu</th>
                            <th>Tipe Bukti</th>
                            <th className="text-end">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...ind.evidences].reverse().map((ev, index) => {
                            const isChecklist = ev.type === 'checklist';
                            const isLink = ev.type === 'link';
                            
                            let finalUrl = "";
                            if (isLink) {
                                finalUrl = ev.data;
                            } else if (!isChecklist) {
                                const cleanPath = ev.data?.startsWith('/') ? ev.data : `/${ev.data}`;
                                finalUrl = `${storageBaseUrl}${cleanPath}`;
                            }

                            return (
                                <tr key={ev.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <small className="text-muted">
                                            {new Date(ev.created_at).toLocaleString('id-ID')}
                                        </small>
                                    </td>
                                    <td className="fw-bold">
                                        {isChecklist ? 'Checklist' : (isLink ? 'Link / URL' : 'Dokumen/File')}
                                    </td>
                                    <td className="text-end">
                                        {isChecklist ? (
                                            <Badge bg="soft-success" className="text-success px-3 py-2">
                                                <i className="mdi mdi-check-circle me-1"></i> {ev.data}
                                            </Badge>
                                        ) : (
                                            <Button 
                                                variant="soft-primary" 
                                                size="sm" 
                                                className="px-3"
                                                onClick={() => window.open(finalUrl, '_blank')}
                                            >
                                                <i className={`mdi ${isLink ? 'mdi-link-variant' : 'mdi-open-in-new'} me-1`}></i> 
                                                {isLink ? 'Buka Link' : 'Buka File'}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        );
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <div className="container-fluid">
            {/* <PageTitle 
                breadCrumbItems={[{ label: "Monitoring KPI", path: "/kpi" }, { label: "Detail Report", active: true }]} 
                title={`Progress KPI: ${data?.header?.user_name}`} 
            /> */}

            <div className="d-flex align-items-center justify-content-between mb-3">
                <PageTitle 
                    breadCrumbItems={[
                        { label: "Monitoring KPI", path: "/kpi" }, 
                        { label: "Detail Report", active: true }
                    ]} 
                    title={`Progress KPI: ${data?.header?.user_name}`} 
                />
                <Button 
                    variant="outline-danger" 
                    className="btn-sm px-3 shadow-sm"
                    onClick={() => window.open(`/kpi/print/${scoreId}`, '_blank')}
                >
                    <i className="mdi mdi-printer-eye me-1"></i> Preview & Cetak
                </Button>
            </div>

            {!isCurrentPeriod() && data && (
                <Alert variant="warning" className="border-0 shadow-sm mb-3 py-2">
                    <i className="mdi mdi-information-outline me-2"></i>
                    Periode pengisian KPI ini telah berakhir. Anda hanya dapat melihat data (Read-Only).
                </Alert>
            )}

            <Row className="mb-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm bg-primary text-white mb-3 mb-lg-0">
                        <Card.Body className="py-3">
                            <Row className="align-items-center">
                                <Col sm={6}>
                                    <h4 className="mb-0 mt-0 text-white">{data?.header?.user_name}</h4>
                                    <small className="opacity-75">{data?.header?.nama_jabatan}</small>
                                </Col>
                                <Col sm={6} className="text-sm-end border-start border-white border-opacity-25">
                                    <p className="mb-0 opacity-75 small text-uppercase">Periode Penilaian</p>
                                    <h5 className="mb-0 mt-0 text-white">{data?.header?.periode_start} - {data?.header?.periode_end}</h5>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm bg-success text-white text-center">
                        <Card.Body className="py-3">
                            <p className="mb-1 opacity-75 small text-uppercase">Pencapaian Global</p>
                            <h2 className="mb-0 mt-0 text-white fw-bold">{data?.header?.score_total || "0.00"}%</h2>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {message.text && (
                <Alert variant={message.variant} className="border-0 shadow-sm mb-4" dismissible onClose={() => setMessage({text:"", variant:""})}>
                    {message.text}
                </Alert>
            )}

            <Row>
                {data?.categories.map((cat) => (
                    <Col key={cat.id} md={12} className="mb-4">
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                                <h5 className="mb-0 fw-bold">{cat.name}</h5>
                                <div className="d-flex gap-2">
                                    {cat.name.toLowerCase() === 'additional' && isCurrentPeriod() && (
                                        <Button 
                                            variant="soft-success" 
                                            size="sm" 
                                            onClick={() => {
                                                setSelectedCatId(cat.id);
                                                setIsAddingAdditional(true);
                                            }}
                                        >
                                            <i className="mdi mdi-plus-circle me-1"></i> Tambah Task
                                        </Button>
                                    )}
                                    <Badge bg="soft-primary" className="text-primary fs-6">Skor: {cat.realtime_score}</Badge>
                                </div>
                                {/* <Badge bg="soft-primary" className="text-primary fs-6">Skor: {cat.realtime_score}</Badge> */}
                            </Card.Header>
                            <Table responsive hover className="mb-0 align-middle">
                                <thead className="table-light small fw-bold text-muted">
                                    <tr>
                                        <th className="ps-3">INDIKATOR & TASK</th>
                                        <th className="text-center">BOBOT</th>
                                        <th className="text-center">TARGET</th>
                                        <th className="text-center">REALISASI</th>
                                        <th className="text-center">SCORE</th>
                                        <th className="text-center">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cat.indicators.map((ind) => (
                                        <tr key={ind.id}>
                                            <td className="ps-3 py-3" style={{ minWidth: '250px' }}>
                                                <div className="fw-bold text-dark">{ind.task}</div>
                                                <div className="d-flex gap-2 mt-1">
                                                    <Badge bg="soft-info" className="text-info" style={{fontSize: '9px'}}>{ind.source_type?.toUpperCase()}</Badge>
                                                    {ind.is_required && <Badge bg="soft-danger" className="text-danger" style={{fontSize: '9px'}}>WAJIB BUKTI</Badge>}
                                                </div>
                                            </td>
                                            <td className="text-center fw-bold">{ind.bobot}%</td>
                                            <td className="text-center text-muted">{ind.target_value}</td>
                                            <td className="text-center fw-bold text-primary">{ind.value || 0}</td>
                                            <td className="text-center">
                                                <Badge bg={parseFloat(ind.score) >= ind.bobot ? "success" : "warning"}>{ind.score}</Badge>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex gap-1 justify-content-center">
                                                    {ind.evidences && ind.evidences.length > 0 && (
                                                        <Button variant="soft-info" size="sm" className="rounded-pill" onClick={() => setEvidenceModal({ show: true, data: ind })}>
                                                            <i className="mdi mdi-eye me-1"></i> {ind.evidences.length}
                                                        </Button>
                                                    )}
                                                    {['api', 'system'].includes(ind.source_type) ? (
                                                        <Button 
                                                            variant={isCurrentPeriod() ? "soft-secondary" : "light"} 
                                                            size="sm" 
                                                            className="rounded-pill px-2" 
                                                            onClick={() => handleSync(ind.id)} 
                                                            // KUNCI JIKA: Sedang submitting ATAU bukan periode sekarang
                                                            disabled={isSubmitting || !isCurrentPeriod()}
                                                            style={{ cursor: !isCurrentPeriod() ? 'not-allowed' : 'pointer' }}
                                                        >
                                                            {isSubmitting ? (
                                                                <><Spinner size="sm" animation="border" className="me-1" /><small>Syncing...</small></>
                                                            ) : (
                                                                <>
                                                                    <i className={`mdi ${isCurrentPeriod() ? 'mdi-sync' : 'mdi-lock-outline'} me-1`}></i>
                                                                    <small>{isCurrentPeriod() ? 'Sync Data' : 'Locked'}</small>
                                                                </>
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        // Tombol Upload/Input Manual
                                                        <Button 
                                                            variant={isCurrentPeriod() ? "outline-primary" : "light"} 
                                                            size="sm" 
                                                            className="rounded-pill px-3" 
                                                            onClick={() => {setEvidenceValue(null); setModal({ show: true, indicator: ind });}}
                                                            // KUNCI JIKA: Bukan periode sekarang
                                                            disabled={!isCurrentPeriod()}
                                                        >
                                                            {isCurrentPeriod() ? (
                                                                ind.source_type === 'checklist' ? 'Selesaikan' : (ind.source_type === 'link' ? 'Input Link' : 'Upload')
                                                            ) : (
                                                                <><i className="mdi mdi-lock-outline me-1"></i>Selesai</>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal show={modal.show} onHide={() => !isSubmitting && setModal({ show: false, indicator: null })} centered>
                <Modal.Header closeButton={!isSubmitting}>
                    <Modal.Title className="fs-6 fw-bold">Update Bukti Realisasi</Modal.Title>
                </Modal.Header>
                <Modal.Body>{renderModalContent()}</Modal.Body>
            </Modal>

            <Modal show={evidenceModal.show} onHide={() => setEvidenceModal({ show: false, data: null })} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6 fw-bold">Daftar Bukti Terkirim</Modal.Title>
                </Modal.Header>
                <Modal.Body>{renderEvidencePreview()}</Modal.Body>
            </Modal>

            {/* MODAL TAMBAH TASK ADDITIONAL */}
            <Modal show={isAddingAdditional} onHide={() => setIsAddingAdditional(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6 fw-bold">Tambah Task Tambahan</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={(e) => { e.preventDefault(); handleSaveAdditional(); }}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Nama Indikator / Task</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Misal: Mengikuti Pelatihan Internal..." 
                                value={additionalTask}
                                onChange={(e) => setAdditionalTask(e.target.value)}
                                required
                                autoFocus
                            />
                            <Form.Text className="text-muted">
                                Task ini akan memiliki bobot 0% secara otomatis.
                            </Form.Text>
                        </Form.Group>
                        <div className="d-flex gap-2 justify-content-end">
                            <Button variant="light" onClick={() => setIsAddingAdditional(false)}>Batal</Button>
                            <Button variant="primary" type="submit" disabled={!additionalTask}>
                                Simpan Task
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default KpiReportDetail;