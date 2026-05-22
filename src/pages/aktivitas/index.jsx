import { Card, Col, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext.jsx";

// components
import PageTitle from "../../components/PageTitle";
import Table from "../../components/Table";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
const API = `${API_BASE}/aktivitas`;

const Advanced = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  const token = localStorage.getItem("authToken");
  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      console.error("Token tidak ditemukan. Silakan login kembali.");
      setLoading(false);
      return;
    }

    axios
      .get(API, { headers: authHeader })
      .then((res) => {
        let allData = res.data;

        if (user && user.role?.role_name !== "Superadmin" && user.role?.role_name !== "Admin") {
          allData = allData.filter((item) => item.user_id === user.id);
        }
        setData(allData);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          console.error("Token expired atau tidak valid. Silakan login ulang.");
        } else {
          console.error("Error fetching data:", err);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const tableLabelMap = {
    master_cutis: "Master Cuti",
    status_talent: "Master Status Talent",
    libur: "Master Hari Libur",
    masterizin: "Master Izin",
    users: "Master User",
    aktivitas: "Aktivitas",
    holding: "Master Holding",
    jabatan: "Master Jabatan",
    role: "Master Role",
    perihal_izin: "Master Perihal Izin",
    rules_absen: "Master Rules Absen",
    pengajuan_cutis: "Pengajuan Cuti",
    card: "My Task Card",
    cheklist: "Checklist",
    izin: "Izin",
  };

  const getDataName = (tableName, data) => {
    let obj = {};
    try {
      obj = JSON.parse(data);
    } catch (error) {
      return null;
    }

    const nameFields = [
      "name",
      "nama",
      "title",
      "judul",
      "jenis",
      "type",
      "description",
      "deskripsi",
    ];

    for (let field of nameFields) {
      if (obj[field] && obj[field] !== "" && obj[field] !== null) {
        return obj[field];
      }
    }

    switch (tableName) {
      case "master_cutis":
        return obj.jenis_cuti || `Cuti ${obj.id}`;
      case "jabatan":
        return obj.nama_jabatan || `Jabatan ${obj.id}`;
      case "perihal_izin":
        return obj.perihal || `Izin ${obj.id}`;
      case "status_talent":
        return obj.status || `Status ${obj.id}`;
      case "holding":
        return obj.nama_holding || `Holding ${obj.id}`;
      case "role":
        return obj.role_name || `Role ${obj.id}`;
      default:
        return null;
    }
  };

  const getActionLabel = (logType) => {
    const labelMap = {
      create: "Tambah",
      edit: "Edit",
      delete: "Hapus",
      login: "Login",
    };
    return labelMap[logType] || logType;
  };

  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return "-";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";
    return "Browser";
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return "-";
    if (/Android/.test(userAgent)) return "Android";
    if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
    if (/Windows/.test(userAgent)) return "Windows";
    if (/Macintosh/.test(userAgent)) return "Mac";
    if (/Linux/.test(userAgent)) return "Linux";
    return "Desktop";
  };

  const getOSInfo = (userAgent) => {
    if (!userAgent) return "-";
    if (/Windows NT 10.0/.test(userAgent)) return "Windows 10/11";
    if (/Macintosh/.test(userAgent)) return "macOS";
    if (/Android/.test(userAgent)) return "Android";
    if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
    if (/Linux/.test(userAgent)) return "Linux";
    return "Unknown OS";
  };

  const getDeviceModel = (userAgent) => {
    if (!userAgent) return "-";

    const androidMatch = userAgent.match(/Android [\d.]+;\s*([^;()]+)/i);
    if (androidMatch && androidMatch[1]) {
      return androidMatch[1].trim();
    }

    const samsungMatch = userAgent.match(/SM-[A-Z0-9]+/i);
    if (samsungMatch) {
      return samsungMatch[0];
    }

    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";

    return "Perangkat";
  };

  const generateActivityDescription = (logType, tableName, data) => {
    const dataName = getDataName(tableName, data);
    const table = tableLabelMap[tableName] || tableName;

    switch (logType) {
      case "create":
        return dataName
          ? `Menambah data ${table}: "${dataName}"`
          : `Menambah data baru di ${table}`;

      case "edit":
        return dataName
          ? `Mengubah data ${table}: "${dataName}"`
          : `Mengubah data di ${table}`;

      case "delete":
        return dataName
          ? `Menghapus data ${table}: "${dataName}"`
          : `Menghapus data di ${table}`;

      case "login":
        return `Login ke sistem`;

      default:
        return dataName
          ? `Melakukan ${logType} di ${table}: "${dataName}"`
          : `Melakukan ${logType} di ${table}`;
    }
  };

  const renderActivityDetails = (logType, tableName, data) => {
    if (logType === "login") {
      let obj = {};
      try {
        obj = JSON.parse(data);
      } catch (error) {
        return null;
      }

      const browserName = getBrowserInfo(obj.user_agent);
      const deviceType = getDeviceInfo(obj.user_agent);
      const osInfo = getOSInfo(obj.user_agent);
      const deviceModel = getDeviceModel(obj.user_agent);

      return (
        <div style={{ fontSize: "0.8rem", color: "#6c757d", marginTop: "4px" }}>
          <div>IP: {obj.ip || "tidak diketahui"}</div>
          <div>
            Browser: {browserName} • Perangkat: {deviceType} ({deviceModel}) • OS:
            {osInfo}
          </div>
        </div>
      );
    }

    let obj = {};
    try {
      obj = JSON.parse(data);
    } catch (error) {
      return null;
    }

    switch (tableName) {
      case "pengajuan_cutis":
        return (
          <div style={{ fontSize: "0.8rem", color: "#6c757d", marginTop: "4px" }}>
            <span>
              Periode:{" "}
              {obj.start_date
                ? new Date(obj.start_date).toLocaleDateString("id-ID")
                : "-"}{" "}
              s/d{" "}
              {obj.end_date
                ? new Date(obj.end_date).toLocaleDateString("id-ID")
                : "-"}
            </span>
            <span>
              {" "}
              • Status:{" "}
              {obj.status === "pending"
                ? "Menunggu"
                : obj.status === "approved"
                ? "Disetujui"
                : "Ditolak"}
            </span>
          </div>
        );

      case "card":
        return obj.description ? (
          <div style={{ fontSize: "0.8rem", color: "#6c757d", marginTop: "4px" }}>
            <span>
              Deskripsi:{" "}
              {obj.description.length > 80
                ? `${obj.description.substring(0, 80)}...`
                : obj.description}
            </span>
          </div>
        ) : null;

      case "cheklist":
        return (
          <div style={{ fontSize: "0.8rem", color: "#6c757d", marginTop: "4px" }}>
            <span>Status: {obj.checklist === "yes" ? "Selesai" : "Belum Selesai"}</span>
          </div>
        );

      case "izin":
        return (
          <div style={{ fontSize: "0.8rem", color: "#6c757d", marginTop: "4px" }}>
            <span>
              Tanggal:{" "}
              {obj.datetime
                ? new Date(obj.datetime).toLocaleDateString("id-ID")
                : "-"}
            </span>
            <span>
              {" "}
              • Status:{" "}
              {obj.status === "belum approve" ? "Menunggu" : obj.status}
            </span>
          </div>
        );

      default:
        const details = [];

        if (obj.keterangan) details.push(`Keterangan: ${obj.keterangan}`);
        if (obj.deskripsi)
          details.push(
            `Deskripsi: ${
              obj.deskripsi.length > 50
                ? `${obj.deskripsi.substring(0, 50)}...`
                : obj.deskripsi
            }`
          );
        if (obj.jumlah_hari) details.push(`Jumlah Hari: ${obj.jumlah_hari}`);

        if (details.length > 0) {
          return (
            <div style={{ fontSize: "0.8rem", color: "#6c757d", marginTop: "4px" }}>
              {details.join(" • ")}
            </div>
          );
        }

        return null;
    }
  };

  const columns = [
    {
      Header: "User",
      accessor: (row) => row.user?.name || "—",
      sort: true,
      Cell: ({ value }) => <div style={{ fontWeight: "500" }}>{value}</div>,
    },
    {
      Header: "Waktu",
      accessor: "log_date",
      sort: true,
      Cell: ({ value }) => (
        <div>
          <div style={{ fontWeight: "500" }}>
            {new Date(value).toLocaleDateString("id-ID")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
            {new Date(value).toLocaleTimeString("id-ID")}
          </div>
        </div>
      ),
    },
    {
      Header: "Modul",
      accessor: (row) => tableLabelMap[row.table_name] || row.table_name,
      sort: true,
      Cell: ({ value }) => <div style={{ fontWeight: "500" }}>{value}</div>,
    },
    {
      Header: "Aksi",
      accessor: "log_type",
      sort: true,
      Cell: ({ value }) => (
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          {getActionLabel(value)}
        </div>
      ),
    },
    {
      Header: "Deskripsi",
      accessor: "data",
      Cell: ({ row }) => {
        const { log_type, table_name, data } = row.original;

        return (
          <div>
            <div style={{ lineHeight: "1.4", marginBottom: "2px" }}>
              {generateActivityDescription(log_type, table_name, data)}
            </div>
            {renderActivityDetails(log_type, table_name, data)}
          </div>
        );
      },
      sort: false,
    },
  ];

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "50", value: 50 },
  ];

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          {
            label: "Log Aktivitas",
            path: "/features/tables/advanced",
            active: true,
          },
        ]}
        title="Log Aktivitas Sistem"
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title mb-0">Riwayat Aktivitas</h4>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Memuat data...</span>
                  </div>
                  <div className="mt-2">Memuat data aktivitas...</div>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  Tidak ada data aktivitas
                </div>
              ) : (
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
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Advanced;
