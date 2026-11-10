"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight, ArrowLeft } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin/dashboard";

  const [email, setEmail] = useState("admin@janasuvidha.gov.in");
  const [password, setPassword] = useState("adminpass123");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(redirectUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607477] hover:text-[#12343B] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <span className="text-xs text-[#607477]">JANASUVIDHA</span>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-6">
        <div className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F4F1] text-[#147D78] flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#12343B]">
            Hospital Administration Login
          </h1>
          <p className="text-xs text-[#607477]">
            Medical Superintendent & Hospital Administration Dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#12343B] uppercase">
              Administrator Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs p-3.5 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#12343B] uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs p-3.5 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#12343B] hover:bg-[#0c2328] text-white text-xs font-semibold py-3.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Admin Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[11px] text-[#607477]">
          Demo credentials pre-filled. Press button to enter.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F8F7] flex flex-col justify-center items-center p-6">
      <Suspense fallback={<div className="text-xs text-[#607477]">Loading admin login...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
