import { useEffect, useState, useRef } from "react";
import { Card, Button, Form, Image, Spinner, Alert } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import imageCompression from 'browser-image-compression';


const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
const API = `${API_BASE}/izin`;
const API_PERIHAL = `${API_BASE}/perihal-izin`;
const API_USERS = `${API_BASE}/users`;

const FormIzin = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuthContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [perihalList, setPerihalList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loadingPerihal, setLoadingPerihal] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [buktiFile, setBuktiFile] = useState(null);
  const [buktiPreview, setBuktiPreview] = useState("");
  const [customPerihal, setCustomPerihal] = useState("");
  const [terlambatSampai, setTerlambatSampai] = useState("");
  const [validationError, setValidationError] = useState(""); // Untuk menampilkan error validasi

  const fileInputRef = useRef(null);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    user_id: "",
    perihal_izin_id: "",
    detail: "",
    bukti: "",
    status: "belum approve",
    catatan_penolakan: "",
    datetime: "",
  });

  const token = localStorage.getItem("authToken");
  const authHeader = { Authorization: `Bearer ${token}` };

  // Fetch daftar perihal
  const fetchPerihal = async () => {
    try {
      const res = await axios.get(API_PERIHAL, { headers: authHeader });
      setPerihalList(res.data.message || []);
    } catch (err) {
      console.error("Fetch perihal error", err);
    } finally {
      setLoadingPerihal(false);
    }
  };

    const resetFormState = () => {
    setBuktiFile(null);
    setBuktiPreview("");
    setFormErrors({});
    setValidationError("");
    
    // Reset file input DOM element
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch daftar user
  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_USERS, { headers: authHeader });
      let users = res.data || [];
      if (currentUser.role?.name === "Direktur") {
        users = users.filter((u) => u.holding_id === currentUser.holding_id);
      }
      setUserList(users);
    } catch (err) {
      console.error("Fetch users error", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch detail izin untuk edit
  const fetchDetail = async () => {
    if (mode === "edit" && id) {
      try {
        const res = await axios.get(`${API}/${id}`, { headers: authHeader });
        const izin = res.data.message;

        if (
          currentUser.role?.name !== "Superadmin" &&
          currentUser.role?.name !== "Direktur" &&
          currentUser.role?.name !== "Admin" &&
          izin.user_id !== currentUser.id
        ) {
          Swal.fire("Tidak Diizinkan", "Tidak punya akses edit", "error");
          navigate("/izin/index");
          return;
        }

        setFormData({
          user_id: izin.user_id ?? "",
          perihal_izin_id: izin.perihal_izin_id ?? "",
          detail: izin.detail ?? "", 
          bukti: izin.bukti ?? "",
          status: izin.status ?? "belum approve",
          catatan_penolakan: izin.catatan_penolakan ?? "",
          datetime: izin.datetime ?? "",
        });

        if (izin.bukti) {
          const url = `${API_BASE.replace(/\/api$/, "")}/storage/${izin.bukti}`;
          setBuktiPreview(url);
        }

        if (izin.terlambat_sampai) {
          setTerlambatSampai(izin.terlambat_sampai);
        }
      } catch (err) {
        Swal.fire("Gagal", "Data tidak ditemukan", "error");
        navigate("/izin/index");
      }
    }
  };

  useEffect(() => {
    fetchPerihal();
    if (["Superadmin", "Admin", "Direktur"].includes(currentUser.role?.name)) fetchUsers();
    if (mode === "edit") fetchDetail();
    else
      setFormData((f) => ({
        ...f,
        user_id: ["Superadmin", "Admin", "Direktur"].includes(currentUser.role?.name)
          ? ""
          : currentUser.id,
      }));
  }, []);

  // Fungsi untuk validasi waktu terlambat
  const validateTerlambatSampai = (time) => {
    if (!time) return true;
    
    const selectedPerihal = perihalList.find(p => String(p.id) === String(formData.perihal_izin_id));
    const maksimalWaktu = selectedPerihal?.maksimal_izin_terlambat;
    
    if (!maksimalWaktu) return true;
    
    // Konversi waktu ke menit untuk perbandingan
    const [inputHours, inputMinutes] = time.split(':').map(Number);
    const [maxHours, maxMinutes] = maksimalWaktu.split(':').map(Number);
    
    const inputTotalMinutes = inputHours * 60 + inputMinutes;
    const maxTotalMinutes = maxHours * 60 + maxMinutes;
    
    return inputTotalMinutes <= maxTotalMinutes;
  };

  // Handle perubahan waktu terlambat
  const handleTerlambatSampaiChange = (e) => {
    const time = e.target.value;
    setTerlambatSampai(time);
    
    // Validasi real-time
    if (time) {
      const isValid = validateTerlambatSampai(time);
      if (!isValid) {
        const selectedPerihal = perihalList.find(p => String(p.id) === String(formData.perihal_izin_id));
        setValidationError(`Waktu terlambat tidak boleh melebihi ${selectedPerihal?.maksimal_izin_terlambat}`);
      } else {
        setValidationError("");
      }
    } else {
      setValidationError("");
    }
  };

  // Handle perubahan form
  const handleChange = async (e) => {
    const value = e.target.value;

    // Tambah perihal baru
    if (e.target.name === "perihal_izin_id" && value === "lainnya") {
      const { value: inputValue } = await Swal.fire({
        title: "Perihal lainnya",
        input: "text",
        inputLabel: "Masukkan perihal izin baru",
        inputPlaceholder: "Contoh: Rapat mendadak",
        showCancelButton: true,
      });

      if (inputValue) {
        try {
          const res = await axios.post(
            API_PERIHAL,
            {
              perhal: inputValue,
              deskripsi: `Input custom oleh ${currentUser.name}`,
              maksimal_izin_terlambat: "00:00",
            },
            { headers: authHeader }
          );
          const newPerihalId = res.data.data.id;
          await fetchPerihal();
          setFormData({ ...formData, perihal_izin_id: newPerihalId });
          Swal.fire("Berhasil", "Perihal baru berhasil ditambahkan", "success");
        } catch (err) {
          console.error(err);
          Swal.fire("Gagal", "Tidak bisa menambahkan perihal baru", "error");
          setFormData({ ...formData, perihal_izin_id: "" });
        }
      } else {
        setFormData({ ...formData, perihal_izin_id: "" });
      }

      return;
    }

    // Reset jam terlambat dan error validasi jika perihal diganti
    if (e.target.name === "perihal_izin_id") {
      setTerlambatSampai("");
      setValidationError("");
    }

    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleBuktiChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear error
    if (formErrors.bukti) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.bukti;
        return newErrors;
      });
    }

    // Reset preview sebelumnya
    if (buktiPreview) {
      URL.revokeObjectURL(buktiPreview);
    }

    // DETEKSI LEBIH AKURAT FILE DARI KAMERA
    const isFromCamera = 
      file.size > 2 * 1024 * 1024 || // >2MB
      file.type === 'image/heic' ||   // iPhone format
      file.type === 'image/heif' ||   // iPhone format lain
      file.name.match(/^(IMG_|PXL_|DSC_)/i) || // Nama file kamera
      file.name.match(/\.(heic|heif)$/i); // Ekstensi iPhone
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    try {
      let finalFile = file;
      let compressionApplied = false;
      
      // KOMPRESI OTOMATIS UNTUK SEMUA GAMBAR (tidak hanya dari kamera)
      if (file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Memproses Foto...',
          html: `Mengoptimasi gambar<br><small>${formatBytes(file.size)} → target ${isFromCamera ? '500KB' : '800KB'}</small>`,
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        // SETTING KOMPRESI BERDASARKAN SUMBER FILE
        const options = {
          maxSizeMB: isFromCamera ? 0.5 : 0.8, // Kamera: 500KB, Gallery: 800KB
          maxWidthOrHeight: isFromCamera ? 1024 : 1280, // Lebih kecil untuk kamera
          initialQuality: isFromCamera ? 0.6 : 0.7, // Quality lebih rendah untuk kamera
          useWebWorker: true,
          fileType: 'image/jpeg', // SELALU konversi ke JPEG untuk konsistensi
          preserveExif: false, // Hapus EXIF data (kurangi ukuran)
        };
        
        try {
          finalFile = await imageCompression(file, options);
          compressionApplied = true;
          
          // PAKSA rename ke .jpg untuk semua gambar
          finalFile = new File(
            [finalFile],
            file.name.replace(/\.[^/.]+$/, ".jpg"), // Ganti semua ekstensi ke .jpg
            { type: 'image/jpeg' }
          );
          
          Swal.close();
          
          console.log(`📸 Kompresi ${compressionApplied ? 'berhasil' : 'gagal'}:`, {
            original: `${formatBytes(file.size)} (${file.type})`,
            compressed: `${formatBytes(finalFile.size)} (${finalFile.type})`,
            reduction: `${Math.round((1 - finalFile.size/file.size) * 100)}%`
          });
          
        } catch (compressError) {
          console.warn('Kompresi gagal, gunakan file asli:', compressError);
          finalFile = file; // Fallback ke file asli
          compressionApplied = false;
        }
      }

      // Validasi ukuran akhir SETELAH KOMPRESI
      if (finalFile.size > maxSize) {
        Swal.fire({
          icon: 'error',
          title: 'File masih terlalu besar',
          html: `Ukuran akhir: <strong>${formatBytes(finalFile.size)}</strong><br>
                Maksimal: 10MB<br><br>
                <strong>Detail:</strong><br>
                • Asli: ${formatBytes(file.size)}<br>
                • Kompresi: ${compressionApplied ? '✓' : '✗'}<br><br>
                <strong>Solusi:</strong><br>
                <div class="text-start">
                1. <u>Screenshot</u> foto tersebut (biasanya < 2MB)<br>
                2. Pilih "UKURAN KECIL" saat ambil foto<br>
                3. Edit di Gallery → Crop/Resize<br>
                4. Gunakan WiFi untuk upload besar
                </div>`,
          confirmButtonText: 'Paham'
        });
        
        // Reset input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setBuktiFile(null);
        setBuktiPreview("");
        return;
      }

      // TAMPILKAN INFO KOMPRESI BERHASIL
      if (compressionApplied) {
        const reductionPercent = Math.round((1 - finalFile.size/file.size) * 100);
        if (reductionPercent > 50) {
          Swal.fire({
            icon: 'success',
            title: 'Foto dioptimasi!',
            html: `Ukuran dikurangi <strong>${reductionPercent}%</strong><br>
                  <small>${formatBytes(file.size)} → ${formatBytes(finalFile.size)}</small>`,
            timer: 2000,
            showConfirmButton: false
          });
        }
      }

      // Update preview dengan file terkompresi
      const previewUrl = URL.createObjectURL(finalFile);
      setBuktiPreview(previewUrl);
      setBuktiFile(finalFile);
      
      // Cleanup memory setelah 30 detik
      setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
      }, 30000);
      
    } catch (error) {
      console.error('Error processing file:', error);
      Swal.close();
      
      // FALLBACK STRATEGY
      if (file.size <= maxSize) {
        // File kecil, langsung pakai tanpa kompresi
        setBuktiFile(file);
        const previewUrl = URL.createObjectURL(file);
        setBuktiPreview(previewUrl);
        
        Swal.fire({
          icon: 'warning',
          title: 'Gunakan File Asli',
          html: `Kompresi gagal, menggunakan file asli.<br>
                <small>${formatBytes(file.size)} - Upload mungkin lebih lama</small>`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // File terlalu besar dan kompresi gagal
        Swal.fire({
          icon: 'error',
          title: 'Tidak dapat memproses',
          html: `<strong>Penyebab:</strong><br>
                1. Foto dari kamera premium (48MP+)<br>
                2. Format HEIC dari iPhone<br>
                3. Koneksi internet tidak stabil<br><br>
                
                <strong>Coba ini:</strong><br>
                <button class="btn btn-sm btn-outline-primary mt-2" onclick="
                  navigator.clipboard.writeText('Gunakan screenshot atau edit di gallery dulu');
                  alert('Tips disalin!');
                ">
                  📋 Salin Tips
                </button>`,
          confirmButtonText: 'OK'
        });
        
        // Reset
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setBuktiFile(null);
        setBuktiPreview("");
      }
    }
  };

  // Tambahkan function ini di luar component
const getOptimalCompression = (file) => {
  const configs = {
    // iPhone HEIC (biasanya besar)
    'heic': { maxSizeMB: 0.4, maxDim: 960, quality: 0.5 },
    // Android kamera tinggi
    'high-res': { maxSizeMB: 0.5, maxDim: 1024, quality: 0.6 },
    // Screenshot/WhatsApp (sudah kecil)
    'low-res': { maxSizeMB: 0.8, maxDim: 1280, quality: 0.7 },
    // Default
    'default': { maxSizeMB: 0.6, maxDim: 1152, quality: 0.65 }
  };

  if (file.type === 'image/heic' || file.type === 'image/heif') {
    return configs.heic;
  }
  
  if (file.size > 8 * 1024 * 1024) { // >8MB
    return configs['high-res'];
  }
  
  if (file.size < 1 * 1024 * 1024) { // <1MB
    return configs['low-res'];
  }
  
  return configs.default;
};

// Format bytes helper (sudah ada, pastikan tersedia)
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};



  // Validasi form sebelum submit
  const validateForm = () => {
    // Validasi waktu terlambat
    if (terlambatSampai) {
      const isValid = validateTerlambatSampai(terlambatSampai);
      if (!isValid) {
        const selectedPerihal = perihalList.find(p => String(p.id) === String(formData.perihal_izin_id));
        Swal.fire("Validasi Gagal", `Waktu terlambat tidak boleh melebihi ${selectedPerihal?.maksimal_izin_terlambat}`, "error");
        return false;
      }
    }
    
    return true;
  };

 
 // Submit form
  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Reset errors terlebih dahulu
  setFormErrors({});
  setValidationError("");
  
  // Validasi form sebelum submit
  if (!validateForm()) {
    return;
  }
  
  setIsSubmitting(true);

  try {
    let perihalId = formData.perihal_izin_id;

    const form = new FormData();
    form.append("user_id", formData.user_id ?? "");
    form.append("perihal_izin_id", perihalId);
    form.append("detail", formData.detail ?? "");
    form.append("status", formData.status ?? "belum approve");
    form.append("catatan_penolakan", formData.catatan_penolakan ?? "");

    if (formData.datetime) {
      const dt = formData.datetime.replace("T", " ") + ":00";
      form.append("datetime", dt);
    }

    if (buktiFile) {
      form.append("bukti", buktiFile);
    }

    // Append terlambat_sampai jika Izin Terlambat
    const selectedPerihal = perihalList.find(p => String(p.id) === String(formData.perihal_izin_id));
    if (selectedPerihal?.perhal === "Izin Terlambat") {
      form.append("terlambat_sampai", terlambatSampai);
    }

    let response;
    if (mode === "edit") {
      form.append("_method", "PUT");
      response = await axios.post(`${API}/${id}`, form, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
    } else {
      response = await axios.post(API, form, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
    }

    // Jika berhasil
    if (response.data.success || response.status === 200 || response.status === 201) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: mode === "edit" ? "Izin berhasil diperbarui" : "Izin berhasil ditambahkan",
        timer: 2000
      }).then(() => {
        navigate("/izin/index");
      });
    }

  } catch (err) {
    console.error('Detail error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      config: err.config
    });

    // DETEKSI TIMEOUT (upload terlalu lama)
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      Swal.fire({
        icon: 'warning',
        title: 'Upload Terlalu Lama',
        html: `<strong>Penyebab:</strong><br>
               • Foto dari kamera terlalu besar<br>
               • Koneksi internet lambat<br><br>
               <strong>Solusi:</strong><br>
               • Edit foto di gallery (crop/resize)<br>
               • Gunakan WiFi yang stabil<br>
               • Ambil foto dengan resolusi lebih rendah`,
        confirmButtonText: 'OK'
      });
    }
    // DETEKSI FILE TERLALU BESAR (413 - Payload Too Large)
    else if (err.response?.status === 413) {
      Swal.fire({
        icon: 'error',
        title: 'File Melebihi Batas Server',
        html: `Ukuran maksimal: 10MB<br><br>
               <strong>Penyebab:</strong><br>
               Foto langsung dari kamera sering berukuran 5-15MB<br><br>
               <strong>Cara mengatasi:</strong><br>
               1. Edit foto di gallery (crop/resize)<br>
               2. Matikan "High Efficiency" di iPhone (Settings → Camera → Formats)<br>
               3. Screenshot foto, lalu upload hasil screenshot`,
        confirmButtonText: 'OK'
      });
    }
    // DETEKSI OFFLINE BENERAN
    else if (err.message.includes('Network Error') || !navigator.onLine) {
      Swal.fire({
        icon: 'error',
        title: 'Tidak Ada Koneksi Internet',
        text: 'Periksa sinyal/WiFi Anda dan coba lagi.',
        confirmButtonText: 'OK'
      });
    }
    // ERROR VALIDASI LARAVEL (422)
    else if (err.response?.status === 422) {
      const backendErrors = err.response.data.errors || err.response.data.message;
      
      if (typeof backendErrors === 'object') {
        setFormErrors(backendErrors);
        
        const errorMessages = Object.entries(backendErrors)
          .map(([field, messages]) => 
            `<strong>${fieldToLabel(field)}:</strong> ${Array.isArray(messages) ? messages.join('<br>') : messages}`
          )
          .join('<br><br>');
        
        Swal.fire({
          icon: "error",
          title: "Validasi Gagal",
          html: errorMessages,
          confirmButtonText: "OK"
        }).then(() => {
          if (backendErrors.bukti) {
            resetFormState();
          }
        });
      } else if (typeof backendErrors === 'string') {
        Swal.fire("Gagal", backendErrors, "error").then(() => {
          resetFormState();
        });
      }
    }
    // ERROR UMUM DARI BACKEND
    else if (err.response?.data?.message) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response.data.message,
        confirmButtonText: 'OK'
      }).then(() => {
        resetFormState();
      });
    }
    // ERROR LAINNYA
    else {
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        html: err.response?.data?.message || 
              'Server sedang bermasalah. Coba lagi dalam 1 menit',
        confirmButtonText: 'OK'
      });
    }

    resetFormState();
  } finally {
    setIsSubmitting(false);
  }
};

  const fieldToLabel = (field) => {
    const labels = {
      user_id: 'User',
      perihal_izin_id: 'Perihal',
      detail: 'Detail',
      bukti: 'Bukti',
      datetime: 'Tanggal',
      terlambat_sampai: 'Sampai Jam',
      catatan_penolakan: 'Catatan',
      status: 'Status'
    };
    
    return labels[field] || field.replace(/_/g, ' ');
  };


  // Dapatkan data perihal yang sedang dipilih
  const selectedPerihal = perihalList.find(p => String(p.id) === String(formData.perihal_izin_id));
  const isIzinTerlambat = selectedPerihal?.perhal === "Izin Terlambat";
  const maksimalWaktu = selectedPerihal?.maksimal_izin_terlambat;

  return (
    <Card className="p-4 mt-4">
      <h4>{mode === "edit" ? "Edit Izin" : "Tambah Izin"}</h4>
      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* User */}
        {["Superadmin", "Admin", "Direktur"].includes(currentUser.role?.name) ? (
          <Form.Group className="mb-3">
            <Form.Label>User</Form.Label>
            {loadingUsers ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <Form.Select name="user_id" value={formData.user_id} onChange={handleChange}>
                <option value="">-- Pilih User --</option>
                {userList.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Form.Select>
            )}
          </Form.Group>
        ) : (
          <Form.Group className="mb-3">
            <Form.Label>User</Form.Label>
            <Form.Control value={currentUser.name} disabled />
          </Form.Group>
        )}

        {/* Perihal */}
        <Form.Group className="mb-3">
          <Form.Label>Perihal</Form.Label>
          {loadingPerihal ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <>
              <Form.Select 
                name="perihal_izin_id" 
                value={formData.perihal_izin_id} 
                onChange={handleChange}
                isInvalid={!!formErrors.perihal_izin_id}
              >
                <option value="">-- Pilih Perihal --</option>
                {perihalList.map((p) => (
                  <option key={p.id} value={p.id}>{p.perhal}</option>
                ))}
                {/* <option value="lainnya">Lainnya</option> */}
              </Form.Select>
              {formErrors.perihal_izin_id && (
                <Form.Text className="text-danger">
                  {Array.isArray(formErrors.perihal_izin_id) ? formErrors.perihal_izin_id.join(', ') : formErrors.perihal_izin_id}
                </Form.Text>
              )}
            </>
          )}
        </Form.Group>

        {/* Detail - TEXTAREA UNTUK PENJELASAN */}
        <Form.Group className="mb-3">
          <Form.Label>Detail / Keterangan</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="detail"
            value={formData.detail || ''}
            onChange={handleChange}
            placeholder="Jelaskan detail izin Anda..."
            isInvalid={!!formErrors.detail}
          />
          {formErrors.detail && (
            <Form.Text className="text-danger">
              {Array.isArray(formErrors.detail) ? formErrors.detail.join(', ') : formErrors.detail}
            </Form.Text>
          )}
        </Form.Group>

        {/* Input Sampai Jam jika Izin Terlambat */}
        {isIzinTerlambat && (
          <Form.Group className="mb-3">
            <Form.Label>
              Sampai Jam {maksimalWaktu && <small className="text-muted">(Maksimal: {maksimalWaktu})</small>}
            </Form.Label>
            <Form.Control
              type="time"
              value={terlambatSampai}
              onChange={handleTerlambatSampaiChange}
              isInvalid={!!validationError}
              required={isIzinTerlambat}
            />
            {validationError && (
              <Form.Text className="text-danger">
                {validationError}
              </Form.Text>
            )}
            {maksimalWaktu && !validationError && (
              <Form.Text className="text-muted">
                Waktu terlambat maksimal yang diizinkan: {maksimalWaktu}
              </Form.Text>
            )}
          </Form.Group>
        )}

        {/* Upload File */}
        <Form.Group className="mb-3">
          <Form.Label>Bukti</Form.Label>
          <Form.Control
            ref={fileInputRef} // Tambahkan ref di sini
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.heic"
            onChange={handleBuktiChange}
            required={mode !== "edit" || !formData.bukti}
            isInvalid={!!formErrors.bukti}
          />
          {formErrors.bukti && (
            <Form.Text className="text-danger">
              {Array.isArray(formErrors.bukti) ? formErrors.bukti.join(', ') : formErrors.bukti}
            </Form.Text>
          )}
          
          {buktiPreview && (
            <>
              <Image src={buktiPreview} alt="preview" thumbnail style={{ width: 160 }} className="mt-2" />
              
            </>
          )}
          
        </Form.Group>

        {/* Tanggal */}
        <Form.Group className="mb-3">
          <Form.Label>Tanggal</Form.Label>
          <Form.Control
            type="date"
            name="datetime"
            value={formData.datetime ? formData.datetime.split("T")[0] : ""}
            onChange={(e) => {
              const today = new Date();
              const time = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
              setFormData({ ...formData, datetime: `${e.target.value}T${time}` });
            }}
            isInvalid={!!formErrors.datetime}
          />
          {formErrors.datetime && (
            <Form.Text className="text-danger">
              {Array.isArray(formErrors.datetime) ? formErrors.datetime.join(', ') : formErrors.datetime}
            </Form.Text>
          )}
        </Form.Group>

        <div className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => navigate("/izin/index")}>Batal</Button>
          <Button 
              variant="primary" 
              type="submit" 
              disabled={isSubmitting || !!validationError || Object.keys(formErrors).length > 0}
            >
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
        </div>
      </Form>
    </Card>
  );
};

export default FormIzin;