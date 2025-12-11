"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const availablePermissions = [
    {
      id: "create_events",
      label: "Create Events",
      description: "Can create and manage events",
    },
    {
      id: "manage_users",
      label: "Manage Users",
      description: "Can view and manage user accounts",
    },
    {
      id: "manage_categories",
      label: "Manage Categories",
      description: "Can create and edit categories",
    },
    {
      id: "view_sales",
      label: "View Sales Reports",
      description: "Can view sales and revenue data",
    },
    {
      id: "manage_permissions",
      label: "Manage Permissions",
      description: "Can assign permissions to other admins",
    },
    {
      id: "view_analytics",
      label: "View Analytics",
      description: "Can access analytics dashboard",
    },
  ];

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = "Password must contain at least one number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          requestedPermissions: selectedPermissions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      setSuccess(true);
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Join as an Event Creator and start booking venues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 font-semibold text-center">
                  ✓ Account created successfully!
                </p>
                <p className="text-green-600 text-sm text-center mt-2">
                  Redirecting to login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    validationErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300"
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    validationErrors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300"
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    validationErrors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300"
                  }`}
                />
                {validationErrors.password && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.password}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  • At least 8 characters
                  <br />
                  • One uppercase letter
                  <br />
                  • One lowercase letter
                  <br />• One number
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    validationErrors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300"
                  }`}
                />
                {validationErrors.confirmPassword && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Permissions Selection */}
              <div className="space-y-3 border-t pt-4">
                <label className="block text-sm font-medium text-slate-700">
                  Requested Permissions
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Select the permissions you would like to request. A super
                  admin will review and approve your request.
                </p>
                <div className="space-y-2">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {permission.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {permission.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?{" "}
              <Link
                href="/admin/signin"
                className="text-blue-600 hover:underline font-semibold"
              >
                Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
