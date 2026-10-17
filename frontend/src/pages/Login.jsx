import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { Lock, Mail, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Silakan masukkan email dan kata sandi Anda.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Memverifikasi kredensial...");
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      if (res.success) {
        toast.success(res.message || "Berhasil masuk sistem!", { id: toastId });
        localStorage.setItem("elkon_token", res.token);
        onLoginSuccess(res.user);
        navigate("/admin");
      }
    } catch (error) {
      toast.dismiss(toastId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6 text-center">
        <img src="/logo.png" alt="elkon logo" className="mx-auto h-12 w-auto object-contain" />
        <h2 className="font-serif text-3xl font-light tracking-widest text-stone-900 uppercase">
          Portal Admin
        </h2>
        <p className="text-xs text-stone-400 tracking-wider">
          Otorisasi diperlukan untuk mengakses dasbor toko
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md bg-white border border-stone-100 p-8 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Alamat Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                className="w-full bg-stone-50/50 border border-stone-200 pl-10 pr-4 py-3 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-450"
                placeholder="admin@elkon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                className="w-full bg-stone-50/50 border border-stone-200 pl-10 pr-4 py-3 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-405"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
            >
              <span>{loading ? "Memverifikasi..." : "Masuk"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center border-t border-stone-100 pt-6">
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Kredensial bawaan untuk pengujian lokal: <br />
            Email: <span className="font-medium text-stone-600">admin@elkon.com</span> &middot; Kata Sandi: <span className="font-medium text-stone-600">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
