import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

// components
import MaximizeScreen from "@/components/MaximizeScreen";
import ProfileDropdown from "@/components/ProfileDropdown";
import profilePic from "@/assets/images/users/user-1.jpg";
import logoSyntax from "@/assets/images/logo-syntax.png";
import { useViewport } from "@/hooks/useViewPort";
import { useLayoutContext } from "@/context/useLayoutContext.jsx";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { toggleDocumentAttribute } from "@/utils";

const ProfileMenus = [
  { label: "My Account", icon: "fe-user", redirectTo: "/profile/index" },
  { label: "Logout", icon: "fe-log-out", redirectTo: "/auth/logout" },
];

const Topbar = ({ hideLogo, navCssClasses }) => {
  const { width } = useViewport();
  const { menu, orientation, changeMenuSize, themeCustomizer } = useLayoutContext();
  const { user } = useAuthContext();
  
  // State untuk poin user
  const [userPoin, setUserPoin] = useState(0);
  const [loadingPoin, setLoadingPoin] = useState(false);
  // ⭐ State untuk kategori holding
  const [holdingKategori, setHoldingKategori] = useState('');

  const navbarCssClasses = navCssClasses || "";
  const containerCssClasses = !hideLogo ? "container-fluid" : "";

  const username = user?.name || "Guest";
  const userTitle = user?.role?.role_name || "User";

  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "";

  // Profile picture
  const profilePicUrl = user?.foto
    ? `${apiBase}/storage/${user.foto}?t=${new Date().getTime()}`
    : profilePic;

  // Ambil token dari localStorage
  const token = localStorage.getItem("authToken");

  // ⭐ Fetch data user lengkap (termasuk holding)
  const fetchUserData = async () => {
    if (!user?.id) return;
    
    setLoadingPoin(true);
    try {
      const response = await axios.get(`${apiBase}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        // Set poin
        if (response.data.poin !== undefined) {
          setUserPoin(response.data.poin);
        }
        
        // ⭐ Set kategori holding
        if (response.data.holding?.kategori) {
          setHoldingKategori(response.data.holding.kategori);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
    } finally {
      setLoadingPoin(false);
    }
  };

  // Fetch data saat komponen dimuat
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  // ⭐ Cek apakah poin harus ditampilkan
  const shouldShowPoin = holdingKategori === 'non_profit';

  // Fungsi toggle menu (sama seperti sebelumnya)
  const handleLeftMenuCallBack = () => {
    if (width < 1140) {
      if (menu.size === "full") {
        showLeftSideBarBackdrop();
        toggleDocumentAttribute("class", "sidebar-enable");
      } else {
        changeMenuSize("full");
      }
    } else if (menu.size === "condensed") {
      changeMenuSize("default");
    } else if (menu.size === "full") {
      showLeftSideBarBackdrop();
      toggleDocumentAttribute("class", "sidebar-enable");
    } else if (menu.size === "fullscreen") {
      changeMenuSize("default");
      toggleDocumentAttribute("class", "sidebar-enable");
    } else {
      changeMenuSize("condensed");
    }
  };

  function showLeftSideBarBackdrop() {
    const backdrop = document.createElement("div");
    backdrop.id = "custom-backdrop";
    backdrop.className = "offcanvas-backdrop fade show";
    document.body.appendChild(backdrop);
    if (document.getElementsByTagName("html")[0]?.getAttribute("dir") !== "rtl") {
      document.body.style.overflow = "hidden";
      if (width > 1140) document.body.style.paddingRight = "15px";
    }
    backdrop.addEventListener("click", function () {
      toggleDocumentAttribute("class", "sidebar-enable", true);
      changeMenuSize("full");
      hideLeftSideBarBackdrop();
    });
  }

  function hideLeftSideBarBackdrop() {
    const backdrop = document.getElementById("custom-backdrop");
    if (backdrop) {
      document.body.removeChild(backdrop);
      document.body.style.overflow = "visible";
    }
  }

  return (
    <div className={`navbar-custom ${navbarCssClasses}`}>
      <div className={`topbar ${containerCssClasses}`}>
        {/* Bagian kiri */}
        <div className="topbar-menu d-flex align-items-center gap-1">
          {!hideLogo && (
            <div className="logo-box">
              <Link to="/" className="logo text-center">
                <span className="logo-sm">
                  <img src={logoSyntax} alt="Syntax Logo" height="22" />
                </span>
                <span className="logo-lg">
                  <img src={logoSyntax} alt="Syntax Logo" height="28" />
                </span>
              </Link>
            </div>
          )}

          <button className="button-toggle-menu" onClick={handleLeftMenuCallBack}>
            <i className="mdi mdi-menu" />
          </button>
        </div>

        {/* Bagian kanan */}
        <div className="topbar-right-scroll">
          <ul className="topbar-menu d-flex align-items-center">
            
            {/* ⭐ POIN USER - HANYA TAMPIL JIKA NON PROFIT */}
            {shouldShowPoin && (
              <>
                {/* Tampilan Desktop */}
                {/* <li className="dropdown d-none d-lg-inline-block">
                  <div className="d-flex align-items-center bg-light bg-opacity-25 rounded-pill px-3 py-1">
                    <i className="mdi mdi-star text-warning me-1"></i>
                    <span className="fw-bold text-dark">{userPoin}</span>
                    <span className="text-muted ms-1">poin</span>
                  </div>
                </li> */}

                {/* Tampilan Mobile */}
                {/* <li className="dropdown d-lg-none">
                  <div className="d-flex align-items-center">
                    <i className="mdi mdi-star text-warning me-1"></i>
                    <span className="fw-bold">{userPoin}</span>
                  </div>
                </li> */}
              </>
            )}

            {/* ⭐ DEBUG INFO - BISA DIHAPUS NANTI */}
            {!shouldShowPoin && process.env.NODE_ENV === 'development' && (
              <li className="dropdown d-none d-lg-inline-block">
                {/* <div className="d-flex align-items-center bg-secondary bg-opacity-10 rounded-pill px-3 py-1">
                  <span className="text-muted small">(Profit)</span>
                </div> */}
              </li>
            )}

            <li className="dropdown d-none d-lg-inline-block">
              <MaximizeScreen />
            </li>

            <li className="dropdown">
              <ProfileDropdown
                profilePic={profilePicUrl}
                menuItems={ProfileMenus}
                username={username}
                userTitle={userTitle}
              />
            </li>

            <li>
              <button
                className="nav-link dropdown-toggle right-bar-toggle waves-effect waves-light btn btn-link shadow-none"
                onClick={themeCustomizer.toggle}
              >
                <i className="fe-settings noti-icon font-22"></i>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* CSS (sama seperti sebelumnya) */}
      <style jsx>{`
        .navbar-custom {
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 70px;
          padding: 0 1rem;
        }
        
        .topbar-right-scroll {
          display: flex;
        }
        
        .topbar-right-scroll .topbar-menu {
          flex-wrap: nowrap;
          gap: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .topbar {
            padding: 0 0.5rem;
            min-height: 60px;
            gap: 0.5rem;
          }
          
          .topbar-right-scroll {
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
            max-width: 200px;
          }
          
          .topbar-right-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .topbar-right-scroll .topbar-menu {
            min-width: max-content;
            gap: 0.75rem;
            padding: 0 0.5rem;
          }
          
          .logo-lg {
            display: none !important;
          }
          
          .logo-sm {
            display: inline-block !important;
          }
        }
        
        @media (max-width: 576px) {
          .topbar-right-scroll {
            max-width: 180px;
          }
          
          .topbar-right-scroll .topbar-menu {
            gap: 0.5rem;
            padding: 0 0.25rem;
          }
        }
        
        @media (max-width: 480px) {
          .topbar-right-scroll {
            max-width: 160px;
          }
        }
        
        @media (max-width: 360px) {
          .topbar-right-scroll {
            max-width: 140px;
          }
        }
      `}</style>
    </div>
  );
};

export default Topbar;