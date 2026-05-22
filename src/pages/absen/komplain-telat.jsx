import { useState, useEffect } from "react";
import { Card, Col, Row, Spinner, Alert } from "react-bootstrap";
import { FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import axios from "axios";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import Swal from "sweetalert2";

// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";

const Advanced = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [updating, setUpdating] = useState({}); // 🔥 Ubah jadi object untuk per-id

  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpand = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    setAlert({ type: "", message: "" });
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/komplain-telat`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
    } catch (error) {
      console.error(error);
      setAlert({
        type: "danger",
        message:
          error.response?.data?.message || "Gagal memuat data komplain.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id, status, catatan_penolakan = null) => {
    // 🔥 Set loading untuk row ini saja
    setUpdating(prev => ({ ...prev, [id]: true }));
    
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/komplain-telat/${id}/status`,
        { status, catatan_penolakan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let successMessage = `Komplain berhasil ${
        status === "approved" ? "di-approve" : "di-reject"
      }`;

      if (status === "approved") {
        successMessage += ". Data absen dan rekap gaji telah diperbarui.";

        // 🔥 UPDATE STATE SECARA LOKAL (TANPA REFRESH)
        setData(prevData => 
          prevData.map(item => {
            if (item.id === id) {
              return {
                ...item,
                status: "approved",
                // Data lain dari response jika ada
                ...response.data.data
              };
            }
            return item;
          })
        );

        window.dispatchEvent(
          new CustomEvent("komplainApproved", {
            detail: { id, userId: response.data.data?.user_id },
          })
        );
      } else {
        // 🔥 UPDATE STATE UNTUK REJECTED
        setData(prevData => 
          prevData.map(item => {
            if (item.id === id) {
              return {
                ...item,
                status: "rejected",
                catatan_penolakan: catatan_penolakan,
                ...response.data.data
              };
            }
            return item;
          })
        );
      }

      setAlert({ type: "success", message: successMessage });
      
      // 🔥 HILANGKAN fetchData() - TIDAK PERLU REFRESH
      // fetchData(); 
      
    } catch (error) {
      console.error(error);
      setAlert({
        type: "danger",
        message:
          error.response?.data?.message || "Gagal memperbarui status komplain.",
      });
    } finally {
      // 🔥 Hapus loading untuk row ini
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Hapus komplain?",
      text: "Komplain yang dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteKomplain(id);
      }
    });
  };

  const deleteKomplain = async (id) => {
    setUpdating(prev => ({ ...prev, [id]: true }));
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/komplain-telat/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 🔥 HAPUS DATA DARI STATE (TANPA REFRESH)
      setData(prevData => prevData.filter(item => item.id !== id));

      setAlert({ type: "success", message: "Komplain berhasil dihapus." });
      // fetchData(); // HILANGKAN
    } catch (error) {
      console.error(error);
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Gagal menghapus komplain.",
      });
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  // SweetAlert untuk approve
  const handleApprove = (id) => {
    Swal.fire({
      title: "Setujui komplain ini?",
      text:
        "Ini akan mengubah status absen dari TELAT ke HADIR, mengurangi total telat, dan menyesuaikan gaji bersih.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, setujui",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        updateStatus(id, "approved");
      }
    });
  };

  // SweetAlert untuk reject
  const handleReject = (id) => {
    Swal.fire({
      title: "Tolak komplain?",
      input: "text",
      inputLabel: "Masukkan catatan penolakan",
      inputPlaceholder: "Catatan penolakan",
      showCancelButton: true,
      confirmButtonText: "Tolak",
      cancelButtonText: "Batal",
      preConfirm: (note) => {
        if (!note) {
          Swal.showValidationMessage("Catatan penolakan tidak boleh kosong!");
        }
        return note;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        updateStatus(id, "rejected", result.value);
      }
    });
  };

  const columns = [
    { Header: "No", Cell: ({ row }) => row.index + 1, sort: false },
    {
      Header: "Nama User",
      accessor: "user.name",
      sort: true,
      Cell: ({ row }) => row.original.user?.name || "-",
    },
    {
      Header: "Tanggal",
      accessor: "tanggal",
      sort: true,
      Cell: ({ row }) =>
        new Date(row.original.tanggal).toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
    },
    { Header: "Alasan", accessor: "alasan", sort: true },
    {
      Header: "Keterangan",
      accessor: "keterangan",
      sort: true,
      Cell: ({ row }) => {
        const text = row.original.keterangan || "";
        const isExpanded = expandedRows[row.id] || false;
        const maxLength = 50;
        
        if (!text || text.trim() === "") {
          return <span className="text-muted fst-italic">-</span>;
        }
        
        if (text.length <= maxLength) {
          return <span>{text}</span>;
        }
        
        return (
          <div>
            <span>
              {isExpanded ? text : `${text.substring(0, maxLength)}...`}
            </span>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 ms-1"
              onClick={() => toggleExpand(row.id)}
              style={{ fontSize: '0.8rem' }}
            >
              {isExpanded ? (
                <span className="text-primary">[Lebih Sedikit]</span>
              ) : (
                <span className="text-primary">[Selengkapnya]</span>
              )}
            </button>
          </div>
        );
      },
    },
    {
      Header: "Bukti Foto",
      accessor: "bukti_foto",
      sort: false,
      Cell: ({ row }) => {
        const foto = row.original.bukti_foto;
        if (!foto) return "-";
        const url = `${import.meta.env.VITE_API_BASE_URL.replace(
          "/api",
          ""
        )}/storage/${foto}`;
        return (
          <div>
            <img
              src={url}
              alt="Bukti"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => window.open(url, "_blank")}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML =
                  '<span class="text-danger">Gambar tidak ditemukan</span>';
              }}
            />
            <small className="d-block mt-1 text-muted">Klik untuk melihat</small>
          </div>
        );
      },
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: ({ row }) => {
        const status = row.original.status;
        const map = {
          pending: { label: "MENUNGGU", color: "warning" },
          approved: { label: "DISETUJUI", color: "success" },
          rejected: { label: "DITOLAK", color: "danger" },
        };
        const statusInfo = map[status] || { label: status.toUpperCase(), color: "secondary" };
        return <span className={`badge bg-${statusInfo.color}`}>{statusInfo.label}</span>;
      },
    },
    { 
      Header: "Catatan Penolakan", 
      accessor: "catatan_penolakan", 
      sort: false, 
      Cell: ({ row }) => row.original.catatan_penolakan || "-" 
    },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        const status = row.original.status;
        const id = row.original.id;

        if (status !== "pending") {
          // Jika sudah diproses, tampilkan status saja
          return (
            <div className="text-center">
              <span className={`badge bg-${status === "approved" ? "success" : "danger"}`}>
                {status === "approved" ? "DISETUJUI" : "DITOLAK"}
              </span>
            </div>
          );
        }

        // Jika pending: tampilkan approve, reject, dan delete
        return (
          <div className="d-flex gap-2">
            <OverlayTrigger placement="top" overlay={<Tooltip>Approve Komplain</Tooltip>}>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleApprove(id)}
                disabled={updating[id]} // 🔥 Disable hanya untuk row ini
              >
                {updating[id] ? <Spinner animation="border" size="sm" /> : <FaCheck className="me-1" />}
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={<Tooltip>Reject Komplain</Tooltip>}>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleReject(id)}
                disabled={updating[id]} // 🔥 Disable hanya untuk row ini
              >
                {updating[id] ? <Spinner animation="border" size="sm" /> : <FaTimes className="me-1" />}
              </Button>
            </OverlayTrigger>

            {/* 🔥 Hanya muncul saat pending */}
            <OverlayTrigger placement="top" overlay={<Tooltip>Hapus Komplain</Tooltip>}>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => handleDelete(id)}
                disabled={updating[id]} // 🔥 Disable hanya untuk row ini
              >
                {updating[id] ? <Spinner animation="border" size="sm" /> : <FaTrash className="me-1" />}
              </Button>
            </OverlayTrigger>
          </div>
        );
      },
    }
  ];

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "All", value: data.length },
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Absen", path: "/features/tables/advanced" },
          { label: "Komplain Telat", path: "/features/tables/advanced", active: true },
        ]}
        title={"Komplain Telat"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h4 className="header-title mb-4">Daftar Komplain Keterlambatan</h4>
              <p className="text-muted mb-4">
                Approve komplain akan mengubah status absen dari TELAT ke HADIR,
                mengurangi total telat, dan menyesuaikan gaji bersih.
              </p>

              {alert.message && (
                <Alert 
                  variant={alert.type} 
                  onClose={() => setAlert({ type: "", message: "" })} 
                  dismissible
                >
                  {alert.message}
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2 text-muted">Memuat data komplain...</p>
                </div>
              ) : (
                <>
                  {data.length === 0 ? (
                    <Alert variant="info">Tidak ada data komplain yang pending.</Alert>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <Table
                        columns={columns}
                        data={data}
                        pageSize={10}
                        sizePerPageList={sizePerPageList}
                        isSortable={true}
                        pagination={true}
                        isSearchable={true}
                        theadClassName="table-light"
                      />
                    </div>
                  )}
                </>
              )}
            </Card.Body>
            <Card.Footer className="text-muted">
              <small>
                Total: {data.length} komplain • {data.filter((d) => d.status === "pending").length} pending •{" "}
                {data.filter((d) => d.status === "approved").length} disetujui •{" "}
                {data.filter((d) => d.status === "rejected").length} ditolak
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Advanced;