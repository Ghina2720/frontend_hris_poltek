import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import classNames from "classnames";
import { useAuthContext } from "@/context/useAuthContext"; // ✅ ambil context login/logout

const ProfileDropdown = (props) => {
  const profilePic = props["profilePic"] || null;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { removeSession } = useAuthContext(); // ✅ ambil fungsi logout dari context

  // Toggle dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Tangani klik menu item
  const handleItemClick = (item) => {
    if (item.label === "Logout") {
      removeSession(); // ✅ hapus cookie & redirect ke login
    } else if (item.redirectTo) {
      navigate(item.redirectTo);
    }
    setDropdownOpen(false);
  };

  return (
    <Dropdown show={dropdownOpen} onToggle={toggleDropdown}>
      <Dropdown.Toggle
        id="dropdown-profile"
        as="a"
        onClick={toggleDropdown}
        className={classNames(
          "nav-link nav-user me-0 waves-effect waves-light",
          { show: dropdownOpen }
        )}
      >
       <img
          src={profilePic}
          alt="profile"
          className="rounded-circle border"
          style={{
            width: "40px",
            height: "40px",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />

        <span className="pro-user-name ms-1">
          {props["username"]} <i className="mdi mdi-chevron-down"></i>
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="dropdown-menu dropdown-menu-end profile-dropdown">
        <div onClick={toggleDropdown}>
          <div className="dropdown-header noti-title">
            <h6 className="text-overflow m-0">{props["userTitle"] || "Welcome!"}</h6>
          </div>

          {(props.menuItems || []).map((item, i) => (
            <React.Fragment key={i}>
              {i === props["menuItems"].length - 1 && (
                <div className="dropdown-divider"></div>
              )}
              <a
                onClick={() => handleItemClick(item)}
                className="dropdown-item notify-item cursor-pointer"
              >
                <i className={`${item.icon} me-1`}></i>
                <span>{item.label}</span>
              </a>
            </React.Fragment>
          ))}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ProfileDropdown;
