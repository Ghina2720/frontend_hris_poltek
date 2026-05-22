import React, { useEffect, useRef, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import SimpleBar from "simplebar-react";
import axios from "axios";

// components
import AppMenu from "./Menu";
import profileImg from "@/assets/images/users/user-1.jpg";
import fallbackLogo from "@/assets/images/logosci.png";
import { FiUser, FiSettings, FiLock, FiLogOut } from "react-icons/fi";
import { useLayoutContext } from "@/context/useLayoutContext.jsx";
import { MENU_ITEMS, filterMenuByPermission } from "../constants/menu"; // Import fungsi filter
import { useAuthContext } from "@/context/useAuthContext.jsx"; // Import AuthContext

/* ===================== 🔹 CONFIG ===================== */
const API_BASE = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, ""); 

/* user box */
const UserBox = () => {
  const ProfileMenus = [
    { label: "My Account", icon: FiUser, redirectTo: "#" },
    { label: "Settings", icon: FiSettings, redirectTo: "#" },
    { label: "Lock Screen", icon: FiLock, redirectTo: "/auth/lock-screen" },
    { label: "Logout", icon: FiLogOut, redirectTo: "/auth/logout" },
  ];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <div className="user-box text-center">
      <img src={profileImg} alt="Profile" className="rounded-circle avatar-md" />
      <Dropdown show={dropdownOpen} onToggle={toggleDropdown}>
        <Dropdown.Toggle
          id="dropdown-notification"
          as="a"
          onClick={toggleDropdown}
          className="cursor-pointer text-dark h5 mt-2 mb-1 d-block"
        >
          Geneva Kennedy
        </Dropdown.Toggle>
        <Dropdown.Menu className="user-pro-dropdown">
          <div onClick={toggleDropdown}>
            {(ProfileMenus || []).map((item, index) => (
              <Link
                to={item.redirectTo}
                className="dropdown-item notify-item"
                key={index + "-profile-menu"}
              >
                <item.icon className="me-1" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </Dropdown.Menu>
      </Dropdown>
      <p className="text-muted">Admin Head</p>
    </div>
  );
};

/* sidebar content */
const SideBarContent = () => {
  const { filteredMenu } = useAuthContext(); // Ambil filteredMenu dari AuthContext
  
  // Fallback jika AuthContext belum ada filteredMenu
  const [localFilteredMenu, setLocalFilteredMenu] = useState([]);
  
  useEffect(() => {
    // Jika filteredMenu dari context kosong, coba filter sendiri
    if (!filteredMenu || filteredMenu.length === 0) {
      // Coba ambil permissions dari localStorage
      const savedPermissions = localStorage.getItem('userPermissions');
      if (savedPermissions) {
        const permissions = JSON.parse(savedPermissions);
        const filtered = filterMenuByPermission(MENU_ITEMS, permissions);
        setLocalFilteredMenu(filtered);
      } else {
        // Jika tidak ada permissions, tampilkan menu kosong
        setLocalFilteredMenu([]);
      }
    }
  }, [filteredMenu]);
  
  const menuToDisplay = filteredMenu && filteredMenu.length > 0 ? filteredMenu : localFilteredMenu;
  
  return (
    <>
      <UserBox />
      <AppMenu menuItems={menuToDisplay} />
      <div className="clearfix" />
    </>
  );
};

const LeftSidebar = ({ isCondensed, hideLogo }) => {
  const menuNodeRef = useRef(null);
  const { orientation } = useLayoutContext();
  
  // 🔹 Ambil permissions dari AuthContext untuk debug
  const { permissions } = useAuthContext();

  // 🔹 State untuk logo dari API
  const [logoKecil, setLogoKecil] = useState(null);
  const [logoPerusahaan, setLogoPerusahaan] = useState(null);

  // 🔹 Ambil auth token dari localStorage
  const token = localStorage.getItem("authToken");

  // 🔹 Ambil data setting dari API menggunakan token
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_BASE}/setting`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        const data = res.data.message[0];
        if (data.logo_kecil) {
          setLogoKecil(`${API_BASE.replace("/api", "")}/storage/${data.logo_kecil}`);
        }
        if (data.logo_perusahaan) {
          setLogoPerusahaan(`${API_BASE.replace("/api", "")}/storage/${data.logo_perusahaan}`);
        }
      })
      .catch(err => {
        // console.error("Gagal mengambil logo:", err);
      });
  }, [token]);

  // 🔹 Debug: Tampilkan permissions di console
  useEffect(() => {
    // console.log("Sidebar - User permissions:", permissions);
    // console.log("Sidebar - Token exists:", !!token);
  }, [permissions, token]);

  // 🔹 Tutup sidebar jika klik di luar area
  const handleOtherClick = e => {
    if (menuNodeRef.current && menuNodeRef.current.contains(e.target)) return;
    if (document.body) document.body.classList.remove("sidebar-enable");
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleOtherClick, false);
    return () => document.removeEventListener("mousedown", handleOtherClick, false);
  }, []);

  return (
    <div className="app-menu" ref={menuNodeRef}>
      {!hideLogo && (
        <div className="logo-box">
          <Link to="/" className="logo logo-dark text-center">
            <span className="logo-sm">
              <img
                src={logoKecil || fallbackLogo}
                alt="logo kecil"
                height="22"
                onError={(e) => (e.target.src = fallbackLogo)}
              />
            </span>
            <span className="logo-lg">
              <img
                src={logoPerusahaan || fallbackLogo}
                alt="logo perusahaan"
                height="30"
                onError={(e) => (e.target.src = fallbackLogo)}
              />
            </span>
          </Link>

          <Link to="/" className="logo logo-light text-center">
            <span className="logo-sm">
              <img
                src={logoKecil || fallbackLogo}
                alt="logo kecil"
                height="22"
                onError={(e) => (e.target.src = fallbackLogo)}
              />
            </span>
            <span className="logo-lg">
              <img
                src={logoPerusahaan || fallbackLogo}
                alt="logo perusahaan"
                height="30"
                onError={(e) => (e.target.src = fallbackLogo)}
              />
            </span>
          </Link>
        </div>
      )}

      {!isCondensed ? (
        <SimpleBar className="scrollbar show h-100" scrollbarMaxSize={320}>
          <SideBarContent />
        </SimpleBar>
      ) : (
        <SideBarContent />
      )}
    </div>
  );
};

LeftSidebar.defaultProps = {
  isCondensed: false,
};

export default LeftSidebar;