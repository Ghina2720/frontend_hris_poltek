import { Button, Row, Col, FormGroup, FormLabel, FormControl } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import Feedback from "react-bootstrap/esm/Feedback";
import AuthLayout from "./AuthLayout";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/context/useAuthContext.jsx";
import { useState } from "react";

/* Bottom links */
const BottomLink = () => {
  const { t } = useTranslation();
  return (
    <Row className="mt-3">
      <Col className="text-center"></Col>
    </Row>
  );
};

const Login = () => {
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { saveSession } = useAuthContext();

  const [isLoading, setIsLoading] = useState(false); 

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const onSubmit = async (data) => {
  if (isLoading) return;
  setIsLoading(true);

  try {
    const res = await axios.post(`${API_BASE_URL}/login`, {
      email: data.email,
      password: data.password,
    });

    // ✅ Tambahkan pengecekan ini
    if (!res.data || !res.data.user) {
      throw new Error("Response tidak lengkap");
    }

    const userFromBackend = res.data.user;
    const token = res.data.token;
    const permissions = res.data.permissions || [];

    const userData = {
      ...userFromBackend,
      token: token,
      permissions: permissions,
      role_name: userFromBackend.role?.name || "User"  // ← sudah pakai optional chaining
    };

    saveSession(userData);

    localStorage.setItem("authToken", token);
    localStorage.setItem("role", userFromBackend.role?.name || "User");

    navigate("/dashboard-1", { replace: true });

  } catch (err) {
    console.error(err);
    
    // ✅ Perbaiki pesan error
    if (!navigator.onLine || err.code === 'ERR_NETWORK') {
      alert("Tidak ada koneksi internet. Periksa koneksi Anda.");
    } else if (err.response?.status === 401) {
        alert("Email atau password salah!");
      } else {
        alert(err.response?.data?.message || "Login gagal. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AuthLayout
      helpText={t("Enter your email address and password to access admin panel.")}
      bottomLinks={<BottomLink />}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div className="mb-3">
          <Controller
            name="email"
            control={control}
            rules={{ required: t("Email is required") }}
            render={({ field, fieldState }) => (
              <FormGroup>
                <FormLabel htmlFor="email">{t("Email")}</FormLabel>
                <FormControl
                  id="email"
                  type="email"
                  {...field}
                  isInvalid={Boolean(fieldState.error?.message)}
                />
                {fieldState.error?.message && (
                  <Feedback type="invalid" className="text-danger">
                    {fieldState.error?.message}
                  </Feedback>
                )}
              </FormGroup>
            )}
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <Controller
            name="password"
            control={control}
            rules={{ required: t("Password is required") }}
            render={({ field, fieldState }) => (
              <FormGroup>
                <FormLabel htmlFor="password">{t("Password")}</FormLabel>
                <FormControl
                  id="password"
                  type="password" // 🔹 tipe password
                  {...field}
                  isInvalid={Boolean(fieldState.error?.message)}
                />
                {fieldState.error?.message && (
                  <Feedback type="invalid" className="text-danger">
                    {fieldState.error?.message}
                  </Feedback>
                )}
              </FormGroup>
            )}
          />
        </div>

        <div className="text-center d-grid">
         <Button 
            variant="primary" 
            type="submit"
            disabled={isLoading} 
          >
            {t("Log In")}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
