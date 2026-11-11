"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserCheck, ArrowRight, ArrowLeft, UserPlus } from "lucide-react";
import { HOSPITAL_DEPARTMENTS, HospitalDepartment } from "@/types";

function OfficialLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/official/dashboard";

  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Login form state
  const [email, setEmail] = useState("officer.hygiene@janasuvidha.gov.in");
  const [password, setPassword] = useState("password123");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regOfficialId, setRegOfficialId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regDepartment, setRegDepartment] = useState<HospitalDepartment>("Hygiene and Sanitation");
  const [regDesignation, setRegDesignation] = useState<"Department Officer" | "Department Supervisor">("Department Officer");
  const [regHospital, setRegHospital] = useState("Outpatient Department, Ballari");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState("");
  const [regError, setRegError] = useState("");

  const handleLogin = async (overrideEmail?: string) => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/official/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: overrideEmail || email, password }),
      });
      const data = await res.json();
      if (data.success && data.official) {
        if (typeof window !== "undefined") {
          localStorage.setItem("janasuvidha_official", JSON.stringify(data.official));
        }
        router.push(redirectUrl);
      } else {
        setLoginError(data.error || "Login failed. Please check your credentials.");
      }
    } catch (e: any) {
      setLoginError(e.message || "Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");
    setRegSuccess("");

    try {
      const res = await fetch("/api/auth/official/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          officialId: regOfficialId,
          email: regEmail,
          password: regPassword,
          department: regDepartment,
          designation: regDesignation,
          hospital: regHospital,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setRegSuccess("Official registered successfully! Please sign in with your email.");
        setEmail(regEmail);
        setTimeout(() => {
          setActiveTab("LOGIN");
        }, 1500);
      } else {
        setRegError(data.error || "Registration failed.");
      }
    } catch (err: any) {
      setRegError(err.message || "Failed to register official.");
    } finally {
      setRegLoading(false);
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

      {/* Card */}
      <div className="bg-white p-8 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-6">
        <div className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F4F1] text-[#147D78] flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#12343B]">
            Department Official Portal
          </h1>
          <p className="text-xs text-[#607477]">
            Access and resolve grievances assigned to your hospital department.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F5F8F7] p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("LOGIN")}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              activeTab === "LOGIN"
                ? "bg-white text-[#12343B] shadow-xs"
                : "text-[#607477] hover:text-[#12343B]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REGISTER")}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              activeTab === "REGISTER"
                ? "bg-white text-[#12343B] shadow-xs"
                : "text-[#607477] hover:text-[#12343B]"
            }`}
          >
            Register Official
          </button>
        </div>

        {activeTab === "LOGIN" ? (
          <div className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {loginError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#12343B] uppercase">
                  Official Email
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
                disabled={loginLoading}
                className="w-full bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-semibold py-3.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>{loginLoading ? "Authenticating..." : "Sign In to Department"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Switch */}
            <div className="pt-4 border-t border-[#E2EBE8] space-y-2">
              <span className="text-[11px] font-bold text-[#607477] uppercase tracking-wider block text-center">
                Verified Role Switcher
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleLogin("officer.hygiene@janasuvidha.gov.in")}
                  className="w-full text-left p-2.5 rounded-xl border border-[#E2EBE8] hover:bg-[#F5F8F7] text-xs transition-colors flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-[#12343B] block">Demo Official</span>
                    <span className="text-[10px] text-[#607477]">
                      Hygiene and Sanitation • Department Officer
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#607477]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin("supervisor.hygiene@janasuvidha.gov.in")}
                  className="w-full text-left p-2.5 rounded-xl border border-[#E2EBE8] hover:bg-[#F5F8F7] text-xs transition-colors flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-[#12343B] block">Demo Supervisor</span>
                    <span className="text-[10px] text-[#607477]">
                      Hygiene and Sanitation • Department Supervisor
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#607477]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin("officer.water@janasuvidha.gov.in")}
                  className="w-full text-left p-2.5 rounded-xl border border-[#E2EBE8] hover:bg-[#F5F8F7] text-xs transition-colors flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-[#12343B] block">Water & Facilities Officer</span>
                    <span className="text-[10px] text-[#607477]">
                      Water and Facilities • Department Officer
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#607477]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin("officer.pharmacy@janasuvidha.gov.in")}
                  className="w-full text-left p-2.5 rounded-xl border border-[#E2EBE8] hover:bg-[#F5F8F7] text-xs transition-colors flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-[#12343B] block">Pharmacy Officer</span>
                    <span className="text-[10px] text-[#607477]">
                      Pharmacy and Medicine Availability • Department Officer
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#607477]" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* OFFICIAL REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-3.5 text-left">
            {regError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                {regSuccess}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#12343B] uppercase">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#12343B] uppercase">
                  Official ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. HYG-804"
                  value={regOfficialId}
                  onChange={(e) => setRegOfficialId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#12343B] uppercase">
                  Hospital
                </label>
                <input
                  type="text"
                  value={regHospital}
                  onChange={(e) => setRegHospital(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#12343B] uppercase">
                Official Email
              </label>
              <input
                type="email"
                placeholder="name.dept@janasuvidha.gov.in"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#12343B] uppercase">
                Password
              </label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#12343B] uppercase">
                Department
              </label>
              <select
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value as HospitalDepartment)}
                className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
              >
                {HOSPITAL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#12343B] uppercase">
                Designation
              </label>
              <select
                value={regDesignation}
                onChange={(e) => setRegDesignation(e.target.value as any)}
                className="w-full text-xs p-3 rounded-xl border border-[#E2EBE8] focus:border-[#147D78] focus:outline-none bg-[#F5F8F7]"
              >
                <option value="Department Officer">Department Officer</option>
                <option value="Department Supervisor">Department Supervisor</option>
              </select>
              <p className="text-[10px] text-[#607477]">
                *Hospital Administrator accounts must be created or approved by an administrator.
              </p>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-[#147D78] hover:bg-[#0e5e5a] text-white text-xs font-semibold py-3.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{regLoading ? "Registering Official..." : "Register Official Account"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function OfficialLoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F8F7] flex flex-col justify-center items-center p-6">
      <Suspense fallback={<div className="text-xs text-[#607477]">Loading login...</div>}>
        <OfficialLoginForm />
      </Suspense>
    </div>
  );
}
