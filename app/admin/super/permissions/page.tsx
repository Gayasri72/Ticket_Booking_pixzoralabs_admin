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

interface Permission {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function PermissionsPage() {
  const { isLoading } = useSuperAdmin();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newPermName, setNewPermName] = useState("");
  const [newPermDesc, setNewPermDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/permissions");
        if (!res.ok) throw new Error("Failed to fetch permissions");
        const data = await res.json();
        setPermissions(data.permissions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (!isLoading) {
      fetchPermissions();
    }
  }, [isLoading]);

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPermName.trim() || !newPermDesc.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPermName.toUpperCase().replace(/\s+/g, "_"),
          description: newPermDesc,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create permission");
      }

      const newPerm = await res.json();
      setPermissions([...permissions, newPerm.permission]);
      setNewPermName("");
      setNewPermDesc("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create permission"
      );
    } finally {
      setCreating(false);
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Manage Permissions
          </h1>
          <p className="text-slate-600 mt-2">
            Create and manage system permissions for admins
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Permission</CardTitle>
              <CardDescription>
                Add a new permission to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePermission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Permission Name
                  </label>
                  <input
                    type="text"
                    value={newPermName}
                    onChange={(e) => setNewPermName(e.target.value)}
                    placeholder="e.g., Delete Users"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={creating}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Converted to uppercase with underscores
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newPermDesc}
                    onChange={(e) => setNewPermDesc(e.target.value)}
                    placeholder="e.g., Allow deleting user accounts"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    disabled={creating}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? "Creating..." : "Create Permission"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Permissions List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>All Permissions</CardTitle>
              <CardDescription>
                System permissions ({permissions.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-600">No permissions found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="p-4 border rounded-lg hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{perm.name}</h3>
                          <p className="text-xs text-slate-600 mt-1">
                            {perm.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            Created{" "}
                            {new Date(perm.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded ml-2">
                          {perm.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
