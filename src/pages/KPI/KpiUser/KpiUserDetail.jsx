import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, Table, Badge, Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PageTitle from "@/components/PageTitle";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import Swal from "sweetalert2";

const KpiUserDetail = () => {
    const { user, hasPermission } = useAuthContext();
    const canDelete = hasPermission("Payroll.update");
    
    const { userId } = useParams();
    const navigate = useNavigate();
    const [kpiHistory, setKpiHistory] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accessChecked, setAccessChecked] = useState(false);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });

    /* ======================= LOGIKA PROTEKSI AKSES ======================= */
    useEffect(() => {
        if (user && userId) {
            const currentUserId = parseInt(userId);
            const loggedInUserId = user.id;
            const userRoleName = user.role?.name;

            // Definisi role yang boleh akses semua detail user
            const isAdmin = userRoleName === "Admin" || userRoleName === "Superadmin" || userRoleName === "Direktur";
            const isSameUser = currentUserId === loggedInUserId;

            if (!isAdmin && !isSameUser) {
                Swal.fire({
                    title: "Akses Ditolak",
                    text: "Anda tidak memiliki izin untuk melihat rapor orang lain!",
                    icon: "error",
                    confirmButtonColor: "#d33",
                }).then(() => {
                    navigate(-1); // Kembali ke halaman sebelumnya
                });
                return;
            }
            setAccessChecked(true); // Lolos pengecekan
        }
    }, [user, userId, navigate]);

    /* ======================= FETCH DATA ======================= */
    useEffect(() => {
        // Hanya jalankan fetch jika akses sudah terverifikasi
        if (!accessChecked) return;

        const init = async () => {
            try {
                setLoading(true);
                
                // 1. Ensure current KPI data
                try {
                    await api.post(`/kpi/user/${userId}/ensure-current`);
                } catch (err) {
                    console.warn("Ensure KPI failed:", err?.response?.data);
                }

                // 2. Fetch data paralel
                const [resUser, resKpi] = await Promise.all([
                    api.get(`/users/${userId}`),
                    api.get(`/kpi/user-scores/${userId}`)
                ]);

                setUserData(resUser.data.data || resUser.data);
                setKpiHistory(resKpi.data.data || []);

            } catch (err) {
                console.error(err);
                setError("Gagal memuat data performa.");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [userId, accessChecked]); // Tambahkan accessChecked sebagai dependency

    // Fungsi format tanggal Indonesia
    const formatPeriode = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus riwayat KPI ini?")) {
            try {
                await api.delete(`/kpi/global-scores/${id}`);
                setKpiHistory(kpiHistory.filter(item => item.id !== id));
                alert("Data berhasil dihapus");
            } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || "Gagal menghapus data.");
            }
        }
    };

    // Tampilkan loading jika akses sedang dicek ATAU data sedang diambil
    if (!accessChecked || loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <>
            <PageTitle 
                breadCrumbItems={[
                    { label: "KPI Board", path: `/kpi/monitoring/holding/${userData?.holding_id}/board` },
                    { label: "Detail Performa", active: true }
                ]} 
                title={
                    <div className="d-flex align-items-center gap-2">
                        <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>←</Button>
                        <span>Rapor KPI: {userData?.name}</span>
                    </div>
                } 
            />

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <Table responsive hover className="align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Periode</th>
                                <th>Jabatan</th>
                                <th>Status</th>
                                <th className="text-center">Total Score</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kpiHistory.length > 0 ? (
                                kpiHistory.map((item) => (
                                    <tr key={item.id}>
                                        <td className="fw-bold">{formatPeriode(item.periode_start)}</td>
                                        <td>{item.nama_jabatan}</td>
                                        <td>
                                            <Badge bg={item.status === 'published' ? 'success' : 'secondary'}>
                                                {item.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="text-center fw-bold text-primary">
                                            {parseFloat(item.score_total).toFixed(2)}
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center gap-1">
                                                <Button 
                                                    variant="soft-primary" 
                                                    size="sm"
                                                    onClick={() => navigate(`/kpi/report/${item.id}`)}
                                                >
                                                    Buka Report
                                                </Button>
                                                
                                                {canDelete && item.status !== 'published' && (
                                                    <Button 
                                                        variant="soft-danger" 
                                                        size="sm"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        Hapus
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">Belum ada data riwayat KPI.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </>
    );
};

export default KpiUserDetail;