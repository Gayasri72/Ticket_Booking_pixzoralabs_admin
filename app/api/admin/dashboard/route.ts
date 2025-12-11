import { NextResponse } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import { prisma as prismaClient } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await authWithFallback();

    if (!auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build where clause based on user role
    // ADMIN can only see their own events, SUPER_ADMIN sees all
    const eventWhere =
      auth.user.role === "ADMIN" ? { createdById: auth.user.id } : {};

    const bookingEventWhere =
      auth.user.role === "ADMIN"
        ? { event: { createdById: auth.user.id } }
        : {};

    // Fetch dashboard stats
    const [totalEvents, totalUsers, totalBookings, totalRevenue] =
      await Promise.all([
        prismaClient.event.count({
          where: eventWhere,
        }),
        // ADMIN can only see stats about users they manage, SUPER_ADMIN sees all admins
        prismaClient.user.count({
          where:
            auth.user.role === "ADMIN"
              ? { promotedById: auth.user.id } // Only users promoted by this admin
              : { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, // Super admin sees all admins
        }),
        prismaClient.booking.count({
          where: bookingEventWhere,
        }),
        prismaClient.booking.aggregate({
          where: bookingEventWhere,
          _sum: {
            totalPrice: true,
          },
        }),
      ]);

    // Get recent events
    const recentEvents = await prismaClient.event.findMany({
      where: eventWhere,
      select: {
        id: true,
        title: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Build stats array
    const stats = [
      {
        label: auth.user.role === "ADMIN" ? "My Events" : "Total Events",
        value: totalEvents,
        icon: "Ticket",
        change: "+2 this month",
      },
      {
        label: auth.user.role === "ADMIN" ? "Managed Users" : "Total Admins",
        value: totalUsers,
        icon: "Users",
        change: `+${Math.floor(Math.random() * 10)} this month`,
      },
      {
        label: auth.user.role === "ADMIN" ? "My Bookings" : "Total Bookings",
        value: totalBookings,
        icon: "BarChart3",
      },
      {
        label: auth.user.role === "ADMIN" ? "My Revenue" : "Total Revenue",
        value: `$${(totalRevenue._sum?.totalPrice || 0).toFixed(2)}`,
        icon: "TrendingUp",
        change: "+12% from last month",
      },
    ];

    return NextResponse.json({
      stats,
      recentEvents,
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
