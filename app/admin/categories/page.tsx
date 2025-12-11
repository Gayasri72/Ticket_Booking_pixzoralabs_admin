"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/modal";
import { DataTable } from "@/components/data-table";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.data || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setSubmitting(true);
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to save category");
        return;
      }

      await fetchCategories();
      setShowModal(false);
      setFormData({ name: "", description: "" });
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to delete category");
        return;
      }

      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    }
  };

  const columns = [
    {
      key: "name" as const,
      label: "Name",
    },
    {
      key: "description" as const,
      label: "Description",
      render: (value: unknown) => (
        <span className="text-slate-600 text-sm">
          {typeof value === "string" && value
            ? value.substring(0, 50) + (value.length > 50 ? "..." : "")
            : "-"}
        </span>
      ),
    },
    {
      key: "createdAt" as const,
      label: "Created",
      render: (value: unknown) => {
        if (typeof value === "string") {
          return new Date(value).toLocaleDateString();
        }
        return "-";
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userName={session?.user?.name || "Admin"}
        userRole={session?.user?.role || undefined}
        userEmail={session?.user?.email || undefined}
      />
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
            <p className="text-slate-600 mt-2">Manage event categories</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", description: "" });
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-700 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>Total: {categories.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={categories}
              isLoading={loading}
              actions={[
                {
                  label: "Manage",
                  onClick: (category) => {
                    router.push(
                      `/admin/categories/${category.id}/subcategories`
                    );
                  },
                  variant: "default",
                },
                {
                  label: "Edit",
                  onClick: (category) => handleEdit(category),
                  variant: "outline",
                },
                {
                  label: "Delete",
                  onClick: (category) => handleDelete(category.id),
                  variant: "destructive",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingId ? "Edit Category" : "Create Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Music, Sports, Comedy"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description"
              className="w-full h-24 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-950"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
