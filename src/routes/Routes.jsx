import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// Layouts
import DefaultLayout from "@/layouts/Default";
import VerticalLayout from "@/layouts/Vertical";
import DetachedLayout from "@/layouts/Detached";
import HorizontalLayout from "@/layouts/Horizontal/";
import TwoColumnLayout from "@/layouts/TwoColumn/";

// Contexts
import { useLayoutContext } from "@/context/useLayoutContext.jsx";
import { useAuthContext } from "@/context/useAuthContext.jsx";

// Routes data
import { authProtectedFlattenRoutes, publicProtectedFlattenRoutes } from "./index";

// ✅ IMPORT FILE ERROR YANG BENAR (HAPUS TEMPORARY COMPONENT!)
import Error403 from "@/pages/error/Error403"; // File sudah ada di src/pages/error/
import Error404 from "@/pages/error/Error404";

const AllRoutes = (props) => {
  const { isAuthenticated } = useAuthContext();
  const { orientation } = useLayoutContext();

  const getLayout = () => {
    switch (orientation) {
      case "horizontal":
        return HorizontalLayout;
      case "detached":
        return DetachedLayout;
      case "vertical":
        return VerticalLayout;
      default:
        return TwoColumnLayout;
    }
  };

  const Layout = getLayout();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public routes */}
        {publicProtectedFlattenRoutes.map((route, idx) => (
          <Route
            key={`public-${idx}`}
            path={route.path}
            element={
              <DefaultLayout {...props}>
                {route.element}
              </DefaultLayout>
            }
          />
        ))}

        {/* Protected routes with permission check - INI YANG PENTING! */}
        {authProtectedFlattenRoutes.map((route, idx) => {
          const RouteWrapper = route.route || Route;
          
          return (
            <Route
              key={`protected-${idx}`}
              path={route.path}
              element={
                <RouteWrapper
                  element={
                    <Layout {...props}>
                      {route.element}
                    </Layout>
                  }
                  menuKey={route.menuKey} 
                  action={route.action}     
                />
              }
            />
          );
        })}

        {/* Error pages - SEKARANG MENGGUNAKAN FILE YANG BENAR */}
        <Route 
          path="/error-403" 
          element={
            <DefaultLayout {...props}>
              <Error403 />
            </DefaultLayout>
          } 
        />
        <Route 
          path="/error-404" 
          element={
            <DefaultLayout {...props}>
              <Error404 />
            </DefaultLayout>
          } 
        />

        {/* Catch-all */}
        <Route 
          path="*" 
          element={
            <Navigate 
              to={isAuthenticated ? "/dashboard-1" : "/auth/login"} 
              replace 
            /> 
          } 
        />
      </Routes>
    </Suspense>
  );
};

export default AllRoutes;