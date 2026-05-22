import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Card, Col, Row, Button, Modal, Form, Spinner, 
  Badge, Accordion, ListGroup, Tab, Nav, Image
} from "react-bootstrap";
import { 
  FaEdit, FaTrash, FaPlus, FaFilePdf, FaFileExcel, FaKey, 
  FaExclamationTriangle, FaTimes, FaSkullCrossbones, FaChevronDown, 
  FaChevronUp, FaUser, FaEnvelope, FaBuilding, FaBriefcase, FaStar,
  FaIdCard, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaHeart, FaPray,
  FaVenusMars, FaRing, FaFile, FaDownload, FaEye, FaInfoCircle,
  FaGraduationCap, FaAddressCard, FaFilePdf as FaFilePdfIcon,
  FaFileImage, FaFileAlt,FaUsers, FaCertificate
} from "react-icons/fa";
import * as XLSX from 'xlsx';

import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import Swal from 'sweetalert2';

import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import AsyncSelect from 'react-select/async';

// =============================
// 🔧 Konfigurasi Axios + Token
// =============================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Ambil token login dari localStorage
const token = localStorage.getItem("authToken");

// Buat instance axios khusus agar tidak ke-intercept oleh mock adapter
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

// Helper: normalisasi bentuk data API yang berbeda-beda
const normalizePayload = (payload, keyFallbacks = []) => {
  if (Array.isArray(payload)) return payload;
  for (const k of ["data", "message", ...keyFallbacks]) {
    if (payload && payload[k]) return payload[k];
  }
  return [];
};

const emptyForm = {
  id: null,
  name: "",
  nama_absen: "",
  email: "",
  role_id: "",
  holding_id: "",
  jabatan_id: "",
  jabatan_details_id: "",
  status_talent_id: "",
  password: "",
  foto: null,
  fotoPreview: "",
  minimal_ngaji: "",
};


