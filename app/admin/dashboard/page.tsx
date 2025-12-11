"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import {
  Users,
  Ticket,
  TrendingUp,
  AlertCircle,
  Settings,
  Lock,
  BarChart3,
} from "lucide-react";

interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  icon: string;
}

interface DashboardData {
  stats: DashboardStat[];
  recentEvents?: Array<{ id: string; title: string; status: string }>;
  recentUsers?: Array<{ id: string; name: string; email: string }>;
}

const iconMap: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Ticket,
  Users,
  TrendingUp,
  BarChart3,
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/signin");
    }
  }, [status, router]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin/signin");
          return;
        }
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      console.error("Dashboard error:", err);
    }
  }, [router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchDashboardData();
    }
  }, [status, session, fetchDashboardData]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-slate-600">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userName={session.user.name || "Admin"}
        userRole={session.user.role || undefined}
        userEmail={session.user.email || undefined}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {session.user.name?.split(" ")[0]}!
          </h1>
          <p className="text-slate-600 mt-2">
            {isSuperAdmin
              ? "Manage your entire ticket booking system"
              : "Manage your assigned events and permissions"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-red-900">
                Error loading dashboard
              </h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {dashboardData?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardData.stats.map((stat, idx) => {
              const IconComponent = iconMap[stat.icon] || Ticket;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        {stat.value}
                      </p>
                      {stat.change && (
                        <p className="text-xs text-green-600 mt-1">
                          {stat.change}
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {isSuperAdmin ? (
              <SuperAdminDashboard />
            ) : (
              <AdminDashboard userRole={session.user.role || "ADMIN"} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <a
                  href="/admin/events"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-slate-700 hover:text-blue-600"
                >
                  <Ticket className="w-4 h-4" />
                  <span className="text-sm font-medium">Manage Events</span>
                </a>
                {isSuperAdmin && (
                  <>
                    <a
                      href="/admin/users"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-slate-700 hover:text-blue-600"
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </a>
                    <a
                      href="/admin/super/permissions"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-slate-700 hover:text-blue-600"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">Permissions</span>
                    </a>
                  </>
                )}
                <a
                  href="/admin/profile"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-slate-700 hover:text-blue-600"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">My Profile</span>
                </a>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-4">
                Check our documentation or contact support for assistance.
              </p>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View Documentation →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          System Overview
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">Loading...</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Events</p>
              <p className="text-2xl font-bold text-slate-900">Loading...</p>
            </div>
            <Ticket className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Revenue (This Month)
              </p>
              <p className="text-2xl font-bold text-slate-900">Loading...</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Admin Management */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Admin Management
          </h2>
          <a
            href="/admin/super/promote"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Manage Admins →
          </a>
        </div>
        <p className="text-slate-600">
          Add, remove, or modify administrator privileges and permissions.
        </p>
      </div>
    </div>
  );
}

function AdminDashboard({ userRole }: { userRole: string }) {
  return (
    <div className="space-y-6">
      {/* Role Information */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Your Role & Permissions
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-slate-700">Role: {userRole}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-slate-700">
              Manage events and related content
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
            <span className="text-slate-700">View sales analytics</span>
          </div>
        </div>
      </div>

      {/* My Events */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">My Events</h2>
          <a
            href="/admin/events"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All →
          </a>
        </div>
        <p className="text-slate-600">
          Create, edit, and manage your ticket events.
        </p>
      </div>
    </div>
  );
}
