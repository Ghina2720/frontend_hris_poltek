import { Card, Col, Row, Button, Modal, Form, Alert } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";

// components
import PageTitle from "../components/PageTitle";
import Table from "../components/Table";
import { useAuthContext } from "@/context/useAuthContext.jsx"; 

// 🔹 API Configuration
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, ""),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// 🔹 Format Rupiah
const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));

// 🔹 Nama bulan
const getMonthName = (month) => {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return months[month - 1] || "";
};




// 🔹 Modal untuk Buat Payroll
  const PayrollFormModal = ({
    show,
    handleClose,
    masterData,
    onSubmit,
    loading,
    mode = "create",        // ⬅️ NEW
    initialData = null      // ⬅️ NEW (untuk edit)
  }) => {
    
  const emptyForm = {
  user_id: "",
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  incomes: [
    {
      category_id: "",
      gross_amount: "",
      deductions: []
    }
  ]
};

const [formData, setFormData] = useState(emptyForm);

  const userOptions = masterData.users?.map(user => ({
    value: user.id,
    label: user.name, // bisa dikombinasi
    // label: `${user.name} (${user.jabatan?.nama_jabatan})`
  }));

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && mode === "edit" && initialData) {
      setFormData({
        user_id: initialData.user_id.toString(),
        bulan: initialData.bulan.toString(),
        tahun: initialData.tahun.toString(),
        incomes: initialData.payrollIncomes.map((income) => ({
          // 🔥 Ambil dari income.category.id, bukan income.category_id
          category_id: income.category?.id?.toString() || "",
          gross_amount: income.gross_amount?.toString() || "",
          deductions: (income.deductions || []).map((d) => ({
            // 🔥 Ambil dari d.deduction_type.id, bukan d.deduction_type_id
            deduction_type_id: d.deduction_type?.id?.toString() || "",
            amount: d.amount?.toString() || ""
          }))
        }))
      });
    }

    if (!show) {
      setFormData(emptyForm);
      setErrors({});
    }
  }, [show, mode, initialData]);


  // Tambah income baru
  const addIncome = () => {
    setFormData({
      ...formData,
      incomes: [
        ...formData.incomes,
        { category_id: "", gross_amount: "", deductions: [] }
      ]
    });
  };

  // Hapus income
  const removeIncome = (index) => {
    if (formData.incomes.length > 1) {
      const newIncomes = [...formData.incomes];
      newIncomes.splice(index, 1);
      setFormData({ ...formData, incomes: newIncomes });
    }
  };

  // Update income field
  const updateIncome = (index, field, value) => {
    const newIncomes = formData.incomes.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: value
        };
      }
      return item;
    });
    
    setFormData({
      ...formData,
      incomes: newIncomes
    });
    
    // Clear error
    if (errors[`incomes.${index}.${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`incomes.${index}.${field}`];
      setErrors(newErrors);
    }
  };

  // Tambah potongan
  const addDeduction = (incomeIndex) => {
    const newIncomes = [...formData.incomes];
    newIncomes[incomeIndex].deductions.push({
      deduction_type_id: "", 
      amount: ""
    });
    setFormData({ ...formData, incomes: newIncomes });
  };

  // Hapus potongan
  const removeDeduction = (incomeIndex, deductionIndex) => {
    const newIncomes = [...formData.incomes];
    newIncomes[incomeIndex].deductions.splice(deductionIndex, 1);
    setFormData({ ...formData, incomes: newIncomes });
  };

  // Update potongan
  const updateDeduction = (incomeIndex, deductionIndex, field, value) => {
    const newIncomes = [...formData.incomes];
    newIncomes[incomeIndex].deductions[deductionIndex][field] = value; // simpan string
    setFormData({ ...formData, incomes: newIncomes });
  };


  // Hitung net amount untuk satu income
  const calculateNetAmount = (income) => {
    const gross = Number(income.gross_amount) || 0;
    const totalDeductions = income.deductions.reduce(
      (sum, deduction) => sum + (Number(deduction.amount) || 0), 
      0
    );
    return gross - totalDeductions;
  };

  const calculateTotalTHP = () => {
    return formData.incomes.reduce(
      (total, income) => total + calculateNetAmount(income), 
      0
    );
  };


  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Validasi
    const newErrors = {};

    if (!formData.user_id) {
      newErrors.user_id = "Pilih user terlebih dahulu";
    }

    if (!formData.bulan) {
      newErrors.bulan = "Pilih bulan terlebih dahulu";
    }

    if (!formData.tahun) {
      newErrors.tahun = "Pilih tahun terlebih dahulu";
    }

    formData.incomes.forEach((income, index) => {
      if (!income.category_id) {
        newErrors[`incomes.${index}.category_id`] = "Pilih kategori income";
      }
      if (!income.gross_amount || Number(income.gross_amount) <= 0) {
        newErrors[`incomes.${index}.gross_amount`] = "Amount income harus diisi";
      }
      
      income.deductions.forEach((deduction, dIndex) => {
        if (!deduction.deduction_type_id) {
          newErrors[`incomes.${index}.deductions.${dIndex}.deduction_type_id`] = "Tipe potongan harus dipilih";
        }
        if (!deduction.amount || Number(deduction.amount) <= 0) {
          newErrors[`incomes.${index}.deductions.${dIndex}.amount`] = "Amount potongan harus diisi";
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Panggil fungsi onSubmit dari parent
    onSubmit(formData);
  };

  // Options untuk bulan
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1)
  }));

  // Options untuk tahun
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - 2 + i,
    label: currentYear - 2 + i
  }));

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === "edit" ? "Edit Payroll" : "Buat Payroll Baru"}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Informasi Dasar */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Informasi Dasar</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                  <Form.Label>
                    Nama User <span className="text-danger">*</span>
                  </Form.Label>

                  <Select
                    options={userOptions}
                    placeholder="Cari user..."
                    isSearchable
                    isClearable
                    value={userOptions?.find(
                      (opt) => opt.value == formData.user_id
                    )}
                    onChange={(selected) =>
                      setFormData({
                        ...formData,
                        user_id: selected ? selected.value : "",
                      })
                    }
                    classNamePrefix="react-select"
                    className={errors.user_id ? "is-invalid" : ""}
                  />

                  {errors.user_id && (
                    <div className="invalid-feedback d-block">
                      {errors.user_id}
                    </div>
                  )}
                </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bulan <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={formData.bulan}
                      onChange={(e) => setFormData({...formData, bulan: e.target.value})}
                      isInvalid={!!errors.bulan}
                    >
                      {monthOptions.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.bulan}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tahun <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={formData.tahun}
                      onChange={(e) => setFormData({...formData, tahun: e.target.value})}
                      isInvalid={!!errors.tahun}
                    >
                      {yearOptions.map(year => (
                        <option key={year.value} value={year.value}>{year.label}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.tahun}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Income Categories */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Income Categories</h5>
                <Button variant="outline-primary" size="sm" onClick={addIncome}>
                  <FaPlus className="me-1" /> Tambah Income
                </Button>
              </div>

              {formData.incomes.map((income, incomeIndex) => (
                <Card key={incomeIndex} className="mb-3 border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Income #{incomeIndex + 1}</h6>
                      {formData.incomes.length > 1 && (
                        <Button variant="outline-danger" size="sm" onClick={() => removeIncome(incomeIndex)}>
                          <FaTrash /> Hapus
                        </Button>
                      )}
                    </div>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Kategori Income <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={income.category_id} // ini string
                            onChange={(e) => updateIncome(incomeIndex, 'category_id', e.target.value)} // e.target.value = string
                          >
                            <option value="">Pilih Kategori</option>
                            {masterData.income_categories?.map(category => (
                              <option key={category.id} value={category.id.toString()}>
                                {category.name}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors[`incomes.${incomeIndex}.category_id`]}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Amount Income (Rp) <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="1"
                            value={income.gross_amount || ''}
                            onChange={(e) => {
                              // Biarkan apa adanya — simpan sebagai string
                              updateIncome(incomeIndex, 'gross_amount', e.target.value);
                            }}
                            // ❌ HAPUS onBlur yang auto-round
                            placeholder="Masukkan amount"
                            isInvalid={!!errors[`incomes.${incomeIndex}.gross_amount`]}
                          />
                            <Form.Control.Feedback type="invalid">
                            {errors[`incomes.${incomeIndex}.gross_amount`]}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Potongan untuk income ini */}
                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Potongan</h6>
                        <Button variant="outline-success" size="sm" onClick={() => addDeduction(incomeIndex)}>
                          <FaPlus className="me-1" /> Tambah Potongan
                        </Button>
                      </div>

                      {income.deductions.map((deduction, deductionIndex) => (
                        <Card key={deductionIndex} className="mb-2 border-secondary">
                          <Card.Body className="py-2">
                            <Row className="align-items-center">
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Jenis Potongan</Form.Label>
                                  <Form.Select
                                    value={deduction.deduction_type_id || ""}
                                    onChange={(e) => updateDeduction(incomeIndex, deductionIndex, 'deduction_type_id', e.target.value)}
                                  >
                                    <option value="">Pilih Tipe Potongan</option>
                                    {masterData.deduction_types?.map(type => (
                                      <option key={type.id} value={type.id.toString()}>
                                        {type.name}
                                      </option>
                                    ))}
                                  </Form.Select>

                                  <Form.Control.Feedback type="invalid">
                                    {errors[`incomes.${incomeIndex}.deductions.${deductionIndex}.deduction_type_id`]}
                                  </Form.Control.Feedback>
                                </Form.Group>
                              </Col>

                              <Col md={4}>
                                <Form.Group className="mb-2">
                                  <Form.Control
                                    type="number"
                                    min="0"
                                    value={deduction.amount || ''}
                                    onChange={(e) => {
                                      // Simpan nilai mentah (string atau number kosong)
                                      const rawValue = e.target.value;
                                      updateDeduction(incomeIndex, deductionIndex, 'amount', rawValue);
                                    }}
                                    placeholder="Amount potongan"
                                    isInvalid={!!errors[`incomes.${incomeIndex}.deductions.${deductionIndex}.amount`]}
                                  />
                                  <Form.Control.Feedback type="invalid">
                                    {errors[`incomes.${incomeIndex}.deductions.${deductionIndex}.amount`]}
                                  </Form.Control.Feedback>
                                </Form.Group>
                              </Col>
                              <Col md={2} className="text-end">
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => removeDeduction(incomeIndex, deductionIndex)}
                                >
                                  <FaTrash />
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}

                      {/* Ringkasan per income */}
                      <Alert variant="light" className="mt-3">
                        <div className="d-flex justify-content-between">
                          <div>
                            <strong>Gross:</strong> {formatRupiah(Number(income.gross_amount) || 0)}
                          </div>
                          <div>
                            <strong>Total Potongan:</strong> {formatRupiah(income.deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0))}
                          </div>
                          <div>
                            <strong>Net:</strong> {formatRupiah(calculateNetAmount(income))}
                          </div>
                        </div>
                      </Alert>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>

          {/* Ringkasan Akhir */}
          <Card className="mb-3">
            <Card.Body>
              <h5 className="mb-3">Ringkasan</h5>
              <Row>
                <Col md={6}>
                  <Alert variant="info">
                    <div className="d-flex justify-content-between">
                      <span><strong>User:</strong></span>
                      <span>{masterData.users?.find(u => u.id == formData.user_id)?.name || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span><strong>Periode:</strong></span>
                      <span>{getMonthName(formData.bulan)} {formData.tahun}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span><strong>Total Income Categories:</strong></span>
                      <span>{formData.incomes.length}</span>
                    </div>
                  </Alert>
                </Col>
                <Col md={6}>
                  <Alert variant="success">
                    <div className="text-center">
                      <h4>Total Take Home Pay</h4>
                      <h3 className="mb-0">{formatRupiah(calculateTotalTHP())}</h3>
                    </div>
                  </Alert>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading
              ? "Menyimpan..."
              : mode === "edit"
                ? "Update Payroll"
                : "Simpan Payroll"}
          </Button>

        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const Advanced = () => {
  const { hasPermission } = useAuthContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [users, setUsers] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [masterDataLoading, setMasterDataLoading] = useState(true);

  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [masterData, setMasterData] = useState({
    users: [],
    income_categories: []
  });

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");

      // jika API langsung return array
      setUsers(response.data);

      // ⬇️ kalau API kamu pakai wrapper (opsional)
      // setUsers(response.data.data);

    } catch (error) {
      console.error("Gagal fetch users:", error);
    }
  };
   const handleEditClick = (row) => {
    if (masterDataLoading || !masterData.income_categories || !masterData.deduction_types) {
      // Opsional: tampilkan notifikasi
      Swal.fire("Mohon tunggu", "Sedang memuat data master...", "info");
      return;
    }
    setSelectedPayroll(row.original);
    setShowEditModal(true);
  };

  // ===== Fetch Payroll Data =====
  const fetchData = async (bulan = '', tahun = '') => {
    try {
      setLoading(true);
      setErr(null);
      
      // Bangun query string
      const params = new URLSearchParams();
      if (bulan) params.append('bulan', bulan);
      if (tahun) params.append('tahun', tahun);
      
      const url = `/payrolls${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      if (response.data.success) {
        setData(response.data.data.data || response.data.data || []);
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
      console.error('Error fetching payroll:', e);
    } finally {
      setLoading(false);
    }
  };

  // ===== Fetch Master Data =====
  const fetchMasterData = async () => {
    try {
      setMasterDataLoading(true); // ← tambahkan
      const response = await api.get('/payrolls-master-data');
      if (response.data.success) {
        setMasterData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setMasterDataLoading(false); // ← ini penting
    }
  };

  useEffect(() => {
    fetchData();
    fetchMasterData();
    fetchUsers();
  }, []);

  const handleFilterChange = (bulan, tahun) => {
    setFilterBulan(bulan);
    setFilterTahun(tahun);
    fetchData(bulan, tahun);
  };
  // ===== Handle Create Payroll =====
  const handleCreateSubmit = async (formData) => {
    try {
      setModalLoading(true);
      
      // Format data untuk API
      const payload = {
        user_id: formData.user_id,
        bulan: parseInt(formData.bulan),
        tahun: parseInt(formData.tahun),
        incomes: formData.incomes.map(income => ({
        category_id: income.category_id,
          gross_amount: Number(income.gross_amount), // HAPUS Math.round()
          deductions: income.deductions.map(deduction => ({
            deduction_type_id: deduction.deduction_type_id,
            amount: Number(deduction.amount) // HAPUS Math.round()
          }))
        }))
      };

      const response = await api.post('/payrolls', payload);
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Payroll berhasil dibuat',
          timer: 2000,
          showConfirmButton: false
        });
        
        setShowCreateModal(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal membuat payroll';
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: message,
        confirmButtonText: 'OK'
      });
    }
    finally {
      setModalLoading(false);
    }
  };

  // ===== Handle Delete =====
  const handleDelete = async (row) => {
    Swal.fire({
      title: "Yakin hapus?",
      text: `Payroll ${row.user_name} akan dihapus!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await api.delete(`/payrolls/${row.id}`);
        Swal.fire("Berhasil!", "Payroll berhasil dihapus.", "success");
        fetchData(); // Refresh data
      } catch (e) {
        Swal.fire("Gagal", e?.response?.data?.message || "Gagal menghapus data", "error");
      }
    });
  };

  // ===== Handle View Detail =====
 const handleViewDetail = (row) => {
  Swal.fire({
    title: `Detail Payroll - ${row.user_name}`,
    html: `
      <div class="text-start">
        <p><strong>Periode:</strong> ${getMonthName(row.bulan)} ${row.tahun}</p>
        <p><strong>Total Take Home Pay:</strong> ${formatRupiah(row.total_thp)}</p>
        <p><strong>Total Potongan:</strong> ${formatRupiah(row.total_deductions)}</p>

        <hr>
        <h6>Pendapatan per Kategori:</h6>
        <ul>
          ${row.income_breakdown ? Object.entries(row.income_breakdown).map(([category, info]) => `
            <li>
              <strong>${category}</strong>: 
              Pendapatan Sebelum Potongan: ${formatRupiah(info.gross)}, 
              Potongan: ${formatRupiah(info.deductions)}, 
              Pendapatan Bersih: ${formatRupiah(info.net)}
            </li>
          `).join("") : "<li>-</li>"}
        </ul>

        <hr>
        <h6>Detail Potongan:</h6>
        <ul>
          ${row.payrollIncomes ? row.payrollIncomes.flatMap(income =>
            income.deductions.map(d => `
              <li>
                <strong>${income.category?.name || "-"} → ${d.deduction_type?.name || "Unknown"}</strong>: ${formatRupiah(d.amount)}
              </li>
            `)
          ).join("") : "<li>-</li>"}
        </ul>
      </div>
    `,
    icon: 'info',
    width: 650,
    showCloseButton: true
  });
};



  // ===== Columns Definition =====
  const columns = [
    { 
      Header: "No", 
      accessor: "no", 
      sort: true,
      Cell: ({ row }) => row.index + 1
    },
    { 
      Header: "Nama", 
      accessor: "user_name", 
      sort: true 
    },
    { 
      Header: "Bulan", 
      accessor: "bulan", 
      sort: true,
      Cell: ({ value }) => getMonthName(value)
    },
    { 
      Header: "Tahun", 
      accessor: "tahun", 
      sort: true 
    },
    {
      Header: "Kategori Income",
      accessor: (row) => {
        if (!row.income_breakdown || Object.keys(row.income_breakdown).length === 0) return "-";
        return Object.keys(row.income_breakdown).join(", ");
      },
      sort: true
    },
    { 
      Header: "Total Potongan", 
      accessor: "total_deductions", 
      sort: true,
      Cell: ({ value }) => formatRupiah(value)
    },
    { 
      Header: "Take Home Pay", 
      accessor: "total_thp", 
      sort: true,
      Cell: ({ value }) => formatRupiah(value)
    },
    {
      Header: "Aksi",
      Cell: ({ row }) => {
        // Cek permission
        const canUpdate = hasPermission("Payroll.update");
        const canDelete = hasPermission("Payroll.delete");
        
        return (
          <div className="d-flex gap-2">
            <FaEye
              className="text-info"
              style={{ cursor: "pointer" }}
              onClick={() => handleViewDetail(row.original)}
              title="Lihat Detail"
            />
            {canUpdate && (
              <FaEdit
                className="text-warning"
                style={{ cursor: "pointer" }}
                onClick={() => handleEditClick(row)} // ← ganti ke fungsi baru
                title="Edit"
              />
            )}
            {canDelete && (
              <FaTrash
                className="text-danger"
                style={{ cursor: "pointer" }}
                onClick={() => handleDelete(row.original)}
                title="Hapus"
              />
            )}
          </div>
        );
      },
    },
  ];

  const handleEditSubmit = async (formData) => {
    try {
      setModalLoading(true);

      const payload = {
        user_id: formData.user_id,
        bulan: Number(formData.bulan),
        tahun: Number(formData.tahun),
        incomes: formData.incomes.map(income => ({
          category_id: income.category_id,
          gross_amount: Math.round(Number(income.gross_amount)),
          deductions: income.deductions.map(d => ({
            deduction_type_id: d.deduction_type_id,
            amount: Math.round(Number(d.amount))
          }))
        }))
      };

      await api.put(`/payrolls/${selectedPayroll.id}`, payload);

      Swal.fire("Berhasil", "Payroll berhasil diperbarui", "success");
      setShowEditModal(false);
      fetchData();

    } catch (e) {
      const message = e.response?.data?.message || "Gagal update payroll";
      Swal.fire("Gagal", message, "error");
    }
    finally {
      setModalLoading(false);
    }
  };

 


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
          { label: "Payroll", path: "/payroll" },
          { label: "Rekap Take Home Pay", path: "/payroll/rekap", active: true },
        ]}
        title={"Rekap Take Home Pay"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="header-title mb-0">Rekap Take Home Pay</h4>
                
                {hasPermission("Payroll.create") && (
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <FaPlus className="me-1" /> Buat Payroll
                  </Button>
                )}
              </div>
              <div className="d-flex gap-2 mb-3">
                  <Form.Select
                    value={filterBulan}
                    onChange={(e) => handleFilterChange(e.target.value, filterTahun)}
                    size="sm"
                    style={{ width: "140px" }}
                  >
                    <option value="">Semua Bulan</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Select
                    value={filterTahun}
                    onChange={(e) => handleFilterChange(filterBulan, e.target.value)}
                    size="sm"
                    style={{ width: "100px" }}
                  >
                    <option value="">Semua Tahun</option>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </Form.Select>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setFilterBulan('');
                      setFilterTahun('');
                      fetchData();
                    }}
                  >
                    Reset
                  </Button>
                </div>
              {err && (
                <Alert variant="danger" onClose={() => setErr(null)} dismissible className="mb-3">
                  {err}
                </Alert>
              )}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">Belum ada data payroll</p>
                  {hasPermission("Payroll.create") && (
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                      <FaPlus className="me-1" /> Buat Payroll Pertama
                    </Button>
                  )}
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
                  searchPlaceholder="Cari nama..."
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Buat Payroll */}
      <PayrollFormModal
          show={showCreateModal}
          handleClose={() => setShowCreateModal(false)}
          masterData={{
            ...masterData,
            users: users,
          }}
          onSubmit={handleCreateSubmit}
          loading={modalLoading}
          mode="create"
        />
        {showEditModal && !masterDataLoading && masterData.income_categories && masterData.deduction_types && (
          <PayrollFormModal
          
            key={`edit-${selectedPayroll?.id || 'new'}`} // ⬅️ ini penting!
            show={showEditModal}
            handleClose={() => setShowEditModal(false)}
            masterData={{
              ...masterData,
              users: users,
            }}
            onSubmit={handleEditSubmit}
            loading={modalLoading}
            mode="edit"
            initialData={selectedPayroll}
          />
        )}
    </>
  );
};

export default Advanced;