const UserDetailModal = ({ show, onHide, user }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
  const storageURL = `${baseURL}/storage/`;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'aktif': return 'Aktif';
      case 'nonaktif': return 'Non Aktif';
      case 'cuti': return 'Cuti';
      case 'resign': return 'Resign';
      default: return '-';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'aktif':
        return <Badge bg="success">Aktif</Badge>;
      case 'nonaktif':
        return <Badge bg="danger">Non Aktif</Badge>;
      case 'cuti':
        return <Badge bg="warning">Cuti</Badge>;
      case 'resign':
        return <Badge bg="secondary">Resign</Badge>;
      default:
        return <Badge bg="secondary">-</Badge>;
    }
  };

  const DocumentView = ({ label, docPath }) => {
    const hasDoc = !!docPath;
    
    return (
      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
        <span className="text-muted">{label}</span>
        {hasDoc ? (
          <Button
            variant="link"
            size="sm"
            className="p-0 text-decoration-none"
            onClick={() => window.open(`${storageURL}${docPath}`, '_blank')}
          >
            <FaEye className="me-1" size={14} /> Lihat
          </Button>
        ) : (
          <span className="text-muted">-</span>
        )}
      </div>
    );
  };

  const KompetensiView = ({ kompetensi }) => {
    if (!kompetensi?.length) {
      return <p className="text-muted text-center py-3">Belum ada data kompetensi</p>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Kompetensi</th>
              <th>Sertifikat</th>
              <th>No. Sertifikat</th>
              <th>Masa Berlaku</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {kompetensi.map((k, idx) => (
              <tr key={idx}>
                <td className="fw-medium">{k.kompetensi}</td>
                <td>{k.nama_sertifikat}</td>
                <td>{k.nomor_sertifikat || '-'}</td>
                <td>{formatDate(k.masa_berlaku)}</td>
                <td>
                  {k.file_sertifikat ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => window.open(`${storageURL}${k.file_sertifikat}`, '_blank')}
                    >
                      <FaFilePdf size={16} className="text-danger" />
                    </Button>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const KaderisasiView = ({ kaderisasi }) => {
    if (!kaderisasi?.length) {
      return <p className="text-muted text-center py-3">Belum ada data kaderisasi</p>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Training</th>
              <th>Penyelenggara</th>
              <th>Tanggal</th>
              <th>Hasil</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {kaderisasi.map((k, idx) => (
              <tr key={idx}>
                <td className="fw-medium">{k.nama_training}</td>
                <td>{k.penyelenggara || '-'}</td>
                <td>{formatDate(k.tanggal_training)}</td>
                <td>{k.hasil || '-'}</td>
                <td>
                  {k.sertifikat ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => window.open(`${storageURL}${k.sertifikat}`, '_blank')}
                    >
                      <FaFilePdf size={16} className="text-danger" />
                    </Button>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ===== KOMPONEN BARU: Riwayat Pekerjaan View =====
  const PekerjaanView = ({ pekerjaan }) => {
    if (!pekerjaan?.length) {
      return <p className="text-muted text-center py-3">Belum ada riwayat pekerjaan</p>;
    }

    // Urutkan dari tanggal transisi terbaru
    const sortedPekerjaan = [...pekerjaan].sort((a, b) => 
      new Date(b.tanggal_transisi) - new Date(a.tanggal_transisi)
    );

    return (
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead className="bg-light">
            <tr>
              <th>No</th>
              <th>Holding</th>
              <th>Jabatan</th>
              <th>Detail Jabatan</th>
              <th>Status Talent</th>
              <th>Tanggal Transisi</th>
              <th>Tanggal Keluar</th>
            </tr>
          </thead>
          <tbody>
            {sortedPekerjaan.map((p, idx) => (
              <tr key={p.id || idx}>
                <td>{idx + 1}</td>
                <td>
                  <Badge bg="info" className="me-1">
                    {p.holding?.name || '-'}
                  </Badge>
                </td>
                <td className="fw-semibold">{p.jabatan?.nama_jabatan || '-'}</td>
                <td>
                  {p.jabatan_detail ? (
                    <span className="text-muted">{p.jabatan_detail.nama_jabatan}</span>
                  ) : p.keterangan_jabatan ? (
                    <span className="text-muted">{p.keterangan_jabatan}</span>
                  ) : '-'}
                </td>
                <td>
                  {p.status_talent && (
                    <Badge bg="secondary">{p.status_talent.nama}</Badge>
                  )}
                </td>
               
                <td>
                  <div className="d-flex align-items-center">
                    <FaCalendarAlt className="text-muted me-1" size={10} />
                    <small>{formatDate(p.tanggal_transisi)}</small>
                  </div>
                </td>
                <td>
                  {p.tanggal_keluar ? (
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="text-muted me-1" size={10} />
                      <small>{formatDate(p.tanggal_keluar)}</small>
                    </div>
                  ) : (
                    <Badge bg="success" pill className="px-2">Masih Aktif</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="user-detail-modal">
      <Modal.Header closeButton className="bg-light border-bottom">
        <Modal.Title className="fs-5">
          <FaUser className="me-2 text-primary" />
          Detail User: {user.name}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        {/* Header Info */}
        <div className="d-flex gap-4 mb-4 pb-3 border-bottom">
          <Image
            src={user.foto ? `${storageURL}${user.foto}` : "/default-avatar.png"}
            roundedCircle
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
          />
          <div>
            <h5 className="fw-bold mb-1">{user.name}</h5>
            <p className="text-muted small mb-2">{user.email}</p>
            <div className="d-flex gap-3 small flex-wrap">
              <span><span className="text-muted me-1">Jabatan:</span> {user.jabatan?.nama_jabatan || '-'}</span>
              <span><span className="text-muted me-1">Holding:</span> {user.holding?.name || '-'}</span>
              <span><span className="text-muted me-1">Status:</span> {getStatusText(user.status_aktif)}</span>
            </div>
          </div>
        </div>

        {/* Tabs - TAMBAHKAN TAB PEKERJAAN */}
        <Tab.Container defaultActiveKey="personal">
          <Nav variant="tabs" className="mb-3 border-bottom flex-wrap">
            <Nav.Item>
              <Nav.Link eventKey="personal" className="border-0">Data Personal</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="pekerjaan" className="border-0">Riwayat Pekerjaan</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="documents" className="border-0">Dokumen</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="education" className="border-0">Pendidikan</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="kompetensi" className="border-0">Kompetensi</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="kaderisasi" className="border-0">Kaderisasi</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* Tab Data Personal (TETAP) */}
            <Tab.Pane eventKey="personal">
              <Row>
                <Col md={6}>
                  <h6 className="fw-semibold mb-3">Informasi Pribadi</h6>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">NIK</span>
                      <span>{user.nik || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Nama Panggilan</span>
                      <span>{user.nama_panggilan || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Jenis Kelamin</span>
                      <span>{user.jenis_kelamin || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Tempat Lahir</span>
                      <span>{user.tempat_lahir || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Tanggal Lahir</span>
                      <span>{formatDate(user.tanggal_lahir)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Status Pernikahan</span>
                      <span>{user.status_pernikahan || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Agama</span>
                      <span>{user.agama || '-'}</span>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <h6 className="fw-semibold mb-3">Kontak & Legal</h6>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">No. KTP</span>
                      <span>{user.no_ktp || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">NPWP</span>
                      <span>{user.no_npwp || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">BPJS Kesehatan</span>
                      <span>{user.bpjs_kesehatan || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">BPJS Ketenagakerjaan</span>
                      <span>{user.bpjs_ketenagakerjaan || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">No. HP</span>
                      <span>{user.no_hp || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Alamat</span>
                      <span>{user.alamat_lengkap || '-'}</span>
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <h6 className="fw-semibold mb-3 mt-2">Pekerjaan Saat Ini</h6>
                  <Row>
                    <Col md={3}>
                      <div className="mb-2">
                        <small className="text-muted d-block">Holding</small>
                        <span>{user.holding?.name || '-'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-2">
                        <small className="text-muted d-block">Jabatan</small>
                        <span>{user.jabatan?.nama_jabatan || '-'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-2">
                        <small className="text-muted d-block">Status Talent</small>
                        <span>{user.status_talent?.nama || '-'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-2">
                        <small className="text-muted d-block">Status Aktif</small>
                        <span>{getStatusText(user.status_aktif)}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-2">
                        <small className="text-muted d-block">Tanggal Masuk</small>
                        <span>{formatDate(user.tanggal_masuk)}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-2">
                        <small className="text-muted d-block">Minimal Ngaji</small>
                        <span>{user.minimal_ngaji || '-'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-2">
                        <small className="text-muted d-block">Nama Absen</small>
                        <span>{user.nama_absen || '-'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-2">
                        <small className="text-muted d-block">Role</small>
                        <span>{user.role?.name || '-'}</span>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Tab.Pane>

            {/* TAB BARU: Riwayat Pekerjaan */}
            <Tab.Pane eventKey="pekerjaan">
              <h6 className="fw-semibold mb-3">Riwayat Pekerjaan</h6>
              <PekerjaanView pekerjaan={user.pekerjaan} />
            </Tab.Pane>

            {/* Tab Dokumen (TETAP) */}
            <Tab.Pane eventKey="documents">
              <Row>
                <Col md={6}>
                  <DocumentView label="KTP" docPath={user.ktp} />
                  <DocumentView label="Kartu Keluarga" docPath={user.kk} />
                  <DocumentView label="NPWP" docPath={user.npwp} />
                  <DocumentView label="Ijazah" docPath={user.ijazah} />
                </Col>
                <Col md={6}>
                  <DocumentView label="Sertifikat" docPath={user.sertifikat} />
                  <DocumentView label="Kontrak Kerja" docPath={user.kontrak_kerja} />
                  <DocumentView label="CV" docPath={user.cv} />
                </Col>
              </Row>
            </Tab.Pane>

            {/* Tab Pendidikan (TETAP) */}
            <Tab.Pane eventKey="education">
              {user.pendidikan?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Pendidikan</th>
                        <th>Sekolah/Kampus</th>
                        <th>Jurusan</th>
                        <th>Tahun Lulus</th>
                        <th>Ijazah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.pendidikan.map((p, idx) => (
                        <tr key={idx}>
                          <td className="fw-medium">{p.riwayat_pendidikan}</td>
                          <td>{p['sekolah/kampus'] || '-'}</td>
                          <td>{p.jurusan || '-'}</td>
                          <td>{p['tahun lulus'] || '-'}</td>
                          <td>
                            {p.sertifikat ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0"
                                onClick={() => window.open(`${storageURL}${p.sertifikat}`, '_blank')}
                              >
                                <FaFilePdf size={16} className="text-danger" />
                              </Button>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center py-3">Belum ada data pendidikan</p>
              )}
            </Tab.Pane>

            {/* Tab Kompetensi (TETAP) */}
            <Tab.Pane eventKey="kompetensi">
              <KompetensiView kompetensi={user.kompetensi} />
            </Tab.Pane>

            {/* Tab Kaderisasi (TETAP) */}
            <Tab.Pane eventKey="kaderisasi">
              <KaderisasiView kaderisasi={user.kaderisasi} />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="light" onClick={onHide} className="px-4">
          Tutup
        </Button>
      </Modal.Footer>

      <style jsx>{`
        .user-detail-modal .nav-tabs .nav-link {
          color: #495057;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }
        .user-detail-modal .nav-tabs .nav-link.active {
          color: #0d6efd;
          font-weight: 500;
          border-bottom: 2px solid #0d6efd;
          background: transparent;
        }
        .user-detail-modal .nav-tabs .nav-link:hover {
          color: #0d6efd;
          background: transparent;
        }
        .table th {
          font-weight: 500;
          color: #6c757d;
          border-bottom-width: 1px;
        }
        .table td {
          border-bottom: 1px solid #dee2e6;
        }
      `}</style>
    </Modal>
  );
};

const Advanced = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const { hasPermission } = useAuthContext(); 

  const [erpOptions, setErpOptions] = useState([]);
  const [jabatanDetails, setJabatanDetails] = useState([]);

  // State untuk modal detail
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // lookups (untuk select dropdown)
  const [roles, setRoles] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [statusTalents, setStatusTalents] = useState([]);

  // modal & form
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // delete
  const [deletingId, setDeletingId] = useState(null);
  const [resettingAll, setResettingAll] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const [resettingPoin, setResettingPoin] = useState(false);
  
  // State untuk view mode (desktop vs mobile)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fetchErpData = async () => {
      try {
        // Gunakan instance 'api' (baris 40), bukan 'axios' langsung
        const response = await api.get('/erp-marketing'); 
        setErpOptions(response.data);
      } catch (error) {
        console.error("Gagal memuat data ERP:", error);
      }
    };

    fetchErpData();
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================
  // 🧭 FETCH DATA AWAL
  // =============================
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [usersRes, rolesRes, holdingsRes, jabatansRes, statusRes, detailsRes] = await Promise.all([
          api.get("/users?with=pekerjaan"), 
          api.get("/roles").catch(() => ({ data: [] })),
          api.get("/holdings").catch(() => ({ data: [] })),
          api.get("/jabatans").catch(() => ({ data: [] })),
          api.get("/status-talent").catch(() => ({ data: [] })),
          api.get("/jabatan-details"),
        ]);

        const users = normalizePayload(usersRes.data, ["users"]);
        setData(users);

        setRoles(normalizePayload(rolesRes.data));
        setHoldings(normalizePayload(holdingsRes.data));
        setJabatans(normalizePayload(jabatansRes.data));
        setStatusTalents(normalizePayload(statusRes.data));
        setJabatanDetails(normalizePayload(detailsRes.data));
      } catch (e) {
        console.error("Error fetching initial data:", e);
        setErr(e?.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadErpOptions = async (inputValue) => {
    try {
      // Panggil API Laravel kita dengan param search
      const response = await api.get(`/erp-marketing?search=${inputValue}`);
      return response.data; // Harus return array [{value, label}, ...]
    } catch (error) {
      return [];
    }
  };

  const handleResetPoinTahunan = async () => {
    const confirm = await Swal.fire({
      title: "Reset Poin Tahunan?",
      text: "Semua poin user akan dikembalikan ke skor jabatan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Reset!",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setResettingPoin(true);
    
    try {
      const res = await api.post("/users/reset-poin-tahunan");
      
    
      
      if (res.data && res.data.success) {
        Swal.fire({
          title: "✅ Berhasil!",
          text: `Reset selesai! Updated: ${res.data.data?.updated || 0} user.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        
        
        window.location.reload();  // Simple refresh
        
      } else {
        throw new Error(res.data.message || "Reset gagal");
      }
      
    } catch (e) {
      console.error(" Error:", e);
      
      Swal.fire({
        title: "Gagal!",
        text: e.response?.data?.message || e.message || "Terjadi kesalahan",
        icon: "error",
      });
    } finally {
      setResettingPoin(false);
    }
  };

  // =============================
  // 📋 TABLE COLUMNS (untuk desktop)
  // =============================
  const columns = useMemo(
    () => [
      { Header: "ID", id: "col_id", accessor: (r) => r.id, sort: true },
      {
        Header: "Foto",
        id: "col_foto",
        accessor: (r) => r.foto,
        Cell: ({ value, row }) => {
          const baseURL = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
          const imageURL = value ? `${baseURL}/storage/${value}` : "/default-avatar.png";
          return (
            <img
              src={imageURL}
              alt="Foto"
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #ccc",
              }}
            />
          );
        },
      },
      { Header: "Nama", id: "col_name", accessor: (r) => r.name, sort: true },
      // {
      //   Header: "Poin",
      //   id: "col_poin",
      //   accessor: (r) => {
      //     // 🔹 HIDE POIN JIKA HOLDING KATEGORI = 'profit'
      //     if (r.holding?.kategori === 'profit') {
      //       return '-';  // Tampilkan dash, bukan angka
      //     }
      //     return r.poin ?? 0;  // Tampilkan poin asli untuk non-profit
      //   },
      //   sort: true,
      //   // Optional: tambahkan styling untuk bedakan visual
      //   Cell: ({ value, row }) => {
      //     const isProfit = row.original.holding?.kategori === 'profit';
      //     return (
      //       <span className={isProfit ? 'text-muted' : 'fw-semibold'}>
      //         {value}
      //       </span>
      //     );
      //   },
      // },
      {
        Header: "Nama Absen",
        id: "col_nama_absen",
        accessor: (r) => r.nama_absen || "-",
        sort: true,
      },
      { Header: "Email", id: "col_email", accessor: (r) => r.email, sort: true },
      {
        Header: "Holding",
        id: "col_holding",
        accessor: (r) => r.holding?.name ?? r.holding_name ?? "-",
        sort: true,
      },
      {
        Header: "Jabatan",
        id: "col_jabatan",
        accessor: (r) => r.jabatan?.nama_jabatan ?? r.nama_jabatan ?? "-",
        sort: true,
      },
      {
        Header: "Status Talent",
        id: "col_status_talent",
        accessor: (r) => r.status_talent?.nama ?? r.status_talent_nama ?? "-",
        sort: true,
      },
      {
        Header: "Role",
        id: "col_Role",
        accessor: (r) => r.role?.name ?? r.role_nama ?? "-",
        sort: true,
      },
   
      // {
      //   Header: "Status Aktif",
      //   id: "col_status_aktif",
      //   accessor: (r) => r.status_aktif || "aktif",
      //   Cell: ({ value }) => {
      //     const getBadge = (status) => {
      //       switch(status) {
      //         case 'aktif':
      //           return <Badge bg="success" className="px-2 py-1">Aktif</Badge>;
      //         case 'nonaktif':
      //           return <Badge bg="danger" className="px-2 py-1">Non Aktif</Badge>;
      //         case 'cuti':
      //           return <Badge bg="warning" className="px-2 py-1">Cuti</Badge>;
      //         case 'resign':
      //           return <Badge bg="secondary" className="px-2 py-1">Resign</Badge>;
      //         default:
      //           return <Badge bg="secondary">-</Badge>;
      //       }
      //     };
      //     return getBadge(value);
      //   },
      //   sort: true,
      // },
      {
        Header: "Aksi",
        id: "col_aksi",
        Cell: ({ row }) => {
          const canUpdate = hasPermission("master-user.update");
          const canDelete = hasPermission("master-user.delete");
          
          return (
            <div className="d-flex gap-2">
              {/* Tombol Detail */}
              <FaEye
                className="text-info"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedUser(row.original);
                  setShowDetailModal(true);
                }}
                title="Lihat Detail"
              />
              
              {canUpdate && (
                <FaEdit
                  className="text-warning"
                  style={{ cursor: "pointer" }}
                  onClick={() => onEdit(row.original)}
                  title="Edit"
                />
              )}
              {canDelete && (
                <FaTrash
                  className="text-danger"
                  style={{ cursor: "pointer" }}
                  onClick={() => onDelete(row.original.id)}
                  title="Hapus"
                />
              )}
            </div>
          );
        },
      },
    ],
    [hasPermission]
  );

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "All", value: Math.max(data.length, 1) },
  ];

  // =============================
  // 🧾 FORM HANDLERS
  // =============================
  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const onEdit = (u) => {
    const fotoURL = u.foto ? `${API_BASE_URL.replace("/api", "")}/storage/${u.foto}` : "";
    setForm({
      id: u.id,
      name: u.name ?? "",
      kode_erp: u.kode_erp ?? "",
      nama_absen: u.nama_absen ?? "",
      email: u.email ?? "",
      role_id: u.role_id ?? u.role?.id ?? "",
      holding_id: u.holding_id ?? u.holding?.id ?? "",
      jabatan_id: u.jabatan_id ?? u.jabatan?.id ?? "",
      jabatan_details_id: u.jabatan_details_id ?? "",
      status_talent_id: u.status_talent_id ?? u.status_talent?.id ?? "",
      minimal_ngaji: u.minimal_ngaji ?? "",
      password: "",
      foto: null,
      fotoPreview: fotoURL,
      foto_url: fotoURL,
    });
    setShowModal(true);
  };

  // =============================
  // 📊 FUNGSI EXPORT EXCEL
  // =============================
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      Swal.fire({
        title: 'Tidak ada data!',
        text: 'Tidak ada data user untuk diexport',
        icon: 'warning',
        confirmButtonColor: '#152579'
      });
      return;
    }

    setExportingExcel(true);

    try {
      const excelData = data.map((user, index) => ({
        'No': index + 1,
        'NAMA': user.name?.toUpperCase() || '-',
        'JABATAN': user.jabatan?.nama_jabatan || user.nama_jabatan || '-',
        'HOLDING': user.holding?.name || user.holding_name || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const colWidths = [
        { wch: 5 },   // No
        { wch: 35 },  // NAMA
        { wch: 30 },  // JABATAN
        { wch: 25 }   // HOLDING
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data User");

      const fileName = `Data_User_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      Swal.fire({
        title: 'Berhasil!',
        text: `Export Excel Data User Berhasil Dibuat (${data.length} data)`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat export Excel',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setExportingExcel(false);
    }
  };

  // =============================
  // 📄 FUNGSI EXPORT PDF
  // =============================
  const exportToPDFPortrait = () => {
    if (!data || data.length === 0) {
      Swal.fire({
        title: 'Tidak ada data!',
        text: 'Tidak ada data user untuk diexport',
        icon: 'warning',
        confirmButtonColor: '#152579'
      });
      return;
    }

    setExporting(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('DATA USER', pageWidth / 2, 15, { align: 'center' });
      
      doc.setDrawColor(51, 102, 153);
      doc.setLineWidth(0.5);
      doc.line(15, 18, pageWidth - 15, 18);

      const groupedData = data.reduce((acc, user) => {
        const holdingName = user.holding?.name || 'TANPA HOLDING';
        if (!acc[holdingName]) acc[holdingName] = [];
        acc[holdingName].push(user);
        return acc;
      }, {});

      const tableBody = [];
      let globalIndex = 1;

      Object.keys(groupedData).forEach((holdingName) => {
        const usersInHolding = groupedData[holdingName];

        usersInHolding.forEach((user, index) => {
          tableBody.push([
            globalIndex++,
            index === 0 ? holdingName : '',
            user.name?.toUpperCase() || '-',
            user.jabatan?.nama_jabatan || '-',
            user.status_talent?.nama || '-'
          ]);
        });
      });

      autoTable(doc, {
        startY: 25,
        head: [['No', 'Holding', 'Nama Lengkap', 'Jabatan', 'Status']],
        body: tableBody,
        theme: 'grid',
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          valign: 'top'
        },
        headStyles: { 
          fillColor: [51, 102, 153], 
          halign: 'center',
          fontStyle: 'bold' 
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 35, fontStyle: 'bold' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 40 },
          4: { cellWidth: 30 }
        },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Sistem Kinerja SCI | Halaman ${data.pageNumber}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
      });

      doc.save(`Data User.pdf`);

      Swal.fire({
        title: 'Berhasil!',
        text: 'Export PDF Data User Berhasil Dibuat.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal memproses PDF', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleResetAllPasswords = async () => {
    const result = await Swal.fire({
      title: 'Reset Password Semua User?',
      text: 'Password SEMUA user akan diubah menjadi "123123"',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Reset!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-secondary'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    Swal.fire({
      title: 'Sedang Mereset...',
      text: 'Mohon tunggu',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setResettingAll(true);

    try {
      const res = await api.post('/users/reset-all-passwords', {
        confirmation: 'RESET_ALL_PASSWORDS_WITH_SUPER_ADMIN'
      });

      Swal.close();

      await Swal.fire({
        title: 'Berhasil!',
        html: `Password <strong>${res.data.data.total_reset}</strong> user berhasil direset menjadi <strong>"123123"</strong>`,
        icon: 'success',
        confirmButtonColor: '#198754',
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'btn btn-success'
        }
      });

      const usersRes = await api.get("/users");
      const users = normalizePayload(usersRes.data, ["users"]);
      setData(users);

    } catch (e) {
      Swal.close();

      await Swal.fire({
        title: 'Gagal!',
        text: e?.response?.data?.message || e?.message || 'Terjadi kesalahan saat mereset password',
        icon: 'error',
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'OK',
        customClass: {
          confirmButton: 'btn btn-danger'
        }
      });
    } finally {
      setResettingAll(false);
    }
  };

  const onDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Yakin hapus user ini?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/users/${id}`);
      setData((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Gagal menghapus user");
    } finally {
      setDeletingId(null);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name?.trim()) return "Nama wajib diisi";
    if (!form.email?.trim()) return "Email wajib diisi";
    return null;
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    const errMsg = validateForm();
    if (errMsg) return alert(errMsg);

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("kode_erp", form.kode_erp || "");
      formData.append("nama_absen", form.nama_absen || "");
      formData.append("email", form.email);
      formData.append("role_id", form.role_id || "");
      formData.append("holding_id", form.holding_id || "");
      formData.append("jabatan_id", form.jabatan_id || "");
      formData.append("jabatan_details_id", form.jabatan_details_id || "");
      formData.append("status_talent_id", form.status_talent_id || "");
      formData.append("minimal_ngaji", form.minimal_ngaji || 0);

      if (form.password?.trim()) formData.append("password", form.password);
      if (form.foto instanceof File) formData.append("foto", form.foto);

      let res;
      if (form.id) {
        res = await api.post(`/users/${form.id}?_method=PUT`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/users", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const updatedData = res.data?.data ?? res.data ?? {};
      setData((prev) => {
        if (form.id) {
          return prev.map((u) => (u.id === form.id ? { ...u, ...updatedData } : u));
        }
        return [updatedData, ...prev];
      });

      setShowModal(false);
      setForm(emptyForm);
    } catch (e) {
      console.error("Save error:", e);
      alert(e?.response?.data?.message || e?.message || "Gagal menyimpan user");
    } finally {
      setSaving(false);
    }
  };

  // =============================
  // 🖥️ RENDER
  // =============================
  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Master Data", path: "/master/user" },
          { label: "User", path: "/master/user", active: true },
        ]}
        title={"Master Data User"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title">Data User</h4>
                <div className="d-flex gap-2 flex-wrap">
                  {/* Tombol Export Excel */}
                  <Button 
                    variant="outline-success" 
                    onClick={exportToExcel}
                    disabled={exportingExcel || data.length === 0}
                    title={`Export ${data.length} data user ke Excel`}
                    size="sm"
                  >
                    <FaFileExcel className="me-2" /> 
                    {exportingExcel ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" /> 
                        Exporting...
                      </>
                    ) : (
                      `Excel`
                    )}
                  </Button>


                  {/* Tombol Export PDF */}
                  <Button 
                    variant="outline-danger" 
                    onClick={exportToPDFPortrait}
                    disabled={exporting || data.length === 0}
                    title={`Export ${data.length} data user ke PDF`}
                    size="sm"
                  >
                    <FaFilePdf className="me-2" /> 
                    {exporting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" /> 
                        Exporting...
                      </>
                    ) : (
                      `PDF`
                    )}
                  </Button>
                  {/* <Button 
                    variant="danger" 
                    onClick={handleResetPoinTahunan}
                    disabled={resettingPoin || loading}
                    size="sm"
                  >
                    {resettingPoin ? (
                      <><Spinner animation="border" size="sm" className="me-2" />Resetting...</>
                    ) : (
                      "Reset Poin"
                    )}
                  </Button> */}


                  {/* Tombol Reset All Passwords */}
                  <Button 
                    variant="danger" 
                    onClick={handleResetAllPasswords}
                    disabled={resettingAll}
                    title="Reset password SEMUA user menjadi 123123"
                    size="sm"
                  >
                    <FaKey className="me-2" /> 
                    {resettingAll ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" /> 
                        Resetting...
                      </>
                    ) : (
                      "Reset All"
                    )}
                  </Button>

                  {/* Tombol Tambah User */}
                  {hasPermission("master-user.create") && (
                    <Button variant="primary" onClick={openCreate} size="sm">
                      <FaPlus className="me-2" /> Tambah
                    </Button>
                  )}
                </div>
              </div>

              {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
              {err && <div className="text-danger">Error: {err}</div>}

              {!loading && !err && (
                <>
                  {isMobile ? (
                    // Mobile View: Expandable Cards
                    <div className="mobile-view">
                      {data.map((user) => (
                        <ExpandableRow
                          key={user.id}
                          user={user}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          hasUpdatePerm={hasPermission("master-user.update")}
                          hasDeletePerm={hasPermission("master-user.delete")}
                        />
                      ))}
                    </div>
                  ) : (
                    // Desktop View: Regular Table
                    <Table
                      keyField="id"
                      columns={columns}
                      data={data}
                      pageSize={5}
                      sizePerPageList={sizePerPageList}
                      isSortable
                      pagination
                      isSearchable
                    />
                  )}
                </>
              )}

              {deletingId && (
                <div className="mt-2 small text-muted">Menghapus ID: {deletingId}…</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Create / Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Form onSubmit={onSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{form.id ? "Edit User" : "Tambah User"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nama</Form.Label>
                  <Form.Control
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Nama lengkap"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nama Absen</Form.Label>
                  <Form.Control
                    name="nama_absen"
                    value={form.nama_absen}
                    onChange={onChange}
                    placeholder="Nama yang tampil di absen"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="email@domain.com"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Role</Form.Label>
                  <Form.Select name="role_id" value={form.role_id || ""} onChange={onChange} required> 
                    <option value="">- Pilih -</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.role_name || r.name || `Role #${r.id}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Holding</Form.Label>
                  <Form.Select
                    name="holding_id"
                    value={form.holding_id || ""}
                    onChange={onChange}
                  >
                    <option value="">- Pilih -</option>
                    {holdings.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name || `Holding #${h.id}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Jabatan</Form.Label>
                  <Form.Select name="jabatan_id" value={form.jabatan_id || ""} onChange={onChange}>
                    <option value="">- Pilih -</option>
                    {jabatans.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nama_jabatan || j.name || `Jabatan #${j.id}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Jabatan Detail</Form.Label>
                  <Form.Select
                    name="jabatan_details_id"
                    value={form.jabatan_details_id || ""}
                    onChange={onChange}
                    disabled={!form.jabatan_id} // Disable jika Jabatan Utama belum dipilih
                  >
                    <option value="">- Pilih Jabatan Detail -</option>
                    {jabatanDetails
                      .filter((detail) => {
                        // Hanya munculkan detail yang jabatan_id-nya cocok dengan pilihan user
                        return !form.jabatan_id || detail.jabatan_id == form.jabatan_id;
                      })
                      .map((jd) => (
                        <option key={jd.id} value={jd.id}>
                          {jd.nama_jabatan}
                        </option>
                      ))}
                  </Form.Select>
                  {!form.jabatan_id && (
                    <Form.Text className="text-muted">
                      Pilih Jabatan Utama terlebih dahulu.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>    
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status Talent</Form.Label>
                  <Form.Select
                    name="status_talent_id"
                    value={form.status_talent_id || ""}
                    onChange={onChange}
                    required
                  >
                    <option value="">- Pilih -</option>
                    {statusTalents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama || s.name || `Status #${s.id}`}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Harap pilih status talent.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              {/* <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Kode ERP (Marketing)</Form.Label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadErpOptions}
                    placeholder="Ketik nama atau kode marketing..."
                    loadingMessage={() => "Mencari..."}
                    noOptionsMessage={() => "Data tidak ditemukan"}
                    value={
                      form.kode_erp 
                        ? { value: form.kode_erp, label: form.kode_erp_label || form.kode_erp } 
                        : null
                    }
                    onChange={(selectedOption) => {
                      setForm(prev => ({
                        ...prev,
                        kode_erp: selectedOption ? selectedOption.value : "",
                        kode_erp_label: selectedOption ? selectedOption.label : ""
                      }));
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#D1D5DB',
                        borderRadius: '0.375rem',
                        padding: '2px'
                      })
                    }}
                  />
                  <Form.Text className="text-muted">
                    Cari berdasarkan nama atau kode dari sistem pusat.
                  </Form.Text>
                </Form.Group>
              </Col> */}
              {/* <Col md={6}>
                <Form.Group>
                  <Form.Label>Minimal Ngaji</Form.Label>
                  <Form.Control
                    type="number"
                    name="minimal_ngaji"
                    value={form.minimal_ngaji}
                    onChange={onChange}
                    placeholder="Masukkan target minimal ngaji"
                    min={0}
                  />
                </Form.Group>
              </Col> */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder={form.id ? "Kosongkan jika tidak ingin diubah" : "Minimal 6 karakter"}
                    required={!form.id}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Foto</Form.Label>
                  <Form.Control
                    type="file"
                    name="foto"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setForm((prev) => ({
                          ...prev,
                          foto: file,
                          fotoPreview: URL.createObjectURL(file),
                        }));
                      }
                    }}
                  />
                  {(form.fotoPreview || form.foto_url) ? (
                    <div className="mt-2">
                      <img
                        src={form.fotoPreview || form.foto_url}
                        alt="Preview Foto"
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                        }}
                      />
                    </div>
                  ) : (
                    <small className="text-muted d-block mt-1">Belum ada foto</small>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Menyimpan…
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Detail User */}
      <UserDetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        user={selectedUser}
      />
    </>
  );
};

export default Advanced;