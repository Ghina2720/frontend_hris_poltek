import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button, Spinner, Alert, Modal, Form, Dropdown } from "react-bootstrap";
import PageTitle from "../../components/PageTitle";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { useLayoutContext } from "@/context/useLayoutContext"; 
import imageCompression from 'browser-image-compression';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

/* ======================= Konfigurasi Kompresi Gambar ======================= */
const compressImageOptions = {
  maxSizeMB: 1, // Maksimal 1MB setelah kompresi
  maxWidthOrHeight: 1024, // Resize ke maksimal 1024px lebar/tinggi
  useWebWorker: true, // Gunakan web worker untuk performa lebih baik
  fileType: 'image/jpeg', // Konversi ke JPEG untuk kompresi lebih baik
  initialQuality: 0.8, // Kualitas awal 80%
  preserveExif: false, // Tidak perlu metadata EXIF
};

// Fungsi untuk mengecek apakah file adalah gambar
const isImageFileType = (file) => {
  if (!file || !file.type) return false;
  return file.type.startsWith('image/');
};

// Fungsi untuk kompresi gambar
// Fungsi untuk kompresi gambar
// Fungsi untuk kompresi gambar
const compressImageFile = async (file) => {
  try {
    if (!isImageFileType(file)) {
      return file; // Kembalikan file asli jika bukan gambar
    }

    // Tampilkan notifikasi sedang mengkompresi
    Swal.fire({
      title: 'Mengkompresi Gambar...',
      text: 'Sedang mengoptimalkan ukuran gambar',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Kompres gambar
    const compressedBlob = await imageCompression(file, compressImageOptions);
    
    Swal.close();
    
    // Tampilkan informasi ukuran sebelum dan sesudah
    const originalSize = (file.size / 1024 / 1024).toFixed(2);
    const compressedSize = (compressedBlob.size / 1024 / 1024).toFixed(2);
    
    
    
    // ========== FIX: KONVERSI BLOB KE FILE ==========
 
    
    // Pertahankan nama file asli, ubah ekstensi ke .jpg jika perlu
    const originalName = file.name;
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const newFileName = `${nameWithoutExt}_compressed.jpg`;
    
    const compressedFile = new File([compressedBlob], newFileName, {
      type: 'image/jpeg', // Selalu gunakan JPEG untuk hasil kompresi
      lastModified: Date.now()
    });
    
    
    return compressedFile;
    
  } catch (error) {
    console.error('❌ Error kompresi gambar:', error);
    Swal.close();
    
    // Tampilkan warning jika kompresi gagal
    Swal.fire({
      title: 'Kompresi Gagal',
      text: 'Gambar akan diunggah tanpa kompresi',
      icon: 'warning',
      timer: 2000,
      showConfirmButton: false,
    });
    
    return file; // Kembalikan file asli jika gagal
  }
};

/* ======================= Trello-like Styles (improved) - DARK MODE SUPPORT ======================= */
const boardWrap = {
  display: "flex",
  gap: "12px",
  padding: "8px",
  overflowX: "auto",
  overflowY: "hidden",
  maxHeight: "calc(100vh - 220px)",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  alignItems: "flex-start",
};

// Fungsi untuk mendapatkan warna berdasarkan mode
const getColors = (isDark) => ({
  // Background colors
  bgPrimary: isDark ? "#1e1e1e" : "#ffffff",
  bgSecondary: isDark ? "#2d2d2d" : "#f1f2f4",
  bgTertiary: isDark ? "#3d3d3d" : "#ffffff",
  bgHover: isDark ? "#383838" : "#f8f9fa",
  
  // Text colors
  textPrimary: isDark ? "#ffffff" : "#172b4d",
  textSecondary: isDark ? "#b0b0b0" : "#5e6c84",
  textMuted: isDark ? "#888888" : "#6c757d",
  
  // Border colors
  borderPrimary: isDark ? "#444444" : "#dfe1e6",
  borderSecondary: isDark ? "#555555" : "#e4e6ea",
  borderMuted: isDark ? "#404040" : "#d0d4dc",
  
  // Shadow
  shadow: isDark ? "0 1px 0 rgba(255,255,255,0.1)" : "0 1px 0 rgba(9,30,66,.25)",
  shadowHover: isDark ? "0 6px 12px rgba(255,255,255,0.15)" : "0 6px 12px rgba(9,30,66,.2)",
});

// Komponen styled yang responsive terhadap dark mode
const ListCol = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        width: "272px",
        minWidth: "272px",
        background: colors.bgSecondary,
        borderRadius: "12px",
        boxShadow: colors.shadow,
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const ListHeader = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        padding: "10px 12px",
        fontWeight: 700,
        color: colors.textPrimary,
        borderBottom: `1px solid ${colors.borderSecondary}`,
        position: "sticky",
        top: 0,
        background: colors.bgSecondary,
        zIndex: 1,
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const ListBody = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        overflowY: "auto",
        flex: 1,
        maxHeight: "calc(100vh - 350px)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        background: colors.bgSecondary,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const ListFooter = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        padding: "8px",
        borderTop: `1px solid ${colors.borderSecondary}`,
        background: colors.bgSecondary,
        borderBottomLeftRadius: "12px",
        borderBottomRightRadius: "12px",
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const TrelloCard = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${colors.borderPrimary}`,
        borderRadius: "8px",
        background: colors.bgTertiary,
        boxShadow: colors.shadow,
        cursor: "pointer",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        transition: "transform .06s ease, box-shadow .06s ease",
        ...props.style
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = colors.shadowHover)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = colors.shadow)}
      {...props}
    >
      {children}
    </div>
  );
};

const trelloThumbWrap = (isDark) => ({
  width: "100%",
  aspectRatio: "16 / 9",
  overflow: "hidden",
  background: isDark ? "#383838" : "#E9ECEF",
  flexShrink: 0,
});

const TrelloCardContent = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        padding: "8px 10px",
        flex: 1,
        minHeight: "48px",
        background: colors.bgTertiary,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const TrelloTitle = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        fontWeight: 600,
        color: colors.textPrimary,
        lineHeight: 1.3,
        fontSize: "0.95rem",
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const TrelloDesc = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <div
      style={{
        fontSize: "0.82rem",
        color: colors.textSecondary,
        marginTop: 4,
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const trelloBadges = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 10px 10px 10px",
  marginTop: "-2px",
};

const Badge = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        color: colors.textSecondary,
        background: isDark ? "#383838" : "#f4f5f7",
        borderRadius: "6px",
        padding: "2px 6px",
        border: `1px solid ${isDark ? "#555555" : "#e1e4ea"}`,
        ...props.style
      }}
      {...props}
    >
      {children}
    </span>
  );
};

const checklistPill = (allDone, isDark) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "2px 8px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#fff",
  backgroundColor: allDone ? "#1f845a" : (isDark ? "#6c757d" : "#6c757d"),
});

const AddCardBtn = ({ isDark, children, ...props }) => {
  const colors = getColors(isDark);
  return (
    <Button
      style={{
        width: "100%",
        background: "transparent",
        border: `1px dashed ${colors.borderMuted}`,
        color: colors.textPrimary,
        fontWeight: 600,
        ...props.style
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

/* ======================= Helpers (file type) ======================= */
const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "heic", "heif", "svg"];
const isImageFile = (filename) => {
  if (!filename) return false;
  const ext = filename.split(".").pop()?.toLowerCase();
  return imageExts.includes(ext);
};

const getFileIcon = (filename) => {
  if (!filename) return "📄";
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "📕";
    case "doc":
    case "docx":
      return "📘";
    case "xls":
    case "xlsx":
      return "📗";
    case "ppt":
    case "pptx":
      return "📙";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "webp":
    case "heic":
    case "heif":
    case "svg":
      return "🖼️"; // UPDATE INI
    case "txt":
      return "📄";
    case "zip":
    case "rar":
      return "📦";
    default:
      return "📄";
  }
};

const getFileTypeText = (filename) => {
  if (!filename) return "File";
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
      return "Word";
    case "xls":
    case "xlsx":
      return "Excel";
    case "ppt":
    case "pptx":
      return "PowerPoint";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "webp":
    case "heic":
    case "heif":
    case "svg":
      return "Gambar"; // UPDATE INI
    case "txt":
      return "Text";
    case "zip":
    case "rar":
      return "Archive";
    default:
      return ext?.toUpperCase() || "File";
  }
};

/* ======================= Reusable: PasteableFileInput ======================= */
function PasteableFileInput({
  accept = ".jpg,.jpeg,.png,.gif,.bmp,.webp,.heic,.heif,.svg,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.ppt,.pptx",
  onFileSelected,           // (file|null)=>void
  previewUrl,               // string|null
  displayName,              // string|undefined (untuk label nama file)
  selectedFile,             // File|null -> untuk deteksi type image akurat
  disabled = false,
  label = "Klik di sini atau paste (Ctrl/Cmd+V) gambar yang sudah disalin (Maks. 10 MB)",
  autoFocusOnMount = true,  // auto fokus saat muncul
  enableGlobalPaste = true, // tangkap Ctrl/Cmd+V tanpa klik dulu
}) {
  const zoneRef = useRef(null);
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [compressing, setCompressing] = useState(false);


  const isImageByName = (name) => {
    if (!name) return false;
    const ext = name.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "bmp", "webp", "heic", "heif", "svg"].includes(ext || "");
  };

  const pickImageFromClipboardEvent = async (e) => {
    const cd = e.clipboardData;
    if (!cd) return null;

    // 1) Langsung dari files
    if (cd.files && cd.files.length) {
      const f = Array.from(cd.files).find((f) => f.type.startsWith("image/"));
      if (f) return f;
    }

    // 2) Dari items
    if (cd.items && cd.items.length) {
      for (const item of cd.items) {
        if (item.type?.startsWith("image/")) {
          const blob = item.getAsFile?.();
          if (blob) return new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type });
        }
      }
    }

    // 3) Clipboard API (opsional, butuh permission)
    if (navigator.clipboard?.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const it of items) {
          for (const type of it.types) {
            if (type.startsWith("image/")) {
              const blob = await it.getType(type);
              return new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type });
            }
          }
        }
      } catch {
        // ignore
      }
    }

    return null;
  };

  const handlePaste = async (e) => {
    if (disabled) return;
    const img = await pickImageFromClipboardEvent(e);
    if (img) {
      e.preventDefault();
      
      // Kompresi gambar jika paste
      if (isImageFileType(img)) {
        setCompressing(true);
        try {
          const compressedImg = await compressImageFile(img);
          onFileSelected?.(compressedImg);
        } catch (error) {
          console.error('Error compressing pasted image:', error);
          onFileSelected?.(img); // Fallback ke file asli
        } finally {
          setCompressing(false);
        }
      } else {
        onFileSelected?.(img);
      }
    }
  };


  // Fokus otomatis saat komponen muncul
  useEffect(() => {
    if (!autoFocusOnMount || disabled) return;
    const t = setTimeout(() => {
      zoneRef.current?.focus?.();
    }, 150);
    return () => clearTimeout(t);
  }, [autoFocusOnMount, disabled]);

  // Listener paste pada elemen (saat fokus)
  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    el.addEventListener("paste", handlePaste);
    return () => el.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // Listener paste global (tanpa klik dulu)
  // Listener paste global (tanpa klik dulu)
useEffect(() => {
  if (!enableGlobalPaste || disabled) return;
  const onGlobalPaste = async (e) => {
    const tag = (e.target?.tagName || "").toLowerCase();
    const isTextField = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
    if (isTextField) return;

    const img = await pickImageFromClipboardEvent(e);
    if (img) {
      e.preventDefault();
      
      // KOMPRESI UNTUK GLOBAL PASTE
      if (isImageFileType(img)) {
        setCompressing(true);
        try {
          const compressedImg = await compressImageFile(img);
          onFileSelected?.(compressedImg);
        } catch (error) {
          console.error('Error compressing pasted image:', error);
          onFileSelected?.(img);
        } finally {
          setCompressing(false);
        }
      } else {
        onFileSelected?.(img);
      }
      zoneRef.current?.focus?.();
    }
  };
  window.addEventListener("paste", onGlobalPaste);
  return () => window.removeEventListener("paste", onGlobalPaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [enableGlobalPaste, disabled]);

  const onClickZone = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const onChangeFile = async (e) => {
  const f = e.target.files?.[0] || null;
  
 
  
  if (f && isImageFileType(f)) {
    // Kompresi gambar yang dipilih
    setCompressing(true);
    try {
      const compressedFile = await compressImageFile(f);
     
      onFileSelected?.(compressedFile);
    } catch (error) {
      console.error('❌ Error compressing selected image:', error);
      onFileSelected?.(f); // Fallback ke file asli
    } finally {
      setCompressing(false);
    }
  } else {
  
    onFileSelected?.(f);
  }
};


  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    
    if (f && isImageFileType(f)) {
      // Kompresi gambar yang di-drop
      setCompressing(true);
      try {
        const compressedFile = await compressImageFile(f);
        onFileSelected?.(compressedFile);
      } catch (error) {
        console.error('Error compressing dropped image:', error);
        onFileSelected?.(f);
      } finally {
        setCompressing(false);
      }
    } else if (f) {
      onFileSelected?.(f);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const nameForDisplay = selectedFile?.name || displayName || (previewUrl ? "File terpilih" : "");

  // deteksi apakah yang dipilih adalah gambar (lebih akurat pakai selectedFile.type)
  const isImageSelected =
    (!!selectedFile && selectedFile.type?.startsWith("image/")) ||
    (!selectedFile && isImageByName(nameForDisplay));

  return (
    
    <div className="d-flex flex-column gap-2">
      {/* TAMBAHKAN INI - loading kompresi */}
      {compressing && (
        <Alert variant="info" className="mb-2 py-2">
          <Spinner animation="border" size="sm" className="me-2" />
          Sedang mengkompresi gambar...
        </Alert>
      )}

        <div
      ref={zoneRef}
      role="button"
      tabIndex={0}
      onClick={onClickZone}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{
        border: dragOver ? "2px dashed #0d6efd" : "2px dashed #d0d4dc",
        borderRadius: 10,
        padding: 16,
        textAlign: "center",
        background: dragOver ? "#eef5ff" : "#f8f9fa",
        cursor: disabled || compressing ? "not-allowed" : "pointer", // TAMBAHKAN compressing
        userSelect: "none",
        outline: "none",
      }}
      aria-label="Area upload bukti. Klik untuk pilih file, atau paste gambar langsung. Maksimal 10 MB."
    >
      <div style={{ fontWeight: 600, color: "#344563" }}>{label}</div>
      <div style={{ fontSize: 12, color: "#6c757d", marginTop: 6 }}>
        Bisa <strong>Ctrl/Cmd+V</strong> untuk paste gambar, klik untuk pilih file (PDF/Word/Excel/Gambar), atau drag & drop. 
        <strong> Gambar akan dikompresi otomatis untuk menghemat ruang</strong>. {/* UPDATE PESAN */}
      </div>
    </div>


      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={onChangeFile}
        disabled={disabled || compressing} // TAMBAHKAN compressing
      />


      {(previewUrl || nameForDisplay) && (
        <>
          {/* jika gambar: tampilkan preview IMG langsung */}
          {previewUrl && isImageSelected ? (
            <div className="mt-1 border rounded bg-light p-2">
              <img
                src={previewUrl}
                alt={nameForDisplay || "preview"}
                style={{
                  width: "100%",
                  maxHeight: 260,
                  objectFit: "contain",
                  borderRadius: 8,
                  display: "block",
                  background: "#fff",
                }}
              />
              <div className="d-flex align-items-center justify-content-between mt-2">
                <small className="text-muted text-truncate me-2">{nameForDisplay}</small>
                <div className="d-flex gap-2">
                  <Button variant="outline-danger" size="sm" onClick={() => onFileSelected?.(null)} disabled={disabled}>
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // selain gambar: kartu file biasa
            <div className="mt-1">
              <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                <span style={{ fontSize: 24 }}>{getFileIcon(nameForDisplay)}</span>
                <div className="flex-grow-1">
                  <div className="fw-medium text-truncate" style={{ maxWidth: 220 }}>
                    {nameForDisplay}
                  </div>
                  <small className="text-muted">{getFileTypeText(nameForDisplay)}</small>
                </div>
                {previewUrl && (
                  <Button variant="outline-primary" size="sm" as="a" href={previewUrl} target="_blank" rel="noopener noreferrer">
                    Lihat
                  </Button>
                )}
                <Button variant="outline-danger" size="sm" onClick={() => onFileSelected?.(null)} disabled={disabled}>
                  Hapus
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ======================= Components ======================= */
function ChecklistBadge({ checklists, isDark }) {
  if (!Array.isArray(checklists) || checklists.length === 0) return null;
  const total = checklists.length;
  const done = checklists.filter((c) => c.checklist === "yes").length;
  const allDone = done === total;

  return (
    <span style={checklistPill(allDone, isDark)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="2" />
        <path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {done}/{total}
    </span>
  );
}

// Komponen untuk menampilkan preview file dengan ikon yang sesuai (dipakai di modal detail)
const FilePreview = ({ fileUrl, fileName, isDark }) => {
  const isImage = (filename) => {
    if (!filename) return false;
        const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "heic", "heif", "svg"]; // UPDATE 
    const ext = filename.split(".").pop()?.toLowerCase();
    return imageExts.includes(ext);
  };

  const colors = getColors(isDark);

  return (
    <div className="d-flex align-items-center gap-2 p-2 border rounded" style={{ 
      background: colors.bgSecondary,
      borderColor: colors.borderPrimary 
    }}>
      <span style={{ fontSize: "24px" }}>{getFileIcon(fileName)}</span>
      <div className="flex-grow-1">
        <div className="fw-medium text-truncate" style={{ 
          maxWidth: "200px",
          color: colors.textPrimary 
        }}>
          {fileName}
        </div>
        <small style={{ color: colors.textMuted }}>{isImage(fileName) ? "Gambar" : "Dokumen"}</small>
      </div>
      <Button variant="outline-primary" size="sm" as="a" href={fileUrl} target="_blank" rel="noopener noreferrer">
        Lihat
      </Button>
    </div>
  );
};

// Skeleton Loading Components dengan dark mode support
const CardSkeleton = ({ isDark }) => {
  const colors = getColors(isDark);
  return (
    <div style={{
      position: "relative",
      border: `1px solid ${colors.borderPrimary}`,
      borderRadius: "8px",
      background: colors.bgTertiary,
      boxShadow: colors.shadow,
      overflow: "visible",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ 
        padding: "8px 10px", 
        background: isDark ? "#383838" : "#f8f9fa", 
        borderRadius: "8px" 
      }}>
        <div style={{ 
          height: "16px", 
          background: isDark ? "#555555" : "#e9ecef", 
          borderRadius: "4px", 
          marginBottom: "8px", 
          animation: "pulse 1.5s ease-in-out infinite" 
        }}></div>
        <div style={{ 
          height: "12px", 
          background: isDark ? "#555555" : "#e9ecef", 
          borderRadius: "4px", 
          width: "70%", 
          animation: "pulse 1.5s ease-in-out infinite" 
        }}></div>
      </div>
    </div>
  );
};

const ListSkeleton = ({ isDark }) => {
  const colors = getColors(isDark);
  return (
    <ListCol isDark={isDark}>
      <ListHeader isDark={isDark}>
        <div style={{ 
          height: "20px", 
          background: isDark ? "#555555" : "#dee2e6", 
          borderRadius: "4px", 
          animation: "pulse 1.5s ease-in-out infinite" 
        }}></div>
      </ListHeader>
      <ListBody isDark={isDark}>
        {[1, 2, 3].map((i) => <CardSkeleton key={i} isDark={isDark} />)}
      </ListBody>
    </ListCol>
  );
};

const WorkOrganizerUserTasks = () => {
  const { holdingId, userId } = useParams();
  const { user, hasPermission } = useAuthContext();
  const { theme } = useLayoutContext();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liburDates, setLiburDates] = useState([]);
  const [accessChecked, setAccessChecked] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentListId, setCurrentListId] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    description: "",
    bukti: null,
    buktiUrl: null,
    progres: false,
    buktiChecklist: false,
    final: false,
  });

  // State tambahan untuk upload loading dan unlock
  const [uploading, setUploading] = useState(false);
  const [unlockingListId, setUnlockingListId] = useState(null);

  // Filter Bulan/Tahun (default: bulan ini)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPastDays, setShowPastDays] = useState(false);

  // State untuk dark mode detection
  
  const isDarkMode = theme === 'dark';

  // ======================= GET TOKEN FROM LOCALSTORAGE =======================
  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  // ======================= HANDLE KEYBOARD SHORTCUT =======================
  const handleKeyDown = (e) => {
    // Ctrl+Enter atau Enter saja untuk menyimpan
    if ((e.ctrlKey && e.key === 'Enter') || e.key === 'Enter') {
      e.preventDefault();
      if (!uploading && modalData.title.trim()) {
        handleSaveCard();
      }
    }
    
    // Escape untuk cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!uploading) {
        setShowModal(false);
      }
    }
  };

  
  

  // ⛳ Auto-reset ke bulan & tahun ini setiap kali halaman ini dibuka
  useEffect(() => {
    const n = new Date();
    setSelectedMonth(n.getMonth());
    setSelectedYear(n.getFullYear());
    setShowPastDays(false);
  }, [holdingId, userId]);

  // Deteksi role
  const isSuperAdmin = user?.role?.name === "Superadmin";
  const isAdmin = user?.role?.name === "Admin" || isSuperAdmin || user?.role?.name === "Direktur";

  // 🔐 Validasi akses user - Admin/Superadmin/Direktur boleh akses semua
  useEffect(() => {
    if (user && userId) {
      const currentUserId = parseInt(userId);
      const loggedInUserId = user.id;
      const userRoleName = user.role?.name;

      const isAdmin = userRoleName === "Admin" || userRoleName === "Superadmin" || userRoleName === "Direktur";
      const isSameUser = currentUserId === loggedInUserId;

      if (!isAdmin && !isSameUser) {
        Swal.fire({
          title: "Akses Ditolak",
          text: "Anda tidak memiliki akses ke halaman ini!",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "Kembali ke Board",
        }).then(() => {
          // Redirect ke halaman board holding
          navigate(`/workorganizer/holding/${holdingId}/board`, { replace: true });
        });
        return;
      }

      setAccessChecked(true);
    }
  }, [user, userId, holdingId, navigate]);

  // Helper function untuk menentukan apakah tanggal adalah hari ini atau masa depan
  const isTodayOrFuture = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Return true untuk hari ini DAN masa depan (sehingga hari mendatang tetap ditampilkan)
    return date >= today;
  };

  const isFutureDate = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    return date > today; // Hanya tanggal yang benar-benar masa depan
  };

  // Fungsi untuk mengecek apakah list sudah locked lebih dari 1 hari
  const isLockedMoreThanOneDay = (list) => {
    if (list.status !== "locked") return false;

    if (!list.locked_at) return true; // Jika tidak ada locked_at, anggap sudah lama locked

    const lockedDate = new Date(list.locked_at);
    const now = new Date();
    const diffTime = now - lockedDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays > 1; // Lebih dari 1 hari
  };

  // Fungsi untuk mengecek apakah card bisa diedit
  const canEditCard = (list) => {
    // Jika list tidak locked, bisa edit
    if (list.status !== "locked") return true;

    // Jika list locked tapi masih dalam toleransi 1 hari, masih bisa edit
    if (!isLockedMoreThanOneDay(list)) return true;

    // Jika list locked lebih dari 1 hari, tidak bisa edit
    return false;
  };

  const isSameMonthYear = (dateStr, m, y) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    return d.getMonth() === m && d.getFullYear() === y;
  };

  // ======================= UNLOCK LIST (Superadmin dan admin only) =======================
  const handleUnlockList = async (listId) => {
    // Validasi user dan role
    if (!user || !user.role) {
      Swal.fire({
        title: "Error Autentikasi!",
        text: "Data user tidak lengkap. Silakan login kembali.",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
      return;
    }

    if (user.role.name !== "Superadmin" && user.role.name !== "Admin") {
      Swal.fire({
        title: "Akses Ditolak!",
        text: "Hanya Superadmin dan Admin yang dapat membuka kunci list.",
        icon: "warning",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Buka Kunci List?",
      text: "List ini akan dibuka kunci dan dapat diedit kembali. Yakin?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Buka Kunci!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setUnlockingListId(listId);
      
      // Dapatkan token dari localStorage
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      // Buat config dengan authorization header
      const config = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true // Penting untuk session-based auth
      };
      
   
      const res = await axios.post(`${API_BASE}/lists/${listId}/unlock`, {}, config);
      
   
      
      // Update boards state
      setBoards(prev =>
        prev.map(list =>
          list.id === listId 
            ? { 
                ...list, 
                status: "active", 
                locked_at: null 
              } 
            : list
        )
      );

      Swal.fire({
        title: "Berhasil!",
        text: "List berhasil dibuka kunci",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
    } catch (err) {
      console.error("Unlock error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
        message: err.message
      });
      
      let errorMessage = "Gagal membuka kunci list";
      
      if (err.response?.status === 401) {
        errorMessage = "Sesi telah berakhir. Silakan login kembali.";
        // Optionally redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else if (err.response?.status === 403) {
        errorMessage = err.response.data?.message || "Akses ditolak";
      } else if (err.message.includes("Token tidak ditemukan")) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      Swal.fire({
        title: "Gagal!",
        html: `
          <div>${errorMessage}</div>
          <div style="margin-top: 15px; font-size: 12px; color: #666;">
            <div>List ID: ${listId}</div>
            <div>Status: ${err.response?.status}</div>
            <div>Pesan: ${err.response?.data?.message || err.message}</div>
          </div>
        `,
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    } finally {
      setUnlockingListId(null);
    }
  };

  // 🔥 OPTIMIZED: Fetch data dengan endpoint baru yang cepat
  useEffect(() => {
    if (!accessChecked) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Dapatkan token
        const token = getAuthToken();
        const config = token ? {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        } : {};

        // 1. Get board data
        const boardRes = await axios.get(`${API_BASE}/board/user/${userId}`, config);
        const board = boardRes.data;

        // 2. Generate lists jika belum ada
        await axios.post(`${API_BASE}/boards/${board.id}/generate-lists`, {}, config);

        // 3. 🔥 COBA ENDPOINT OPTIMIZED BARU
        let listsWithFullData;

        try {
          // Coba endpoint optimized terlebih dahulu
          const optimizedRes = await axios.get(`${API_BASE}/boards/${board.id}/full-data`, config);
          listsWithFullData = optimizedRes.data;
        } catch (optimizedErr) {
          // Fallback 1: Coba endpoint dengan include
          try {
            const includeRes = await axios.get(`${API_BASE}/boards/${board.id}/lists?include=cards.checklists`, config);
            listsWithFullData = includeRes.data;
          } catch (includeErr) {
            // Fallback 2: Manual approach sebagai last resort
            const listsRes = await axios.get(`${API_BASE}/boards/${board.id}/lists`, config);
            const lists = listsRes.data;

            // Manual fetch cards dan checklists (lebih lambat)
            listsWithFullData = await Promise.all(
              lists.map(async (list) => {
                try {
                  const cardsRes = await axios.get(`${API_BASE}/lists/${list.id}/cards`, config);
                  const cards = Array.isArray(cardsRes.data) ? cardsRes.data : cardsRes.data.cards || cardsRes.data.data || [];

                  const cardsWithChecklists = await Promise.all(
                    cards.map(async (card) => {
                      try {
                        const checklistRes = await axios.get(`${API_BASE}/cards/${card.id}/checklists`, config);
                        const checklists = Array.isArray(checklistRes.data)
                          ? checklistRes.data
                          : checklistRes.data.checklists || checklistRes.data.data || [];
                        return { ...card, checklists };
                      } catch {
                        return { ...card, checklists: [] };
                      }
                    })
                  );

                  return { ...list, cards: cardsWithChecklists, count_card: cardsWithChecklists.length };
                } catch {
                  return { ...list, cards: [], count_card: 0 };
                }
              })
            );
          }
        }

        // 4. Get libur dates
        const liburRes = await axios.get(`${API_BASE}/libur`, config);
        const tanggalLibur = liburRes.data.message.map((l) => l.tanggal_libur);
        setLiburDates(tanggalLibur);

        // 5. Set state
        setBoards(listsWithFullData);
        setUserName(board.title);
      } catch (err) {
        setError("Gagal memuat data board/lists/cards");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, holdingId, accessChecked]);

  const handleModalChange = (e) => {
    const { name, type, checked, files, value } = e.target;
    if (type === "checkbox") {
      setModalData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      const file = files[0] || null;
      setModalData((prev) => ({
        ...prev,
        bukti: file,
        buktiUrl: file ? URL.createObjectURL(file) : prev.buktiUrl,
        buktiChecklist: !!file || !!prev.buktiUrl,
      }));
    } else {
      setModalData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handler dari PasteableFileInput
  // Handler dari PasteableFileInput
// Handler dari PasteableFileInput
const handleSelectBuktiFile = (fileOrNull) => {
 
  
  if (fileOrNull) {
    // Pastikan ini adalah File instance, bukan Blob
    let finalFile = fileOrNull;
    
    if (fileOrNull instanceof Blob && !(fileOrNull instanceof File)) {
      
      // Konversi Blob ke File
      const fileName = fileOrNull.name || `image_${Date.now()}.jpg`;
      finalFile = new File([fileOrNull], fileName, {
        type: fileOrNull.type || 'image/jpeg',
        lastModified: Date.now()
      });
      
    }
    
    const url = URL.createObjectURL(finalFile);
    
    
    setModalData((prev) => ({
      ...prev,
      bukti: finalFile, // Pastikan ini adalah File, bukan Blob
      buktiUrl: url,
      buktiChecklist: true,
    }));
    
  } else {
    
    
    // Hapus file dari state dan revoke object URL
    if (modalData.buktiUrl && modalData.buktiUrl.startsWith('blob:')) {
      URL.revokeObjectURL(modalData.buktiUrl);
    }
    
    setModalData((prev) => ({
      ...prev,
      bukti: null,
      buktiUrl: null,
      buktiChecklist: false,
    }));
  }
};

  // ======================= SAVE CARD =======================
  // ======================= SAVE CARD =======================
const handleSaveCard = async () => {
 
  
  try {
    // Validasi tipe file dan ukuran sebelum upload
    if (modalData.bukti instanceof File) {
      
      
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif', 'svg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'rtf'];
      const maxSize = 10240; // dalam KB (10 MB = 10240 KB)
      
      // Validasi ekstensi file
      const fileExtension = modalData.bukti.name.split('.').pop()?.toLowerCase();
      
      
      if (!allowedExtensions.includes(fileExtension)) {
        Swal.fire({
          title: "Format File Tidak Didukung!",
          text: `Hanya file dengan format berikut yang diperbolehkan: ${allowedExtensions.join(', ')}`,
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        });
        return;
      }
      
      // Validasi ukuran file (10240 KB = 10 MB)
      if (modalData.bukti.size > maxSize * 1024) {
        Swal.fire({
          title: "File Terlalu Besar!",
          text: `Ukuran file maksimal adalah 10 MB`,
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        });
        return;
      }
      
     
    } else {
     
    }

    setUploading(true);
   

    const formData = new FormData();
    formData.append("title", modalData.title);
    formData.append("description", modalData.description || "");
    formData.append("list_id", currentListId);

    // Hanya append file jika ada file baru yang dipilih / dipaste
    // Hanya append file jika ada file baru yang dipilih / dipaste
if (modalData.bukti) {
  
  
  // FIX: Cek apakah ini File atau Blob
      if (modalData.bukti instanceof File) {
        
        formData.append("bukti", modalData.bukti, modalData.bukti.name);
      } 
      else if (modalData.bukti instanceof Blob) {
        
        // Konversi Blob ke File
        const fileName = modalData.bukti.name || `bukti_${Date.now()}.jpg`;
        const fileFromBlob = new File([modalData.bukti], fileName, {
          type: modalData.bukti.type || 'image/jpeg',
          lastModified: Date.now()
        });
        
        formData.append("bukti", fileFromBlob, fileFromBlob.name);
      }
      else {
       
      }
    } else {
      
    }

    let checklists = [];

    if (editingCard) {
      const existingChecklists = editingCard.checklists || [];
      checklists = existingChecklists.map((item) => ({
        id: item.id,
        title: item.title,
        checklist: getChecklistStatus(item.title, modalData),
        position: item.position,
      }));
      
    } else {
      checklists = [
        { title: "Progres", checklist: modalData.progres ? "yes" : "no", position: 1 },
        { title: "Bukti", checklist: modalData.buktiChecklist ? "yes" : "no", position: 2 },
        { title: "Final", checklist: modalData.final ? "yes" : "no", position: 3 },
      ];
    
    }

    // Format checklists
    checklists.forEach((item, index) => {
      if (item.id) {
        formData.append(`checklists[${index}][id]`, item.id);
      }
      formData.append(`checklists[${index}][title]`, item.title);
      formData.append(`checklists[${index}][checklist]`, item.checklist);
      formData.append(`checklists[${index}][position]`, item.position.toString());
    });

    // Debug FormData content
   
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(key, {
          name: value.name,
          type: value.type,
          size: value.size + ' bytes'
        });
      } else {
      
      }
    }

    // Dapatkan token
    const token = getAuthToken();
   
    
    const config = token ? {
      headers: { 
        "Content-Type": "multipart/form-data",
        'Authorization': `Bearer ${token}`
      }
    } : {
      headers: { "Content-Type": "multipart/form-data" }
    };

  
    
    let res;
    try {
      if (editingCard) {
        // PUT method (via POST + _method)
      
        res = await axios.post(`${API_BASE}/cards/${editingCard.id}`, formData, {
          ...config,
          params: { _method: "PUT" },
        });
      } else {
        // POST create
       
        res = await axios.post(`${API_BASE}/cards`, formData, config);
      }
      
    
      
    } catch (axiosError) {
      
      throw axiosError;
    }

    const savedCard = res.data.card;
    const updatedList = res.data.list;

    const cardWithChecklists = {
      ...savedCard,
      checklists: savedCard.checklists || checklists,
    };

    setBoards((prev) =>
      prev.map((list) =>
        list.id === updatedList.id
          ? editingCard
            ? {
                ...list,
                cards: list.cards.map((c) => (c.id === savedCard.id ? cardWithChecklists : c)),
                count_card: updatedList.count_card,
              }
            : {
                ...list,
                cards: [...list.cards, cardWithChecklists],
                count_card: updatedList.count_card,
              }
          : list
      )
    );

 

    setShowModal(false);
    setEditingCard(null);
    setModalData({
      title: "",
      description: "",
      bukti: null,
      buktiUrl: null,
      progres: false,
      buktiChecklist: false,
      final: false,
    });

   
    
    Swal.fire({
      title: "Berhasil!",
      text: editingCard ? "Card berhasil diupdate" : "Card berhasil dibuat",
      icon: "success",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    });
  } catch (err) {
   

    // TAMPILKAN DETAIL ERROR DARI SERVER
    console.error("❌ Error response data:", err.response?.data);
    console.error("❌ Error response status:", err.response?.status);
    console.error("❌ Error response headers:", err.response?.headers);

    // Tampilkan error detail dari response
    let errorMessage = "Gagal menyimpan card/checklist";

    if (err.response && err.response.data) {
      const responseData = err.response.data;

      // Handle Laravel validation errors
      if (responseData.errors) {
        const errorMessages = Object.values(responseData.errors).flat();
        errorMessage = errorMessages.join(", ");
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }
    }

    Swal.fire({
      title: "Gagal!",
      text: errorMessage,
      icon: "error",
      confirmButtonColor: "#d33",
      confirmButtonText: "OK",
    });
  } finally {
   
    setUploading(false);
  }
};

    useEffect(() => {
    if (!accessChecked) return;

    const scheduleReload = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Set ke jam 00:00 besok
      
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      
    
      
      setTimeout(() => {
        window.location.reload();
      }, timeUntilMidnight);
    };

    scheduleReload();

  }, [accessChecked]);  


const blobToFile = (blob, fileName = null) => {
  if (!blob) return null;
  
  // Jika sudah File, kembalikan asli
  if (blob instanceof File) {
    return blob;
  }
  
  // Jika Blob, konversi ke File
  if (blob instanceof Blob) {
    const name = fileName || blob.name || `file-${Date.now()}`;
    // Tambahkan ekstensi jika tidak ada
    const finalName = name.includes('.') ? name : `${name}.jpg`;
    
    return new File([blob], finalName, {
      type: blob.type || 'application/octet-stream',
      lastModified: Date.now()
    });
  }
  
  console.warn('Unknown type, returning null:', typeof blob);
  return null;
};

  // Tambah state baru
const [showUnlockModal, setShowUnlockModal] = useState(false);
const [selectedUnlockDate, setSelectedUnlockDate] = useState('');
const [unlocking, setUnlocking] = useState(false);

// Function untuk unlock by date
const handleUnlockByDate = async () => {
  if (!selectedUnlockDate) {
    Swal.fire({
      title: "Peringatan!",
      text: "Pilih tanggal terlebih dahulu",
      icon: "warning",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  // Validasi user dan role di frontend dulu
  if (!user || (user.role?.name !== "Superadmin" && user.role?.name !== "Admin")) {
    Swal.fire({
      title: "Akses Ditolak!",
      text: "Hanya Superadmin dan Admin yang dapat membuka kunci list berdasarkan tanggal.",
      icon: "warning",
      confirmButtonColor: "#d33",
    });
    return;
  }

  const result = await Swal.fire({
    title: "Buka Kunci Semua List di Tanggal Ini?",
    html: `Yakin ingin membuka kunci <strong>semua list</strong> pada tanggal <br><strong>${new Date(selectedUnlockDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, Buka Kunci Semua!",
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  try {
    setUnlocking(true);
    
    // Dapatkan token dengan cara yang sama seperti function unlock biasa
    const token = getAuthToken();
    
    
    
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }

    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    };

    // Cari board ID - pastikan dapat board_id dengan benar
    let boardId;
    if (boards.length > 0 && boards[0].board_id) {
      boardId = boards[0].board_id;
    } else {
      // Fallback: fetch board data dulu
      const boardRes = await axios.get(`${API_BASE}/board/user/${userId}`, config);
      boardId = boardRes.data.id;
    }

   

    const res = await axios.post(
      `${API_BASE}/lists/unlock-by-date`,
      {
        date: selectedUnlockDate
       
      },
      config
    );



    // Refresh data
     if (boards.length > 0) {
      const boardRes = await axios.get(`${API_BASE}/board/user/${userId}`, config);
      const board = boardRes.data;
      const fullDataRes = await axios.get(`${API_BASE}/boards/${board.id}/full-data`, config);
      setBoards(fullDataRes.data);
    }

    Swal.fire({
      title: "Berhasil!",
      html: `<div>${res.data.message}</div><div style="margin-top: 10px; font-size: 14px; color: #666;">${res.data.unlocked_count} list berhasil dibuka kunci</div>`,
      icon: "success",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    });

    setShowUnlockModal(false);
    setSelectedUnlockDate('');

  } catch (err) {
    let errorMessage = "Gagal membuka kunci list berdasarkan tanggal";
    
    if (err.response?.status === 401) {
      errorMessage = "Sesi telah berakhir. Silakan login kembali.";
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }

    Swal.fire({
      title: "Gagal!",
      html: `
        <div>${errorMessage}</div>
        ${err.response?.status === 401 ? 
          '<div style="margin-top: 10px; font-size: 12px; color: #666;">Anda akan diarahkan ke halaman login...</div>' : 
          ''
        }
      `,
      icon: "error",
      confirmButtonColor: "#d33",
      confirmButtonText: "OK",
    });
  } finally {
    setUnlocking(false);
  }
};

const [showLockModal, setShowLockModal] = useState(false);
const [selectedLockDate, setSelectedLockDate] = useState('');
const [locking, setLocking] = useState(false);

// Function untuk lock by date
const handleLockByDate = async () => {
  if (!selectedLockDate) {
    Swal.fire({
      title: "Peringatan!",
      text: "Pilih tanggal terlebih dahulu",
      icon: "warning",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  // Validasi user dan role di frontend dulu
  if (!user || (user.role?.name !== "Superadmin" && user.role?.name !== "Admin")) {
    Swal.fire({
      title: "Akses Ditolak!",
      text: "Hanya Superadmin dan Admin yang dapat mengunci list berdasarkan tanggal.",
      icon: "warning",
      confirmButtonColor: "#d33",
    });
    return;
  }

  const result = await Swal.fire({
    title: "Kunci Semua List di Tanggal Ini?",
    html: `Yakin ingin mengunci <strong>semua list</strong> pada tanggal <br><strong>${new Date(selectedLockDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, Kunci Semua!",
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  try {
    setLocking(true);
    
    const token = getAuthToken();
    
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }

    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    };

    // Cari board ID
    let boardId;
    if (boards.length > 0 && boards[0].board_id) {
      boardId = boards[0].board_id;
    } else {
      const boardRes = await axios.get(`${API_BASE}/board/user/${userId}`, config);
      boardId = boardRes.data.id;
    }

    const res = await axios.post(
      `${API_BASE}/lists/lock-by-date`,
      {
        date: selectedLockDate
      },
      config
    );

    // Refresh data
    if (boards.length > 0) {
      const boardRes = await axios.get(`${API_BASE}/board/user/${userId}`, config);
      const board = boardRes.data;
      const fullDataRes = await axios.get(`${API_BASE}/boards/${board.id}/full-data`, config);
      setBoards(fullDataRes.data);
    }

    Swal.fire({
      title: "Berhasil!",
      html: `<div>${res.data.message}</div><div style="margin-top: 10px; font-size: 14px; color: #666;">${res.data.locked_count} list berhasil dikunci</div>`,
      icon: "success",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    });

    setShowLockModal(false);
    setSelectedLockDate('');

  } catch (err) {
    let errorMessage = "Gagal mengunci list berdasarkan tanggal";
    
    if (err.response?.status === 401) {
      errorMessage = "Sesi telah berakhir. Silakan login kembali.";
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }

    Swal.fire({
      title: "Gagal!",
      html: `
        <div>${errorMessage}</div>
        ${err.response?.status === 401 ? 
          '<div style="margin-top: 10px; font-size: 12px; color: #666;">Anda akan diarahkan ke halaman login...</div>' : 
          ''
        }
      `,
      icon: "error",
      confirmButtonColor: "#d33",
      confirmButtonText: "OK",
    });
  } finally {
    setLocking(false);
  }
};

// Modal untuk pilih tanggal lock
const LockByDateModal = () => (
  <Modal show={showLockModal} onHide={() => !locking && setShowLockModal(false)}>
    <Modal.Header closeButton={!locking}>
      <Modal.Title>Kunci Semua List Berdasarkan Tanggal</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {locking ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="danger" />
          <div className="mt-2">Mengunci list...</div>
        </div>
      ) : (
        <Form>
          <Form.Group>
            <Form.Label>Pilih Tanggal</Form.Label>
            <Form.Control
              type="date"
              value={selectedLockDate}
              onChange={(e) => setSelectedLockDate(e.target.value)}
              
            />
            <Form.Text className="text-muted">
              Pilih tanggal untuk mengunci semua list pada tanggal tersebut
            </Form.Text>
          </Form.Group>
        </Form>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button 
        variant="secondary" 
        onClick={() => setShowLockModal(false)} 
        disabled={locking}
      >
        Batal
      </Button>
      <Button 
        variant="danger" 
        onClick={handleLockByDate}
        disabled={locking || !selectedLockDate}
      >
        {locking ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Mengunci...
          </>
        ) : (
          '🔒 Kunci Semua'
        )}
      </Button>
    </Modal.Footer>
  </Modal>
);

// Modal untuk pilih tanggal
const UnlockByDateModal = () => (
  <Modal show={showUnlockModal} onHide={() => !unlocking && setShowUnlockModal(false)}>
    <Modal.Header closeButton={!unlocking}>
      <Modal.Title>Buka Semua Kunci List Berdasarkan Tanggal</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {unlocking ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Membuka kunci list...</div>
        </div>
      ) : (
        <Form>
          <Form.Group>
            <Form.Label>Pilih Tanggal</Form.Label>
            <Form.Control
              type="date"
              value={selectedUnlockDate}
              onChange={(e) => setSelectedUnlockDate(e.target.value)}
            />
            <Form.Text className="text-muted">
              Pilih tanggal untuk membuka kunci semua list pada tanggal tersebut
            </Form.Text>
          </Form.Group>
        </Form>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button 
        variant="secondary" 
        onClick={() => setShowUnlockModal(false)} 
        disabled={unlocking}
      >
        Batal
      </Button>
      <Button 
        variant="primary" 
        onClick={handleUnlockByDate}
        disabled={unlocking || !selectedUnlockDate}
      >
        {unlocking ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Membuka Kunci...
          </>
        ) : (
          'Buka Kunci Semua'
        )}
      </Button>
    </Modal.Footer>
  </Modal>
);

  // Helper function untuk checklist status
  const getChecklistStatus = (title, modalDataParam) => {
    switch (title) {
      case "Progres":
        return modalDataParam.progres ? "yes" : "no";
      case "Bukti":
        return modalDataParam.buktiChecklist ? "yes" : "no";
      case "Final":
        return modalDataParam.final ? "yes" : "no";
      default:
        return "no";
    }
  };

  // ======================= DELETE CARD =======================
  const handleDeleteCard = async (listId, cardId) => {
    const result = await Swal.fire({
      title: "Yakin hapus card ini?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      // Dapatkan token
      const token = getAuthToken();
      const config = token ? {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      } : {};

      const res = await axios.delete(`${API_BASE}/cards/${cardId}`, config);
      const updatedList = res.data.list;

      setBoards((prev) =>
        prev.map((list) =>
          list.id === updatedList.id ? { ...list, cards: list.cards.filter((c) => c.id !== cardId), count_card: updatedList.count_card } : list
        )
      );

      Swal.fire({
        title: "Terhapus!",
        text: "Card berhasil dihapus",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
    } catch (err) {
      console.error(err);

      Swal.fire({
        title: "Gagal!",
        text: "Gagal menghapus card",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    }
  };

  const handleEditCard = (listId, card) => {
    const list = boards.find((l) => l.id === listId);
    if (isFutureDate(list.date)) {
      Swal.fire({
        title: "Tidak Dapat Edit",
        text: "Tidak dapat mengedit card untuk hari yang belum datang",
        icon: "warning",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }
    if (!canEditCard(list)) {
      Swal.fire({
        title: "Tidak Dapat Edit",
        text: "Card ini sudah locked lebih dari 1 hari dan tidak dapat diedit",
        icon: "warning",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }

    setCurrentListId(listId);
    setEditingCard(card);

    const checklists = card.checklists || [];

    setModalData({
      title: card.title,
      description: card.description,
      bukti: null,
      buktiUrl: card.bukti ? `${API_BASE.replace(/\/api$/, "")}/storage/${card.bukti}` : null,
      progres: checklists.find((c) => c.title === "Progres")?.checklist === "yes",
      buktiChecklist: checklists.find((c) => c.title === "Bukti")?.checklist === "yes",
      final: checklists.find((c) => c.title === "Final")?.checklist === "yes",
    });
    setShowModal(true);
  };

  const handleViewCard = async (cardId) => {
    try {
      // Dapatkan token
      const token = getAuthToken();
      const config = token ? {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      } : {};

      const res = await axios.get(`${API_BASE}/cards/${cardId}`, config);
      setDetailCard(res.data.card);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);

      Swal.fire({
        title: "Gagal!",
        text: "Gagal memuat detail card",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    }
  };

  const fmtID = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    return date.toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const checklistStat = (arr = []) => {
    const total = arr.length;
    const done = arr.filter((v) => v.checklist === "yes").length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  };

  const now = new Date();

  // Tampilkan loading selama validasi akses
  if (!accessChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Memeriksa akses...</span>
      </div>
    );
  }

  // Fungsi untuk menghitung project yang benar-benar done (semua checklist selesai)
  const calculateDoneProjects = (cards = []) => {
    if (!Array.isArray(cards) || cards.length === 0) return 0;

    return cards.filter((card) => {
      const checklists = card.checklists || [];

      // Jika tidak ada checklist, tidak dihitung sebagai done
      if (checklists.length === 0) return false;

      // Cek apakah SEMUA checklist bernilai "yes"
      const allDone = checklists.every((checklist) => checklist.checklist === "yes");

      return allDone;
    }).length;
  };

  return (
    <>
      <PageTitle
        title={
          <div className="d-flex align-items-center gap-2">
            <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => navigate(-1)}>
              ←
            </Button>
            <span>{userName || `User ${userId}`}</span>
          </div>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter Bulan/Tahun dan Toggle Hari Kemarin */}
     <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <Form.Select
          size="sm"
          style={{ width: 160 }}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
        >
          {[
            "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
            "Juli", "Agustus", "September", "Oktober", "November", "Desember",
          ].map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </Form.Select>

        <Form.Select 
          size="sm" 
          style={{ width: 110 }} 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
        >
          {Array.from({ length: 7 }).map((_, idx) => {
            const y = now.getFullYear() - 3 + idx;
            return <option key={y} value={y}>{y}</option>;
          })}
        </Form.Select>

        {/* Toggle hari kemarin */}
        <Button
          variant={showPastDays ? "primary" : "outline-primary"}
          size="sm"
          onClick={() => setShowPastDays(!showPastDays)}
          style={{ minWidth: "180px" }}
        >
          {showPastDays ? "Sembunyikan Hari Kemarin" : "Tampilkan Hari Kemarin"}
        </Button>

        {/* Dropdown untuk Superadmin dan Admin Actions */}
        {(isSuperAdmin || isAdmin) && (hasPermission("Work Organizer.update") || hasPermission("Work Organizer.delete")) && (  
          <Dropdown>
            <Dropdown.Toggle 
              variant="outline-secondary" 
              size="sm"
              style={{ minWidth: "160px" }}
            >
              Admin Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setShowUnlockModal(true)}>
                Buka Kunci by Tanggal
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowLockModal(true)}>
                Kunci by Tanggal
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}

        {/* Render modals */}
        <UnlockByDateModal />
        <LockByDateModal />
      </div>

      {/* Skeleton Loading saat fetching data */}
      {loading && (
        <div style={boardWrap}>
          {[1, 2, 3, 4, 5].map((i) => (
            <ListSkeleton key={i} isDark={isDarkMode} />
          ))}
        </div>
      )}

      {/* Data yang sudah loaded */}
      {!loading && (
        <div style={boardWrap}>
          {boards
              .filter((list) => !liburDates.includes(list.date))
              .filter((list) => isSameMonthYear(list.date, selectedMonth, selectedYear))
              .filter((list) => {
                // Jika user memilih bulan/tahun selain bulan/tahun sekarang => tampilkan semua di bulan itu
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const viewingOtherMonth = selectedMonth !== currentMonth || selectedYear !== currentYear;

                if (viewingOtherMonth) return true;

                // Jika melihat bulan ini, tetap terapkan aturan showPastDays / isTodayOrFuture
                if (showPastDays) return true;
                return isTodayOrFuture(list.date);
              })
              .map((list) => (
              <ListCol key={list.id} isDark={isDarkMode}>
                {/* HEADER LIST dengan tombol unlock untuk Superadmin dan admin */}
                <ListHeader isDark={isDarkMode}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      {list.title} &nbsp;
                      <small style={{ fontWeight: 500, color: isDarkMode ? "#4caf50" : "#026116ff" }}>
                        {calculateDoneProjects(list.cards)} project done
                      </small>
                    </span>
                    
                    {/* Tampilkan status locked dan tombol unlock untuk Superadmin dan admin */}
                    {list.status === "locked" && isSuperAdmin && (
                      <div className="d-flex align-items-center gap-1">
                        <span 
                          className="badge bg-warning text-dark" 
                          style={{ fontSize: "10px" }}
                          title="List terkunci lebih dari 1 hari"
                        >
                          
                        </span>
                       
                      </div>
                    )}
                  </div>
                </ListHeader>

                <ListBody isDark={isDarkMode}>
                  {list.cards &&
                    list.cards.map((card) => {
                      const hasAttachment = !!card?.bukti;
                      const canEdit = canEditCard(list);

                      return (
                        <TrelloCard 
                          key={card.id} 
                          isDark={isDarkMode}
                          onClick={() => handleViewCard(card.id)}
                        >
                          {/* Tombol edit/delete hanya untuk Admin atau pemilik card dan jika bisa edit */}                       
                          {(isAdmin || user?.id === parseInt(userId)) && (hasPermission("Work Organizer.update") || hasPermission("Work Organizer.delete")) && (
                            <div style={{ position: "absolute", top: 4, right: 4 }} onClick={(e) => e.stopPropagation()}>
                              <Dropdown>
                                <Dropdown.Toggle 
                                  variant={isDarkMode ? "dark" : "light"} 
                                  size="sm" 
                                  style={{ 
                                    padding: "0 6px", 
                                    fontWeight: "bold"
                                  }}
                                >
                                  ⋯
                                </Dropdown.Toggle>
                                <Dropdown.Menu 
                                style={{ 
                                  backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
                                  borderColor: isDarkMode ? '#555555' : '#dee2e6'
                                }}
                              >
                                {hasPermission("Work Organizer.update") && ( // ← Cek permission update
                                  <Dropdown.Item 
                                    onClick={() => handleEditCard(list.id, card)}
                                    disabled={!canEdit}
                                    className={!canEdit ? "text-muted" : ""}
                                    style={{ 
                                      color: isDarkMode ? '#fff' : '#000',
                                      backgroundColor: isDarkMode ? '#2d2d2d' : '#fff'
                                    }}
                                  >
                                    Edit {!canEdit && "(Locked)"}
                                  </Dropdown.Item>
                                )}
                                
                                {hasPermission("Work Organizer.delete") && ( // ← Cek permission delete
                                  <Dropdown.Item 
                                    onClick={() => handleDeleteCard(list.id, card.id)}
                                    style={{ 
                                      color: isDarkMode ? '#fff' : '#000',
                                      backgroundColor: isDarkMode ? '#2d2d2d' : '#fff'
                                    }}
                                  >
                                    Delete
                                  </Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                              </Dropdown>
                            </div>
                          )}

                          {hasAttachment && (
                            <div style={trelloThumbWrap(isDarkMode)}>
                              {isImageFile(card.bukti) ? (
                                // Tampilkan gambar untuk file image
                                <img
                                  src={`${API_BASE.replace(/\/api$/, "")}/storage/${card.bukti}`}
                                  alt="Bukti"
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                // Tampilkan ikon file untuk non-image (HANYA IKON, TANPA TEKS)
                                <div className="d-flex align-items-center justify-content-center h-100" style={{ background: isDarkMode ? "#383838" : "#f8f9fa" }}>
                                  <span style={{ fontSize: "32px" }}>{getFileIcon(card.bukti)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <TrelloCardContent isDark={isDarkMode}>
                            <TrelloTitle isDark={isDarkMode}>{card.title}</TrelloTitle>
                            {card.description && <TrelloDesc isDark={isDarkMode}>{card.description}</TrelloDesc>}
                          </TrelloCardContent>

                          <div style={trelloBadges}>
                            <ChecklistBadge checklists={card.checklists} isDark={isDarkMode} />
                          </div>
                        </TrelloCard>
                      );
                    })}
                </ListBody>

                {/* Tombol Add Card hanya untuk Admin atau pemilik board dan jika bisa edit */}
                {(isAdmin || user?.id === parseInt(userId)) && hasPermission("Work Organizer.create") && ( 
                  <ListFooter isDark={isDarkMode}>
                    {list.status === "locked" && isLockedMoreThanOneDay(list) ? (
                      // Tampilkan pesan locked dan tombol unlock untuk Superadmin dan admin
                      <div className="text-center">
                        <div className="text-muted mb-1" style={{ fontSize: "12px" }}>
                          Locked
                        </div>
                        
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="warning"
                            className="w-100"
                            onClick={() => handleUnlockList(list.id)}
                            disabled={unlockingListId === list.id}
                          >
                            {unlockingListId === list.id ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Unlocking...
                              </>
                            ) : (
                              "Unlock List"
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      // Tombol Add Card normal
                      <AddCardBtn
                      isDark={isDarkMode}
                      size="sm"
                      variant={!canEditCard(list) || isFutureDate(list.date) ? "secondary" : isDarkMode ? "outline-dark" : "light"}
                      className="w-100"
                      disabled={!canEditCard(list) || isFutureDate(list.date)}
                      onClick={() => {
                        if (!canEditCard(list)) {
                          Swal.fire({
                            title: "Tidak Dapat Menambah Card",
                            text: "List ini sudah locked lebih dari 1 hari dan tidak dapat ditambah card baru",
                            icon: "warning",
                            confirmButtonColor: "#3085d6",
                            confirmButtonText: "OK",
                          });
                          return;
                        }
                        if (isFutureDate(list.date)) {
                          Swal.fire({
                            title: "Tidak Dapat Menambah Card",
                            text: "Tidak dapat menambah card untuk hari yang belum datang",
                            icon: "warning",
                            confirmButtonColor: "#3085d6",
                            confirmButtonText: "OK",
                          });
                          return;
                        }
                        setCurrentListId(list.id);
                        setEditingCard(null);
                        setModalData({
                          title: "",
                          description: "",
                          bukti: null,
                          buktiUrl: null,
                          progres: false,
                          buktiChecklist: false,
                          final: false,
                        });
                        setShowModal(true);
                      }}
                    >
                      {!canEditCard(list) ? "Locked" : isFutureDate(list.date) ? "Hari Mendatang" : "+ Add a card"}
                    </AddCardBtn>
                    )}
                  </ListFooter>
                )}
              </ListCol>
            ))}
        </div>
      )}

      {/* MODAL ADD/EDIT CARD - hanya untuk Admin atau pemilik */}
      {(isAdmin || user?.id === parseInt(userId)) && 
        (hasPermission("Work Organizer.create") || hasPermission("Work Organizer.update")) && (
          <Modal show={showModal} onHide={() => !uploading && setShowModal(false)}>
          <Modal.Header closeButton={!uploading}>
            <Modal.Title>{uploading ? "Menyimpan..." : editingCard ? "Edit Card" : "Add Card"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {uploading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2">Menyimpan card...</div>
              </div>
            ) : (
              <Form onKeyDown={(e) => {
                // Jika target adalah textarea, biarkan Enter untuk new line
                if (e.target.tagName === 'TEXTAREA') {
                  // Ctrl+Enter di textarea masih bisa untuk save
                  if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    if (!uploading && modalData.title.trim()) {
                      handleSaveCard();
                    }
                  }
                  return; // Biarkan Enter biasa untuk new line
                }
                
                // Untuk input lain: Ctrl+Enter atau Enter untuk menyimpan
                if ((e.ctrlKey && e.key === 'Enter') || e.key === 'Enter') {
                  e.preventDefault();
                  if (!uploading && modalData.title.trim()) {
                    handleSaveCard();
                  }
                }
                
                // Escape untuk cancel
                if (e.key === 'Escape') {
                  e.preventDefault();
                  if (!uploading) {
                    setShowModal(false);
                  }
                }
              }}>
                <Form.Group className="mb-2">
                  <Form.Label>Judul</Form.Label>
                  <Form.Control 
                    name="title" 
                    value={modalData.title} 
                    onChange={handleModalChange} 
                    required 
                    autoFocus
                    placeholder="Masukkan judul task"
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Deskripsi (opsional)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    name="description" 
                    value={modalData.description} 
                    onChange={handleModalChange}
                    placeholder="Tekan Enter untuk baris baru, Ctrl+Enter untuk menyimpan"
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Bukti (File: PDF, Word, Excel, Image, dll)</Form.Label>

                  {/* ⬇️ Input paste/click/drop dengan auto preview image */}
                  <PasteableFileInput
                    onFileSelected={handleSelectBuktiFile}
                    previewUrl={modalData.buktiUrl}
                    displayName={
                      modalData.bukti?.name ||
                      (modalData.buktiUrl && editingCard && detailCard?.bukti ? detailCard.bukti : undefined)
                    }
                    selectedFile={modalData.bukti}   // penting untuk deteksi type image
                    disabled={uploading}
                    autoFocusOnMount={false} // Nonaktifkan auto focus karena sudah ada di judul
                    enableGlobalPaste={true}  // bisa paste tanpa klik
                  />

                  
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label>Checklist</Form.Label>
                  <div className="d-flex flex-row gap-3">
                    <Form.Check type="checkbox" label="Progres" name="progres" checked={modalData.progres} onChange={handleModalChange} />
                    <Form.Check
                      type="checkbox"
                      label="Bukti"
                      name="buktiChecklist"
                      checked={modalData.buktiChecklist}
                      onChange={handleModalChange}
                      disabled={!modalData.bukti && !modalData.buktiUrl}
                    />
                    <Form.Check type="checkbox" label="Final" name="final" checked={modalData.final} onChange={handleModalChange} />
                  </div>
                </Form.Group>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="d-flex justify-content-between align-items-center w-100">
              <small className="text-muted">
                Tips: Tekan <kbd>Enter</kbd> untuk menyimpan
              </small>
              <div>
                <Button variant="secondary" onClick={() => setShowModal(false)} disabled={uploading}>
                  Batal
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveCard} 
                  disabled={uploading || !modalData.title.trim()}
                  className="ms-2"
                >
                  {uploading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* MODAL DETAIL CARD */}
     <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
  <Modal.Header closeButton className="border-0 pb-0" />
  <Modal.Body className="pt-0">
    {!detailCard ? (
      <Spinner animation="border" />
    ) : (
      <>
        {detailCard.bukti && (
          <div className="mb-3" style={{ borderRadius: 12, overflow: "hidden", background: isDarkMode ? "#383838" : "#E9ECEF" }}>
            {isImageFile(detailCard.bukti) ? (
              // Tampilkan gambar untuk file image - FULL tanpa terpotong
              <img
                src={`${API_BASE.replace(/\/api$/, "")}/storage/${detailCard.bukti}`}
                alt="Bukti"
                style={{ 
                  width: "100%", 
                  height: 260, 
                  objectFit: "contain", // UBAH INI dari "cover" ke "contain"
                  display: "block" 
                }}
              />
            ) : (
              // Tampilkan preview file untuk non-image
              <div className="d-flex flex-column align-items-center justify-content-center py-4">
                <span style={{ fontSize: "64px" }}>{getFileIcon(detailCard.bukti)}</span>
                <div className="mt-2 text-center">
                  <div className="fw-medium" style={{ color: isDarkMode ? '#fff' : '#000' }}>{detailCard.bukti}</div>
                  <small style={{ color: isDarkMode ? '#b0b0b0' : '#6c757d' }}>{getFileTypeText(detailCard.bukti)} Document</small>
                </div>
                <Button
                  variant="primary"
                  className="mt-3"
                  as="a"
                  href={`${API_BASE.replace(/\/api$/, "")}/storage/${detailCard.bukti}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download File
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
          <h4 className="mb-0" style={{ color: isDarkMode ? "#fff" : "#172b4d", fontWeight: 700 }}>{detailCard.title}</h4>
          <div style={{ color: isDarkMode ? "#b0b0b0" : "#5e6c84", fontSize: 13 }}>
            <span className="me-2">{fmtID(detailCard.date || detailCard.created_at)}</span>
          </div>
        </div>

        <div className="mt-3" style={{ color: isDarkMode ? "#fff" : "#172b4d" }}>
          {detailCard.description ? (
            <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{detailCard.description}</p>
          ) : (
            <em className="text-muted">Tidak ada deskripsi</em>
          )}
        </div>

        <div className="mt-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="mb-0" style={{ color: isDarkMode ? "#fff" : "#172b4d", fontWeight: 700 }}>Checklist</h6>
            {(() => {
              const s = checklistStat(detailCard.checklists || []);
              return (
                <span
                  style={{
                    background: s.done === s.total && s.total ? "#1f845a" : (isDarkMode ? "#383838" : "#f4f5f7"),
                    color: s.done === s.total && s.total ? "#fff" : (isDarkMode ? "#b0b0b0" : "#5e6c84"),
                    border: `1px solid ${isDarkMode ? "#555555" : "#e1e4ea"}`,
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  title="Progress checklist"
                >
                  {s.done}/{s.total}
                </span>
              );
            })()}
          </div>

          {(() => {
            const { pct } = checklistStat(detailCard.checklists || []);
            return (
              <div className="mb-3" style={{ height: 8, background: isDarkMode ? "#383838" : "#e9ecef", borderRadius: 6, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: pct === 100 ? "#1f845a" : "#6c757d",
                    transition: "width .2s ease",
                  }}
                />
              </div>
            );
          })()}

          <ul className="list-unstyled mb-0">
            {(detailCard.checklists || []).map((c) => (
              <li key={c.id} className="d-flex align-items-center gap-2 mb-2">
                <input type="checkbox" checked={c.checklist === "yes"} readOnly />
                <span style={{ color: isDarkMode ? "#fff" : "#172b4d" }}>{c.title}</span>
              </li>
            ))}
            {!detailCard.checklists?.length && <em className="text-muted">Belum ada checklist</em>}
          </ul>
        </div>
      </>
    )}
  </Modal.Body>

  <Modal.Footer className="border-0">
    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
      Tutup
    </Button>
    {/* Tombol Edit hanya untuk Admin atau pemilik card dan jika bisa edit */}
    {!!detailCard && (isAdmin || user?.id === parseInt(userId)) && hasPermission("Work Organizer.update") && (
      <Button
        variant="primary"
        onClick={() => {
          const list = boards.find((l) => l.id === detailCard.list_id);
          if (!canEditCard(list)) {
            Swal.fire({
              title: "Tidak Dapat Edit",
              text: "Card ini sudah locked lebih dari 1 hari dan tidak dapat diedit",
              icon: "warning",
              confirmButtonColor: "#3085d6",
              confirmButtonText: "OK",
            });
            return;
          }
          setShowDetailModal(false);
          handleEditCard(detailCard.list_id, detailCard);
        }}
      >
        Edit
      </Button>
    )}
  </Modal.Footer>
</Modal>

      {/* CSS untuk skeleton animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </>
  );
};

export default WorkOrganizerUserTasks;