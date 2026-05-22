import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { Spinner } from "react-bootstrap";

const PrivateRoute = ({ 
  element, 
  menuKey,      // Ganti dari 'roles' → 'menuKey'
  action = "read", // Action: read/create/update/delete (default: read)
  fallbackPath = "/error-403" // Path jika tidak punya permission
}) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuthContext();
  const location = useLocation();

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Memuat...</p>
      </div>
    );
  }

  // ✅ console log untuk debugging
  const user = JSON.parse(localStorage.getItem("currentUser"));
  // console.log("PrivateRoute check user:", user);
  // console.log("isAuthenticated:", isAuthenticated);
  // console.log("menuKey:", menuKey);
  // console.log("action:", action);

  // ✅ Belum login → redirect ke login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // ✅ PERMISSION CHECK: Auto-generate permission name dari menuKey + action
  if (menuKey) {
    const requiredPermission = `${menuKey}.${action}`;
    
    // console.log(`🔐 Checking permission: "${requiredPermission}"`);
    // console.log(`User has permission: ${hasPermission(requiredPermission)}`);
    
    // Jika tidak punya permission yang dibutuhkan
    if (!hasPermission(requiredPermission)) {
      // console.warn(`🚫 Access denied to ${location.pathname}`);
      // console.warn(`Required permission: ${requiredPermission}`);
      
      // Redirect ke error 403
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }
  }

  // ✅ Authorised → tampilkan element
  return element;
};

export default PrivateRoute;