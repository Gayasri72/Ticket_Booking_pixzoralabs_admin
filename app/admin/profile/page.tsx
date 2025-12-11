"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { User, Lock, Shield, Mail, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  permissions: Permission[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/signin");
    }
  }, [status, router]);

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/me", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin/signin");
          return;
        }
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      setProfileData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
      console.error("Profile error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchProfileData();
    }
  }, [status, session, fetchProfileData]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: "error",
        message: "New passwords do not match",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    try {
      setPasswordLoading(true);
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to change password");
      }

      setPasswordMessage({
        type: "success",
        message: "Password changed successfully",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordMessage({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar
          userName={session?.user?.name || undefined}
          userRole={session?.user?.role || undefined}
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading profile...</p>
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userName={session.user.name || "Admin"}
        userRole={session.user.role || undefined}
        userEmail={session.user.email || undefined}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600 mt-2">Manage your account settings</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            {profileData && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-slate-900">
                    Personal Information
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">
                      Full Name
                    </Label>
                    <p className="mt-1 text-slate-900 font-medium">
                      {profileData.user.name}
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <p className="mt-1 text-slate-900">
                      {profileData.user.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Shield className="w-4 h-4" />
                        Role
                      </Label>
                      <p className="mt-1">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            profileData.user.role === "SUPER_ADMIN"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {profileData.user.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : profileData.user.role}
                        </span>
                      </p>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Clock className="w-4 h-4" />
                        Member Since
                      </Label>
                      <p className="mt-1 text-slate-900">
                        {new Date(
                          profileData.user.createdAt
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-900">
                  Security
                </h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label
                    htmlFor="current-password"
                    className="text-sm font-medium"
                  >
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="confirm-password"
                    className="text-sm font-medium"
                  >
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="mt-1"
                    required
                  />
                </div>

                {passwordMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      passwordMessage.type === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {passwordMessage.message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Permissions */}
            {profileData && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Permissions
                </h3>
                <div className="space-y-3">
                  {profileData.permissions.length > 0 ? (
                    profileData.permissions.map((perm) => (
                      <div key={perm.id} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {perm.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">
                      No specific permissions assigned. Using role-based access.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Account Status */}
            <div className="bg-green-50 rounded-lg border border-green-200 p-6">
              <h3 className="font-semibold text-green-900 mb-2">
                Account Status
              </h3>
              <p className="text-sm text-green-800">
                Your account is active and in good standing.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
