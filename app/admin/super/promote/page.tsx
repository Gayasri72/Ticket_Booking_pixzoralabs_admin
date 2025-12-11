"use client";

import { useSuperAdmin } from "@/lib/auth-hooks";
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
}

export default function PromoteUsersPage() {
  const { isLoading } = useSuperAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        // Filter for non-admin users
        const nonAdmins = (data.users || []).filter(
          (u: User) => u.role !== "ADMIN" && u.role !== "SUPER_ADMIN"
        );
        setUsers(nonAdmins);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (!isLoading) {
      fetchUsers();
    }
  }, [isLoading]);

  const handlePromote = async (userId: string) => {
    try {
      setPromoting(userId);
      setError("");
      setSuccess("");

      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to promote user");
      }

      setSuccess("User promoted successfully!");
      // Remove promoted user from list
      setUsers(users.filter((u) => u.id !== userId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote user");
    } finally {
      setPromoting(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Promote Users to Admin
          </h1>
          <p className="text-slate-600 mt-2">
            Promote EVENT_CREATOR or CUSTOMER users to ADMIN role
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-700">{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Users for Promotion</CardTitle>
            <CardDescription>
              Only non-admin users are shown here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-600">
                  No users available for promotion
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  All users are already admins or there are no users yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{user.name}</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                          {user.role}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            user.isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-xs text-slate-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handlePromote(user.id)}
                      disabled={promoting === user.id}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {promoting === user.id
                        ? "Promoting..."
                        : "Promote to Admin"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
