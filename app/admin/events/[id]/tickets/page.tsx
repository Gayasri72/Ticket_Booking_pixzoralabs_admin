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

interface Ticket {
  id: string;
  name: string;
  price: number;
  quantity: number;
  quantityBooked: number;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
}

export default function EventTicketsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/events/${eventId}/tickets`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();

      setEvent({ id: eventId, title: data.eventTitle || "Event" });
      setTickets(data.data || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.quantity) {
      setError("All fields are required");
      return;
    }

    try {
      setSubmitting(true);
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/events/${eventId}/tickets/${editingId}`
        : `/api/admin/events/${eventId}/tickets`;

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to save ticket");
        return;
      }

      await fetchData();
      setShowModal(false);
      setFormData({ name: "", price: "", quantity: "" });
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingId(ticket.id);
    setFormData({
      name: ticket.name,
      price: ticket.price.toString(),
      quantity: ticket.quantity.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket type?")) return;

    try {
      const res = await fetch(`/api/admin/events/${eventId}/tickets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to delete ticket");
        return;
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ticket");
    }
  };

  const columns = [
    {
      key: "name" as const,
      label: "Ticket Type",
    },
    {
      key: "price" as const,
      label: "Price",
      render: (value: unknown) => {
        if (typeof value === "number") {
          return `$${value.toFixed(2)}`;
        }
        return "-";
      },
    },
    {
      key: "quantity" as const,
      label: "Total Quantity",
      render: (value: unknown) => `${value || 0}`,
    },
    {
      key: "quantityBooked" as const,
      label: "Booked",
      render: (value: unknown) => {
        if (typeof value === "number") {
          return `${value}`;
        }
        return "0";
      },
    },
  ];

  const totalRevenue = tickets.reduce(
    (sum, ticket) => sum + ticket.price * ticket.quantityBooked,
    0
  );

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
            Back to Events
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {event?.title || "Loading..."} - Tickets
              </h1>
              <p className="text-slate-600 mt-2">
                Manage ticket types and pricing
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", price: "", quantity: "" });
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Ticket Type
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                ${totalRevenue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Booked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {tickets.reduce((sum, t) => sum + t.quantityBooked, 0)}
              </p>
            </CardContent>
          </Card>
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
            <CardTitle>Ticket Types</CardTitle>
            <CardDescription>Total: {tickets.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={tickets}
              isLoading={loading}
              actions={[
                {
                  label: "Edit",
                  onClick: (ticket) => handleEdit(ticket),
                  variant: "outline",
                },
                {
                  label: "Delete",
                  onClick: (ticket) => handleDelete(ticket.id),
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
        title={editingId ? "Edit Ticket Type" : "Create Ticket Type"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Ticket Type Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., VIP, General Admission, Student"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Total Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="100"
                required
              />
            </div>
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
