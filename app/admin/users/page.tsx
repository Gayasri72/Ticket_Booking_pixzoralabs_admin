"use client";

import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { useAdmin, usePermission } from "@/lib/auth-hooks";
import { handleSignOut } from "@/app/admin/actions";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  promotedAt?: string;
  permissions?: { id: string; name: string }[];
}

export default function UsersPage() {
  const { data: session } = useSession();
  const { user, isLoading, isSuperAdmin } = useAdmin();
  const { hasPermission } = usePermission("VIEW_USERS");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setUsersLoading(true);
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setUsersLoading(false);
      }
    }

    if (!isLoading) {
      fetchUsers();
    }
  }, [isLoading]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeleting(userId);
      const res = await fetch("/api/admin/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to delete user");
        return;
      }

      // Remove user from list
      setUsers(users.filter((u) => u.id !== userId));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  const handlePromoteUser = async (userId: string, userName: string) => {
    if (!confirm(`Promote ${userName} to ADMIN role?`)) {
      return;
    }

    try {
      setPromoting(userId);
      setError("");

      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to promote user");
        return;
      }

      // Update user in list
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: "ADMIN" } : u))
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote user");
    } finally {
      setPromoting(null);
    }
  };

  if (isLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!hasPermission && user?.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              You do not have permission to view users. Contact your super
              admin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userName={session?.user?.name || "Admin"}
        userRole={session?.user?.role || undefined}
        userEmail={session?.user?.email || undefined}
      />
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Users Management
            </h1>
            <p className="text-slate-600 mt-2">Total users: {users.length}</p>
          </div>
          <Button
            onClick={() => handleSignOut()}
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          >
            Sign Out
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View all registered users and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-slate-600 py-4">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t hover:bg-slate-50">
                        <td className="px-4 py-3">{u.name}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              u.role === "SUPER_ADMIN"
                                ? "bg-red-100 text-red-700"
                                : u.role === "ADMIN"
                                ? "bg-blue-100 text-blue-700"
                                : u.role === "EVENT_CREATOR"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              u.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              disabled={
                                u.role === "SUPER_ADMIN" ||
                                u.role === "ADMIN" ||
                                promoting === u.id
                              }
                              onClick={() =>
                                handlePromoteUser(u.id, u.name || u.email)
                              }
                            >
                              {promoting === u.id ? "Promoting..." : "Promote"}
                            </Button>
                            {isSuperAdmin && u.role !== "SUPER_ADMIN" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                                onClick={() =>
                                  handleDeleteUser(u.id, u.name || u.email)
                                }
                                disabled={deleting === u.id}
                              >
                                {deleting === u.id ? "Deleting..." : "Delete"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
