"use client";

import { useSuperAdmin, usePermission } from "@/lib/auth-hooks";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Admin {
  id: string;
  name: string;
  email: string;
  permissions: { id: string; name: string }[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

export default function RolesPage() {
  const { isLoading } = useSuperAdmin();
  const { hasPermission } = usePermission("MANAGE_PERMISSIONS");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [adminsRes, permsRes] = await Promise.all([
          fetch("/api/admin/admins"),
          fetch("/api/admin/permissions"),
        ]);

        if (!adminsRes.ok) throw new Error("Failed to fetch admins");
        if (!permsRes.ok) throw new Error("Failed to fetch permissions");

        const adminsData = await adminsRes.json();
        const permsData = await permsRes.json();

        setAdmins(adminsData.admins || []);
        setPermissions(permsData.permissions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (!isLoading) {
      fetchData();
    }
  }, [isLoading]);

  const handleTogglePermission = async (
    adminId: string,
    permissionId: string,
    hasPermission: boolean
  ) => {
    try {
      const method = hasPermission ? "DELETE" : "POST";
      const res = await fetch("/api/admin/assign-permission", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: adminId, permissionId }),
      });

      if (!res.ok) throw new Error("Failed to update permission");

      // Update local state
      setAdmins(
        admins.map((admin) => {
          if (admin.id === adminId) {
            return {
              ...admin,
              permissions: hasPermission
                ? admin.permissions.filter((p) => p.id !== permissionId)
                : [
                    ...admin.permissions,
                    permissions.find((p) => p.id === permissionId)!,
                  ],
            };
          }
          return admin;
        })
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update permission"
      );
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
            Roles & Permissions
          </h1>
          <p className="text-slate-600 mt-2">
            Manage admin roles and assign permissions
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Available Permissions</CardTitle>
              <CardDescription>All system permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {permissions.length === 0 ? (
                  <p className="text-slate-600 text-sm">
                    No permissions found.
                  </p>
                ) : (
                  permissions.map((perm) => (
                    <div key={perm.id} className="p-3 border rounded-lg">
                      <p className="font-semibold text-sm">{perm.name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {perm.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Permissions</CardTitle>
              <CardDescription>Assign permissions to admins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {admins.length === 0 ? (
                  <p className="text-slate-600 text-sm">No admins found.</p>
                ) : (
                  admins.map((admin) => (
                    <div
                      key={admin.id}
                      className={`p-3 border rounded-lg cursor-pointer transition ${
                        selectedAdmin === admin.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-slate-300"
                      }`}
                      onClick={() =>
                        setSelectedAdmin(
                          selectedAdmin === admin.id ? null : admin.id
                        )
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{admin.name}</p>
                          <p className="text-xs text-slate-600">
                            {admin.email}
                          </p>
                        </div>
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {admin.permissions.length}
                        </span>
                      </div>

                      {selectedAdmin === admin.id && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          {permissions.map((perm) => {
                            const hasPermission = admin.permissions.some(
                              (p) => p.id === perm.id
                            );
                            return (
                              <label
                                key={perm.id}
                                className="flex items-center text-sm cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={hasPermission}
                                  onChange={() =>
                                    handleTogglePermission(
                                      admin.id,
                                      perm.id,
                                      hasPermission
                                    )
                                  }
                                  className="mr-2"
                                />
                                <span
                                  className={
                                    hasPermission ? "font-semibold" : ""
                                  }
                                >
                                  {perm.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
