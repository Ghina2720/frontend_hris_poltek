import React, { useEffect, useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Table, Spinner, Button, Card } from "react-bootstrap";
import { FiPrinter, FiArrowLeft } from "react-icons/fi";
import axios from "axios";

const KpiPrintPreview = () => {
    const { scoreId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });

    useEffect(() => {
        api.get(`/kpi/report/${scoreId}`)
            .then(res => setData(res.data.data))
            .finally(() => setLoading(false));
    }, [scoreId]);

    const formatPeriode = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
            <Spinner animation="border" style={{ color: '#1b5e20' }} />
        </div>
    );

    return (
        <div className="kpi-viewer bg-light min-vh-100">
            {/* ACTION BAR - HIDDEN ON PRINT */}
            <div className="d-print-none bg-white border-bottom sticky-top py-3 shadow-sm">
                <Container fluid className="px-4 d-flex justify-content-between align-items-center">
                    <Button variant="outline-dark" size="sm" onClick={() => navigate(-1)}>
                        <FiArrowLeft className="me-1" /> Kembali
                    </Button>
                    <div className="text-center">
                        <h6 className="mb-0 fw-bold text-success">PREVIEW MODE: ACHIEVEMENT REPORT</h6>
                    </div>
                    <Button size="sm" style={{ backgroundColor: '#1b5e20', border: 'none' }} onClick={() => window.print()}>
                        <FiPrinter className="me-1" /> Cetak Laporan
                    </Button>
                </Container>
            </div>

            {/* DOCUMENT CONTAINER */}
            <Container fluid className="py-4 py-md-5 px-md-5">
                <Card className="border-0 shadow-lg mx-auto kpi-paper">
                    <Card.Body className="p-4 p-md-5">
                        
                        {/* HEADER PERUSAHAAN */}
                        <div className="d-flex justify-content-between align-items-end mb-1">
                            <div>
                                <h1 className="fw-black mb-0" style={{ fontSize: '3rem', letterSpacing: '-2px', color: '#1b5e20', lineHeight: '1' }}>
                                    SYNTAX
                                </h1>
                                <p className="fw-bold mb-0 text-muted small" style={{ letterSpacing: '4px' }}>CORPORATION INDONESIA</p>
                            </div>
                            <div className="text-end">
                                <h4 className="fw-bold mb-0 text-dark">KEY PERFORMANCE INDICATOR</h4>
                                <h5 className="fw-bold mb-0 text-success">ACHIEVEMENT REPORT</h5>
                                <p className="text-muted fw-bold mb-0 small text-uppercase">Periode {formatPeriode(data?.header?.periode_start)}</p>
                            </div>
                        </div>

                        <div className="divider-syntax mb-5"></div>

                        {/* INFO KARYAWAN - TABEL STABIL */}
                        <table className="table table-bordered mb-5 info-table-print">
                            <tbody>
                                <tr>
                                    <td className="bg-light-syntax fw-bold small text-muted p-3" width="15%">NAMA</td>
                                    <td className="p-3 fw-bold fs-5" width="45%">{data?.header?.user_name}</td>
                                    <td className="bg-light-syntax fw-bold small text-muted p-3 text-center" width="40%">
                                        TOTAL ACHIEVEMENT SCORE
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-light-syntax fw-bold small text-muted p-3">JABATAN</td>
                                    <td className="p-3 fw-bold text-uppercase">{data?.header?.nama_jabatan}</td>
                                    <td className="p-1 fw-black text-success text-center align-middle" style={{ fontSize: '2.5rem' }}>
                                        {data?.header?.score_total}%
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* TABEL UTAMA KPI */}
                        <div className="table-responsive">
                            <Table bordered className="kpi-table-professional align-middle">
                                <thead>
                                    <tr className="bg-dark text-white text-center small fw-bold">
                                        <th width="50" className="border-dark py-3">NO</th>
                                        <th className="border-dark py-3 text-start ps-3">KPI INDICATOR ITEMS</th>
                                        <th width="80" className="border-dark py-3">WEIGHT</th>
                                        <th width="100" className="border-dark py-3">TARGET</th>
                                        <th width="100" className="border-dark py-3">ACTUAL</th>
                                        <th width="100" className="bg-success border-success py-3">SCORE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.categories.map((cat, idx) => (
                                        <Fragment key={cat.id}>
                                            <tr className="bg-success-subtle fw-bold">
                                                <td className="text-center">{String.fromCharCode(65 + idx)}</td>
                                                <td colSpan={4} className="py-2 ps-3 text-uppercase text-success">{cat.name}</td>
                                                <td className="text-center border-dark bg-white text-dark">{cat.realtime_score}</td>
                                            </tr>
                                            {cat.indicators.map((ind, iIdx) => (
                                                <tr key={ind.id} className="indicator-row">
                                                    <td className="text-center text-muted small">{iIdx + 1}</td>
                                                    <td className="px-3 fw-bold text-dark">{ind.task}</td>
                                                    <td className="text-center">{ind.bobot}%</td>
                                                    <td className="text-center text-muted">{ind.target_value}</td>
                                                    <td className="text-center fw-bold text-dark">{ind.value || 0}</td>
                                                    <td className="text-center fw-black text-dark bg-light">{ind.score}</td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-top-2 border-dark">
                                        <td colSpan={5} className="text-end py-3 px-4 fw-black h6 mb-0 bg-light-syntax uppercase">Grand Total KPI Achievement</td>
                                        <td className="text-center py-3 h4 fw-black text-success bg-light-syntax border-dark">{data?.header?.score_total}%</td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>

                        {/* SIGNATURE SECTION */}
                        <div className="mt-5 pt-4">
                            <table className="w-100 text-center border-0 mt-5 signature-table">
                                <tbody>
                                    <tr className="small text-muted fw-bold text-uppercase">
                                        <td width="33%">Prepared By,</td>
                                        <td width="33%">Reviewed By,</td>
                                        <td width="33%">Authorized By,</td>
                                    </tr>
                                    <tr>
                                        <td className="signature-height"></td>
                                        <td className="signature-height"></td>
                                        <td className="signature-height"></td>
                                    </tr>
                                    <tr className="fw-bold text-dark fs-6">
                                        <td><span className="border-top border-dark px-4 pt-1 text-uppercase">{data?.header?.user_name}</span></td>
                                        <td><span className="border-top border-dark px-4 pt-1">DIRECT MANAGER</span></td>
                                        <td><span className="border-top border-dark px-4 pt-1">HRD / DIRECTOR</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card.Body>
                </Card>
            </Container>

            <style>{`
                .kpi-paper { max-width: 1100px; border-radius: 0 !important; }
                .fw-black { font-weight: 900; }
                .divider-syntax { height: 4px; background: linear-gradient(to right, #1b5e20, #28a745, #fff); width: 100%; }
                .bg-light-syntax { background-color: #f8fcf8 !important; }
                .bg-success-subtle { background-color: #e8f5e9 !important; }
                
                .info-table-print td { border: 1px solid #333 !important; vertical-align: middle; }
                
                .kpi-table-professional td, .kpi-table-professional th {
                    border: 1px solid #333 !important;
                    padding: 12px 10px !important;
                }
                
                .signature-height { height: 90px; }
                .signature-table td { border: none !important; }
                .uppercase { text-transform: uppercase; letter-spacing: 1px; }

                @media print {
                    .d-print-none { display: none !important; }
                    body { background: #fff !important; }
                    .kpi-paper { box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; }
                    .container-fluid { padding: 0 !important; }
                    
                    .bg-dark { background-color: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
                    .bg-success { background-color: #1b5e20 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
                    .bg-success-subtle { background-color: #e8f5e9 !important; -webkit-print-color-adjust: exact; }
                    .bg-light-syntax { background-color: #f8fcf8 !important; -webkit-print-color-adjust: exact; }
                    .text-success { color: #1b5e20 !important; }
                    
                    @page { size: A4 portrait; margin: 15mm; }
                }
            `}</style>
        </div>
    );
};

export default KpiPrintPreview;