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

interface Event {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  createdAt: string;
}

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [subcategories, setSubcategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
    profileImage: "",
    categoryId: "",
    location: "",
    eventDate: "",
    eventTime: "",
    subCategoryIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const res = await fetch(
        `/api/admin/categories/${categoryId}/subcategories`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch subcategories");
      const data = await res.json();
      setSubcategories(data.data || []);
    } catch (err) {
      console.error("Failed to load subcategories:", err);
      setSubcategories([]);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/events", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data.data || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Event title is required");
      return;
    }

    try {
      setSubmitting(true);
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/events/${editingId}`
        : "/api/admin/events";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("API Error:", data);
        let errorMessage = "Failed to save event";
        if (typeof data.error === "object" && data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.message) {
          errorMessage = data.message;
        }
        setError(errorMessage);
        return;
      }

      await fetchEvents();
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        coverImage: "",
        profileImage: "",
        categoryId: "",
        location: "",
        eventDate: "",
        eventTime: "",
        subCategoryIds: [],
      });
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    // Convert eventDate DateTime to YYYY-MM-DD format for date input
    const dateStr = event.startDate ? event.startDate.split("T")[0] : "";
    setFormData({
      title: event.title,
      description: event.description,
      coverImage: "",
      profileImage: "",
      categoryId: "",
      location: event.location || "",
      eventDate: dateStr,
      eventTime: event.endDate || "",
      subCategoryIds: [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to delete event");
        return;
      }

      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const handleManageTickets = (eventId: string) => {
    router.push(`/admin/events/${eventId}/tickets`);
  };

  const columns = [
    {
      key: "title" as const,
      label: "Title",
    },
    {
      key: "location" as const,
      label: "Location",
      render: (value: unknown) => (
        <span className="text-slate-600 text-sm">
          {typeof value === "string" && value ? value : "-"}
        </span>
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      render: (value: unknown) => {
        const statusColor: Record<string, string> = {
          DRAFT: "bg-slate-100 text-slate-800",
          PENDING: "bg-yellow-100 text-yellow-800",
          APPROVED: "bg-green-100 text-green-800",
          COMPLETED: "bg-blue-100 text-blue-800",
          CANCELLED: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              statusColor[value as string] || "bg-slate-100 text-slate-800"
            }`}
          >
            {value as string}
          </span>
        );
      },
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
            <h1 className="text-3xl font-bold text-slate-900">Events</h1>
            <p className="text-slate-600 mt-2">Manage all events</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({
                title: "",
                description: "",
                coverImage: "",
                profileImage: "",
                categoryId: "",
                location: "",
                eventDate: "",
                eventTime: "",
                subCategoryIds: [],
              });
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
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
            <CardTitle>All Events</CardTitle>
            <CardDescription>Total: {events.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={events}
              isLoading={loading}
              actions={[
                {
                  label: "Tickets",
                  onClick: (event) => handleManageTickets(event.id),
                  variant: "default",
                },
                {
                  label: "Edit",
                  onClick: (event) => handleEdit(event),
                  variant: "outline",
                },
                {
                  label: "Delete",
                  onClick: (event) => handleDelete(event.id),
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
        title={editingId ? "Edit Event" : "Create Event"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Summer Music Festival 2025"
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
              placeholder="Event details..."
              className="w-full h-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => {
                  const categoryId = e.target.value;
                  setFormData({ ...formData, categoryId });
                  if (categoryId) {
                    fetchSubcategories(categoryId);
                  } else {
                    setSubcategories([]);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-950"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
              <Input
                id="coverImage"
                type="url"
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {subcategories.length > 0 && (
            <div>
              <Label htmlFor="subCategoryIds">Sub-Categories (Optional)</Label>
              <div className="space-y-2 p-3 border border-slate-300 rounded-md bg-slate-50">
                {subcategories.map((subcat) => (
                  <label
                    key={subcat.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.subCategoryIds.includes(subcat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            subCategoryIds: [
                              ...formData.subCategoryIds,
                              subcat.id,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            subCategoryIds: formData.subCategoryIds.filter(
                              (id) => id !== subcat.id
                            ),
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{subcat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Venue address"
                required
              />
            </div>

            <div>
              <Label htmlFor="eventDate">Event Date (Optional)</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) =>
                  setFormData({ ...formData, eventDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="eventTime">Event Time (Optional)</Label>
            <Input
              id="eventTime"
              type="time"
              value={formData.eventTime}
              onChange={(e) =>
                setFormData({ ...formData, eventTime: e.target.value })
              }
              placeholder="HH:MM"
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
