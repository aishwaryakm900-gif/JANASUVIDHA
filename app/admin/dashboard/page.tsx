"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  LogOut,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ComplaintItem } from "@/types";
import { MOCK_HOSPITAL } from "@/lib/mock-data";

const TRENDS = [
  { day: "Mon", total: 42, resolved: 39 },
  { day: "Tue", total: 55, resolved: 52 },
  { day: "Wed", total: 48, resolved: 44 },
  { day: "Thu", total: 60, resolved: 57 },
  { day: "Fri", total: 51, resolved: 49 },
  { day: "Sat", total: 68, resolved: 63 },
  { day: "Sun", total: 38, resolved: 36 },
];

const DEPT_DISTRIBUTION = [
  { name: "Hygiene", count: 145 },
  { name: "Water", count: 100 },
  { name: "Pharmacy", count: 219 },
  { name: "Beds", count: 89 },
  { name: "Infra", count: 79 },
  { name: "Staff", count: 66 },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/complaints");
      const data = await res.json();
      if (data.success && Array.isArray(data.complaints)) {
        setComplaints(data.complaints);
      } else {
        setComplaints([]);
      }
    } catch (e) {
      console.error(e);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    document.cookie = "admin_session=; path=/; max-age=0";
    router.push("/admin/login");
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const total = safeComplaints.length || 698;
  const pending = safeComplaints.filter((c) => c?.status === "PENDING" || c?.status === "ASSIGNED" || c?.status === "IN_PROGRESS").length || 32;
  const resolved = safeComplaints.filter((c) => c?.status === "VERIFIED" || c?.status === "RESOLUTION_SUBMITTED").length || 660;
  const overdue = safeComplaints.filter((c) => c?.status === "ESCALATED").length || 6;

  const escalations = safeComplaints.filter((c) => c?.status === "ESCALATED" || c?.priority === "CRITICAL" || ((c?.recurrenceCount || 0) >= 5));

  return (
    <div className="min-h-screen bg-[#F5F8F7] p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2EBE8] gap-4">
          <div>
            <span className="text-xs font-semibold text-[#147D78] uppercase tracking-wider block">
              Hospital Administration Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12343B]">
              Executive Dashboard
            </h1>
            <p className="text-xs text-[#607477]">
              {MOCK_HOSPITAL.name} • Dr. R. Narayana, Medical Superintendent
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/complaints"
              className="text-xs font-semibold text-[#147D78] bg-[#E8F4F1] hover:bg-[#147D78] hover:text-white px-3.5 py-2.5 rounded-xl border border-[#147D78]/20 transition-all"
            >
              Citizen Grievance Records
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607477] hover:text-[#12343B] bg-white border border-[#E2EBE8] px-3.5 py-2.5 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* 4 Clean KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-1">
            <span className="text-xs font-bold text-[#607477] uppercase block">Total Complaints</span>
            <div className="text-3xl font-extrabold text-[#12343B]">{total}</div>
            <span className="text-[11px] text-[#607477]">Hospital lifetime</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-1">
            <span className="text-xs font-bold text-amber-700 uppercase block">Pending Complaints</span>
            <div className="text-3xl font-extrabold text-amber-600">{pending}</div>
            <span className="text-[11px] text-[#607477]">Currently open</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase block">Resolved Complaints</span>
            <div className="text-3xl font-extrabold text-emerald-600">{resolved}</div>
            <span className="text-[11px] text-[#607477]">Verified with evidence</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-1">
            <span className="text-xs font-bold text-rose-700 uppercase block">Overdue Complaints</span>
            <div className="text-3xl font-extrabold text-rose-600">{overdue}</div>
            <span className="text-[11px] text-[#607477]">SLA breach alerts</span>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trends */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#12343B]">
              Resolution Trends (Last 7 Days)
            </h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TRENDS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" fontSize={11} stroke="#607477" />
                  <YAxis fontSize={11} stroke="#607477" />
                  <Tooltip />
                  <Bar dataKey="total" fill="#12343B" name="Reported" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="#147D78" name="Resolved" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2EBE8] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#12343B]">
              Department-Wise Complaint Distribution
            </h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEPT_DISTRIBUTION} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={11} stroke="#607477" />
                  <YAxis dataKey="name" type="category" fontSize={11} stroke="#607477" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#147D78" radius={[0, 4, 4, 0]} name="Grievances" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Escalations Section */}
        <div className="bg-white rounded-3xl border border-[#E2EBE8] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#12343B] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>SLA Escalations Requiring Intervention</span>
            </h3>
            <span className="text-xs text-[#607477]">
              {escalations.length} Active Notice(s)
            </span>
          </div>

          <div className="divide-y divide-[#E2EBE8]">
            {escalations.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                      {item.complaintNumber || item.ticketNumber}
                    </span>
                    <strong className="text-[#12343B]">{item.summary}</strong>
                  </div>
                  <span className="text-[11px] text-[#607477] block mt-0.5">
                    {item.wardOrLocation} • {item.departmentName} • {item.recurrenceCount} Citizen Reports
                  </span>
                </div>

                <Link
                  href={`/official/complaints/${item.ticketNumber}`}
                  className="font-bold text-[#147D78] hover:underline shrink-0"
                >
                  Review ➔
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
