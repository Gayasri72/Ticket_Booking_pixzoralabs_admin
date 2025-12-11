"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Plus, ArrowLeft } from "lucide-react";

interface SubCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function SubCategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (categoryId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/categories/${categoryId}/subcategories`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch subcategories");
      const data = await res.json();

      setCategory({ id: categoryId, name: data.categoryName || "Category" });
      setSubCategories(data.data || []);
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
      setError("SubCategory name is required");
      return;
    }

    try {
      setSubmitting(true);
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/categories/${categoryId}/subcategories/${editingId}`
        : `/api/admin/categories/${categoryId}/subcategories`;

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to save subcategory");
        return;
      }

      await fetchData();
      setShowModal(false);
      setFormData({ name: "", description: "" });
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save subcategory"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subCat: SubCategory) => {
    setEditingId(subCat.id);
    setFormData({
      name: subCat.name,
      description: subCat.description,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;

    try {
      const res = await fetch(
        `/api/admin/categories/${categoryId}/subcategories/${id}`,
        { method: "DELETE", credentials: "include" }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to delete subcategory");
        return;
      }

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete subcategory"
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Categories
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {category?.name || "Loading..."} - SubCategories
              </h1>
              <p className="text-slate-600 mt-2">
                Manage subcategories for this category
              </p>
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
              New SubCategory
            </Button>
          </div>
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
            <CardTitle>All SubCategories</CardTitle>
            <CardDescription>Total: {subCategories.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={subCategories}
              isLoading={loading}
              actions={[
                {
                  label: "Edit",
                  onClick: (subCat) => handleEdit(subCat),
                  variant: "outline",
                },
                {
                  label: "Delete",
                  onClick: (subCat) => handleDelete(subCat.id),
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
        title={editingId ? "Edit SubCategory" : "Create SubCategory"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">SubCategory Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Rock, Classical, Jazz"
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
