import { useEffect, useState } from "react";
import { 
  Card, 
  Col, 
  Row, 
  Spinner, 
  Alert, 
  Button, 
  Modal, 
  Form,
  Badge 
} from "react-bootstrap";
import { FaEdit, FaTrash, FaFilter } from "react-icons/fa";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Dropdown, DropdownButton } from "react-bootstrap";

// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";

// Ambil token dari localStorage
const token = localStorage.getItem("authToken");

// Buat instance axios dengan token
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const Advanced = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State untuk modal hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // State untuk filter
  const [selectedBulan, setSelectedBulan] = useState("ALL");
  const [selectedTahun, setSelectedTahun] = useState("ALL");
  
  
  // State untuk modal edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editForm, setEditForm] = useState({
    minimal_ngaji: "",
    total_ngaji: "",
    status: ""
  });

  useEffect(() => {
    fetchRekapNgaji();
  }, []);

  const fetchRekapNgaji = async () => {
    try {
      const response = await api.get("/rekap-ngaji");
      setData(response.data.data || []);
    } catch (err) {
      setError("Gagal mengambil data rekap ngaji");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  

  // Ambil daftar periode unik untuk dropdown hapus
  const getUniquePeriods = () => {
    const periods = new Set();
    data.forEach(item => {
      if (item.datetime) {
        const date = new Date(item.datetime);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periods.add(period);
      }
    });
    return Array.from(periods).sort().reverse(); // Urutkan dari terbaru
  };

  // Ambil daftar bulan dan tahun unik untuk filter
  const getUniqueMonths = () => {
    const months = new Set();
    data.forEach(item => {
      if (item.datetime) {
        const date = new Date(item.datetime);
        months.add(date.getMonth() + 1);
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  };

  const getUniqueYears = () => {
    const years = new Set();
    data.forEach(item => {
      if (item.datetime) {
        const date = new Date(item.datetime);
        years.add(date.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Tahun terbaru dulu
  };

  // Filter data berdasarkan bulan dan tahun
  const filteredData = data.filter(item => {
    if (!item.datetime) return true;
    
    const date = new Date(item.datetime);
    const itemMonth = date.getMonth() + 1;
    const itemYear = date.getFullYear();
    
    let passFilter = true;
    
    if (selectedBulan !== "ALL") {
      passFilter = passFilter && (itemMonth === parseInt(selectedBulan));
    }
    
    if (selectedTahun !== "ALL") {
      passFilter = passFilter && (itemYear === parseInt(selectedTahun));
    }
    
    return passFilter;
  });

  // Handle hapus data
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await api.delete("/rekap-ngaji", {
        data: { periode: selectedPeriod }
      });
      
      if (response.data.success) {
        alert(response.data.message);
        setShowDeleteModal(false);
        fetchRekapNgaji(); // Refresh data
      } else {
        alert("Gagal menghapus data: " + response.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus data");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle edit data
  const handleEditClick = (rowData) => {
    setEditData(rowData);
    setEditForm({
      minimal_ngaji: rowData.minimal_ngaji,
      total_ngaji: rowData.total_ngaji,
      status: rowData.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      const response = await api.put(`/rekap-ngaji/${editData.id}`, editForm);
      
      if (response.data.success) {
        alert("Data berhasil diupdate");
        setShowEditModal(false);
        fetchRekapNgaji(); // Refresh data
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengupdate data");
    }
  };

  // Export PDF berdasarkan periode tertentu
  const exportPDFByPeriod = (periodKey) => {
    let dataToExport = [];

    if (periodKey === "ALL") {
      dataToExport = data; // semua data
    } else {
      // Filter data berdasarkan periode (YYYY-MM)
      const [tahun, bulan] = periodKey.split('-').map(Number);
      dataToExport = data.filter(item => {
        if (!item.datetime) return false;
        const dt = new Date(item.datetime);
        return dt.getFullYear() === tahun && (dt.getMonth() + 1) === bulan;
      });
    }

    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk periode yang dipilih.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Format label periode
    const periodeLabel = 
      periodKey === "ALL"
        ? "Semua Periode"
        : (() => {
            const [y, m] = periodKey.split('-');
            return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          })();

    // Judul
    doc.setFontSize(16);
    doc.text("LAPORAN REKAP NGAJI PAGI", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Periode: ${periodeLabel}`, pageWidth / 2, 28, { align: "center" });

    // Data tabel
    const tableColumn = ["No", "Nama", "Minimal Ngaji", "Total Ngaji", "Status", "Periode"];
    const tableRows = dataToExport.map((item, index) => [
      index + 1,
      item.user?.name || item.user_name || "-",
      `${item.minimal_ngaji} hari`,
      `${item.total_ngaji} hari`,
      item.status,
      formatDate(item.datetime)
    ]);

    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 35 },
        5: { cellWidth: 35 }
      },
      margin: { left: 10, right: 10 }
    });

    doc.save(`Rekap_Ngaji_${periodeLabel.replace(/\s+/g, '_')}.pdf`);
  };

  // Reset filter
  const resetFilter = () => {
    setSelectedBulan("ALL");
    setSelectedTahun("ALL");
  };

  // Format tanggal untuk tampilan
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric"
    });
  };

  // Kolom tabel
  const columns = [
    {
      Header: "No",
      accessor: (_, index) => index + 1,
      sort: false,
      width: 50,
    },
    {
      Header: "Nama",
      accessor: "user.name",
      sort: true,
    },
    {
      Header: "Minimal Ngaji",
      accessor: "minimal_ngaji",
      sort: true,
      Cell: ({ value }) => <span className="fw-semibold">{value} hari</span>
    },
    {
      Header: "Total Ngaji",
      accessor: "total_ngaji",
      sort: true,
      Cell: ({ value, row }) => {
        const minimal = row.original.minimal_ngaji;
        const persentase = minimal > 0 ? Math.round((value / minimal) * 100) : 0;
        const isMemenuhi = persentase >= 100;
        
        return (
          <div>
            <div className={`fw-bold ${isMemenuhi}`}>
              {value} hari
            </div>
          </div>
        );
      }
    },
    {
      Header: "Status",
      accessor: "status",
      sort: true,
      Cell: ({ value }) => (
        <Badge bg={value === "MEMENUHI" ? "success" : "danger"} className="px-1 py-1">
          {value}
        </Badge>
      )
    },
    {
      Header: "Periode",
      accessor: "datetime",
      sort: true,
      Cell: ({ value }) => formatDate(value)
    },
    {
      Header: "Aksi",
      Cell: ({ row }) => (
        <div className="d-flex gap-2">
          <FaEdit
            className="text-warning"
            style={{ cursor: "pointer", fontSize: '1.1rem' }}
            onClick={() => handleEditClick(row.original)}
            title="Edit data"
          />
        </div>
      ),
    },
  ];

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "All", value: filteredData.length || 1 },
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Ngaji Pagi", path: "#" },
          { label: "Rekap Ngaji", path: "#", active: true },
        ]}
        title="Rekap Ngaji"
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              {/* Header dengan Tombol */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="header-title mb-1">Rekap Ngaji Pagi</h4>
                </div>
                <div className="d-flex gap-2">
                  <DropdownButton
                    id="dropdown-export-pdf"
                    title="Export PDF"
                    variant="success"
                    className="me-2"
                    disabled={data.length === 0}
                  >
                    <Dropdown.Item 
                      onClick={() => exportPDFByPeriod("ALL")}
                    >
                      — Semua Periode —
                    </Dropdown.Item>
                    
                    {getUniquePeriods().map(period => {
                      const [year, month] = period.split('-');
                      const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long' });
                      return (
                        <Dropdown.Item 
                          key={period} 
                          onClick={() => exportPDFByPeriod(period)}
                        >
                          {monthName} {year}
                        </Dropdown.Item>
                      );
                    })}
                  </DropdownButton>
                  
                  <Button 
                    variant="danger" 
                    onClick={() => {
                      setSelectedPeriod(getUniquePeriods()[0] || "ALL");
                      setShowDeleteModal(true);
                    }}
                    disabled={data.length === 0}
                  >
                    <FaTrash className="me-2" />
                    Hapus per Bulan
                  </Button>
                </div>
              </div>

              {/* Filter Section */}
              <Card className="mb-3">
                  <Row>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Filter Bulan</Form.Label>
                        <Form.Select
                          value={selectedBulan}
                          onChange={(e) => setSelectedBulan(e.target.value)}
                        >
                          <option value="ALL">Semua Bulan</option>
                          {getUniqueMonths().map(month => (
                            <option key={month} value={month}>
                              {new Date(2000, month - 1).toLocaleDateString('id-ID', { month: 'long' })}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Filter Tahun</Form.Label>
                        <Form.Select
                          value={selectedTahun}
                          onChange={(e) => setSelectedTahun(e.target.value)}
                        >
                          <option value="ALL">Semua Tahun</option>
                          {getUniqueYears().map(year => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
              
              </Card>

              

              {/* Loading State */}
              {loading && (
                <div className="text-center my-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Memuat data rekap ngaji...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Alert variant="danger">
                  <Alert.Heading>Gagal Memuat Data</Alert.Heading>
                  <p>{error}</p>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={fetchRekapNgaji}
                  >
                    Coba Lagi
                  </Button>
                </Alert>
              )}

              {/* Data Table */}
              {!loading && !error && (
                <Table
                  columns={columns}
                  data={filteredData}
                  pageSize={10}
                  sizePerPageList={sizePerPageList}
                  isSortable={true}
                  pagination={true}
                  isSearchable={true}
                  searchPlaceholder="Cari nama atau periode..."
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= Modal Hapus per Bulan ================= */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTrash className="me-2 text-danger" />
            Hapus Data Rekap
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Pilih Periode yang Akan Dihapus</Form.Label>
              <Form.Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="ALL">— Semua Data Rekap —</option>
                {getUniquePeriods().map(period => {
                  const [year, month] = period.split('-');
                  const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long' });
                  return (
                    <option key={period} value={period}>
                      {monthName} {year}
                    </option>
                  );
                })}
              </Form.Select>
              
              {selectedPeriod === "ALL" ? (
                <Alert variant="warning" className="mt-2">
                  <p className="mb-0 small">
                    <strong>Anda memilih "Semua Data Rekap"</strong> - Ini akan menghapus semua data rekap ngaji dari database.
                  </p>
                </Alert>
              ) : (
                <div className="mt-2 p-2 bg-light rounded">
                  <small className="text-muted">
                    Akan menghapus semua data rekap untuk periode: <br />
                    <strong>
                      {(() => {
                        if (selectedPeriod === "ALL") return "Semua Periode";
                        const [year, month] = selectedPeriod.split('-');
                        return `${new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
                      })()}
                    </strong>
                  </small>
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteLoading}
          >
            Batal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Menghapus...
              </>
            ) : (
              'Ya, Hapus Data'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ================= Modal Edit Data ================= */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Data Rekap</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editData && (
            <div className="mb-3">
              <div className="alert alert-info py-2 mb-3">
                <strong>Peserta:</strong> {editData.user_name}
                <span className="mx-2">|</span>
                <strong>Periode:</strong> {formatDate(editData.datetime)}
              </div>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Minimal Ngaji (hari)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editForm.minimal_ngaji}
                    onChange={(e) => setEditForm({...editForm, minimal_ngaji: e.target.value})}
                    min="0"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Total Ngaji (hari)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editForm.total_ngaji}
                    onChange={(e) => setEditForm({...editForm, total_ngaji: e.target.value})}
                    min="0"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="MEMENUHI">MEMENUHI</option>
                    <option value="BELUM MEMENUHI">BELUM MEMENUHI</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleEditSubmit}>
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Advanced;