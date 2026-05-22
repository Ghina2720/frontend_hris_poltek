import { useState } from "react";
import { Button, Row, Col, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";

// components
import { VerticalForm, FormInput } from "../../components/";
import AuthLayout from "./AuthLayout";
import { useAuthContext } from "@/context/useAuthContext.jsx"; // ✅ ambil context auth
import defaultUserImg from "@/assets/images/users/user-1.jpg";

/* bottom link */
const BottomLink = () => {
  const { t } = useTranslation();

  return (
    <Row className="mt-3">
      <Col className="text-center">
        <p className="text-white-50">
          {t("Not you? return")}{" "}
          <Link to={"/auth/login"} className="text-white ms-1">
            <b>{t("Sign In")}</b>
          </Link>
        </p>
      </Col>
    </Row>
  );
};

const LockScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthContext(); // ✅ ambil data user aktif

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // validasi form
  const schemaResolver = yupResolver(
    yup.object().shape({
      password: yup.string().required(t("Please enter Password")),
    })
  );

  // handle login
  const onSubmit = async (formData) => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login", {
        email: user?.email,
        password: formData.password,
      });

      // ✅ Cek hasil dari API (struktur seperti di controller)
      if (res.data.success) {
        const { user: loggedInUser, token } = res.data;

        // Simpan token & user ke localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(loggedInUser));

        // Update context user
        setUser(loggedInUser);

        // Arahkan ke dashboard
        navigate("/");
      } else {
        setError(res.data.message || "Login gagal.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Password salah atau akun tidak ditemukan.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ambil data user (untuk tampilan)
  const username = user?.name || "Guest";
  const userImg = user?.avatar || defaultUserImg;

  return (
    <>
      <AuthLayout bottomLinks={<BottomLink />}>
        <div className="text-center w-75 m-auto">
          <img
            src={userImg}
            alt={username}
            height="88"
            className="rounded-circle shadow"
          />
          <h4 className="text-dark-50 text-center mt-3">{t(`Hi! ${username}`)}</h4>
          <p className="text-muted mb-4">
            {t("Enter your password to access the admin.")}
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <VerticalForm onSubmit={onSubmit} resolver={schemaResolver}>
          <FormInput
            label={t("Password")}
            type="password"
            name="password"
            placeholder={t("Enter your password")}
            containerClass={"mb-3"}
          />

          <div className="d-grid text-center">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Loading..." : t("Log In")}
            </Button>
          </div>
        </VerticalForm>
      </AuthLayout>
    </>
  );
};

export default LockScreen;
