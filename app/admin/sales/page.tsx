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
import { DataTable } from "@/components/data-table";
import { DollarSign, Users, ShoppingCart, TrendingUp } from "lucide-react";

interface SalesData {
  totalRevenue: number;
  totalBookings: number;
  totalEvents: number;
  confirmedBookings: number;
  cancelledBookings: number;
  conversionRate: string | number;
}

interface EventStat {
  eventId: string;
  eventTitle: string;
  category: string;
  eventDate: string;
  status: string;
  totalBookings: number;
  confirmedBookings: number;
  revenue: number;
  ticketsAvailable: number;
  ticketsSold: number;
}

export default function SalesPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<SalesData | null>(null);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/sales", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch sales data");
      const response = await res.json();
      setSummary(response.data.summary);
      setEventStats(response.data.eventStats);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading analytics...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">No data available</p>
      </div>
    );
  }

  const columns = [
    {
      key: "eventTitle" as const,
      label: "Event",
    },
    {
      key: "bookingCount" as const,
      label: "Bookings",
      render: (value: unknown) => `${value || 0}`,
    },
    {
      key: "totalRevenue" as const,
      label: "Revenue",
      render: (value: unknown) => {
        if (typeof value === "number") {
          return `$${value.toFixed(2)}`;
        }
        return "-";
      },
    },
  ];

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${summary.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Bookings",
      value: summary.totalBookings,
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Active Events",
      value: summary.totalEvents,
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Conversion Rate",
      value: `${summary.conversionRate}%`,
      icon: Users,
      color: "text-orange-600",
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Sales & Analytics
          </h1>
          <p className="text-slate-600 mt-2">Track bookings and revenue</p>
        </div>

        {/* Error */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-700 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      {card.title}
                    </CardTitle>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Booking Status */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Breakdown</CardTitle>
            <CardDescription>
              Distribution of bookings by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  status: "CONFIRMED",
                  label: "Confirmed",
                  count: summary.confirmedBookings,
                },
                {
                  status: "CANCELLED",
                  label: "Cancelled",
                  count: summary.cancelledBookings,
                },
              ].map(({ status, label, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          status === "CONFIRMED" ? "bg-green-500" : "bg-red-500"
                        }`}
                        style={{
                          width: `${
                            summary.totalBookings > 0
                              ? ((count / summary.totalBookings) * 100).toFixed(
                                  0
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle>Top Events by Revenue</CardTitle>
            <CardDescription>Your best performing events</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={eventStats.map((event) => ({
                ...event,
                id: event.eventId,
                eventTitle: event.eventTitle,
                bookingCount: event.totalBookings,
                totalRevenue: event.revenue,
              }))}
              actions={[
                {
                  label: "View Details",
                  onClick: () => {},
                  variant: "outline",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
