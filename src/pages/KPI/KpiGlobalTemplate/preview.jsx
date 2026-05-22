import { useEffect, useState, useCallback, Fragment } from "react"; // Tambahkan Fragment di sini
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Table, Button, Badge, Spinner, Row, Col } from "react-bootstrap";
import { FiArrowLeft, FiPrinter } from "react-icons/fi";
import PageTitle from "../../../components/PageTitle";

const KpiGlobalPreview = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [templateInfo, setTemplateInfo] = useState(null);

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("authToken");

    const loadPreviewData = useCallback(async () => {
        try {
            setLoading(true);
            const axiosAuth = axios.create({
                baseURL: baseUrl,
                headers: { Authorization: `Bearer ${token}` }
            });

            const [resTemp, resKU] = await Promise.all([
                axiosAuth.get(`/kpi/global-templates/${templateId}`),
                axiosAuth.get(`/kpi/kinerja-utama/template/${templateId}`)
            ]);

            setTemplateInfo(resTemp.data.data);
            setData(resKU.data.data);
        } catch (e) {
            console.error("Gagal memuat preview", e);
        } finally {
            setLoading(false);
        }
    }, [templateId, baseUrl, token]);

    useEffect(() => {
        loadPreviewData();
    }, [loadPreviewData]);

    const handlePrint = () => window.print();

    if (loading) return (
        <div className="text-center p-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Memuat Preview KPI...</p>
        </div>
    );

    const grandTotalBobot = data.reduce((acc, ku) => acc + Number(ku.bobot), 0);

    return (
        <>
            <PageTitle 
                title="Preview Rancangan KPI" 
                breadCrumbItems={[
                    { label: "KPI Global", path: "/master/kpi-global/index" },
                    { label: "Designer", path: `/master/kpi-global/detail/${templateId}` },
                    { label: "Preview", active: true }
                ]} 
            />

            <div className="d-print-none mb-4 d-flex justify-content-between">
                <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                    <FiArrowLeft className="me-1" /> Kembali ke Designer
                </Button>
                <Button variant="primary" size="sm" onClick={handlePrint}>
                    <FiPrinter className="me-1" /> Cetak / Save PDF
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    {/* Header Dokumen ala Spreadsheet */}
                    <div className="text-center mb-5">
                        <h4 className="fw-bold mb-1" style={{ letterSpacing: '1px' }}>RANCANGAN INDIKATOR KINERJA UTAMA</h4>
                        <h5 className="text-uppercase text-muted">{templateInfo?.jabatan_detail?.nama_jabatan}</h5>
                        <div style={{ borderBottom: '3px double #000', width: '100%', marginTop: '15px' }}></div>
                    </div>

                    <Row className="mb-4">
                        <Col md={6}>
                            <Table borderless size="sm" className="mb-0">
                                <tbody>
                                    <tr>
                                        <td style={{ width: '120px' }} className="fw-bold">PERIODE</td>
                                        <td>: {templateInfo?.periode_start} s/d {templateInfo?.periode_end}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-bold">JABATAN</td>
                                        <td>: {templateInfo?.jabatan_detail?.nama_jabatan}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Col>
                        <Col md={6} className="text-md-end">
                             <div className="p-2 px-3 border border-2 rounded d-inline-block bg-light">
                                <small className="d-block text-muted fw-bold">TOTAL BOBOT</small>
                                <h3 className={`m-0 fw-bold ${grandTotalBobot !== 100 ? 'text-danger' : 'text-primary'}`}>
                                    {grandTotalBobot}%
                                </h3>
                            </div>
                        </Col>
                    </Row>

                    <Table bordered className="kpi-table align-middle">
                        <thead className="text-center align-middle">
                            <tr style={{ backgroundColor: '#95b3d7' }}>
                                <th style={{ width: '50px' }}>NO</th>
                                <th style={{ width: '250px' }}>KINERJA UTAMA</th>
                                <th>KPI</th>
                                <th style={{ width: '120px' }}>BOBOT (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((ku, indexKU) => {
                                const hasTasks = ku.kpi_templates && ku.kpi_templates.length > 0;
                                const rowSpanCount = hasTasks ? ku.kpi_templates.length : 1;

                                return (
                                    <Fragment key={ku.id}>
                                        {hasTasks ? (
                                            ku.kpi_templates.map((task, indexTask) => (
                                                <tr key={task.id}>
                                                    {indexTask === 0 && (
                                                        <>
                                                            <td rowSpan={rowSpanCount} className="text-center fw-bold">{indexKU + 1}.</td>
                                                            <td rowSpan={rowSpanCount} className="fw-bold px-3">{ku.name}</td>
                                                        </>
                                                    )}
                                                    <td className="px-3">
                                                        {task.task}
                                                        {task.is_required && <Badge bg="soft-danger" className="text-danger ms-2 border border-danger small" style={{fontSize:'10px'}}>Wajib</Badge>}
                                                    </td>
                                                    <td className="text-center fw-bold">{task.bobot}%</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td className="text-center fw-bold">{indexKU + 1}.</td>
                                                <td className="fw-bold px-3">{ku.name}</td>
                                                <td className="text-center text-muted small italic">Belum ada KPI</td>
                                                <td className="text-center fw-bold">{ku.bobot}%</td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot className="fw-bold">
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                <td colSpan={3} className="text-end px-3 py-3">TOTAL BOBOT KESELURUHAN</td>
                                <td className="text-center py-3">{grandTotalBobot}%</td>
                            </tr>
                        </tfoot>
                    </Table>

                    <div className="mt-5 pt-4 d-flex justify-content-around text-center signature-section">
                        <div>
                            <p className="mb-5 fw-bold">Dibuat Oleh,</p>
                            <div className="mt-5 border-top border-dark pt-2 mx-auto" style={{ width: '180px' }}>Admin HRD</div>
                        </div>
                        <div>
                            <p className="mb-5 fw-bold">Disetujui Oleh,</p>
                            <div className="mt-5 border-top border-dark pt-2 mx-auto" style={{ width: '180px' }}>Direktur / GM</div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            <style>
                {`
                    .kpi-table thead th {
                        background-color: #b8cce4 !important;
                        border: 1px solid #000 !important;
                        color: #000 !important;
                    }
                    .kpi-table td {
                        border: 1px solid #000 !important;
                        padding: 8px 12px !important;
                        color: #000 !important;
                    }
                    .signature-section p { color: #000 !important; }
                    
                    @media print {
                        .d-print-none { display: none !important; }
                        body { background: white !important; -webkit-print-color-adjust: exact; }
                        .card { border: none !important; }
                        .kpi-table thead th { background-color: #b8cce4 !important; }
                        @page { size: portrait; margin: 1cm; }
                    }
                `}
            </style>
        </>
    );
};

export default KpiGlobalPreview;