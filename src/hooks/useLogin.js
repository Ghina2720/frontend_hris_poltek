import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as yup from 'yup';
import { useAuthContext } from '@/context/useAuthContext';
import axios from 'axios';

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { saveSession } = useAuthContext();
  const [searchParams] = useSearchParams();

  const loginFormSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Please enter your email'),
    username: yup.string().required('Please enter your username'),
  });

  const { control, handleSubmit, setError } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: { email: 'user@demo.com', username: 'demo' },
  });

  const redirectUser = () => {
    const redirectLink = searchParams.get('redirectTo');
    navigate(redirectLink || '/dashboard-1');
  };

  const login = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:8000/api/login', values, {
        headers: { Accept: 'application/json' },
      });

      // Ambil token dari berbagai kemungkinan field
      const token =
        data?.token ??
        data?.access_token ??
        data?.data?.token ??
        null;

      // Bangun objek "flat user" sesuai AuthProvider (bukan nested user)
      const rawUser = data?.user ?? data?.data?.user ?? data ?? {};
      const flatUser = {
        // identitas
        id: rawUser.id ?? data?.id ?? data?.data?.id ?? null,
        name: rawUser.name ?? rawUser.username ?? rawUser.email ?? 'User',
        username: rawUser.username ?? null,
        email: rawUser.email ?? null,
        role: rawUser.role ?? rawUser.user_type ?? 'User',
        avatar: rawUser.avatar ?? rawUser.photo ?? null,
        // simpan token di level atas juga (opsional tapi praktis)
        token: token ?? null,
      };

      // Validasi minimal: harus punya token & ada identitas dasar
      if (flatUser.token && (flatUser.name || flatUser.username || flatUser.email)) {
        // ⬅️ SIMPAN DATAR (flat) → sesuai saveSession(context) kamu
        saveSession(flatUser);
        redirectUser();
      } else {
        const msg = data?.error || data?.message || 'Login failed';
        setError('email', { type: 'manual', message: msg });
        setError('username', { type: 'manual', message: msg });
      }
    } catch (e) {
      const raw = e?.response?.data;
      const msg =
        raw?.error ||
        raw?.message ||
        (typeof raw === 'string' ? raw : null) ||
        (e.message?.includes('Network') ? 'Tidak bisa terhubung ke server' : 'Login gagal');

      setError('email', { type: 'manual', message: msg });
      setError('username', { type: 'manual', message: msg });
    } finally {
      setLoading(false);
    }
  });

  return { loading, login, control };
};

export default useLogin;
