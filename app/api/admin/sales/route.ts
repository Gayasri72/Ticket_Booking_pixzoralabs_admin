import { NextRequest } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import {
  success,
  unauthorized,
  forbidden,
  serverError,
  checkPermission,
  handleCors,
} from "@/lib/api-utils";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * GET /api/admin/sales
 * Get sales and booking analytics
 * Query params: eventId, categoryId, dateFrom, dateTo, status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    // Check VIEW_ANALYTICS permission
    const hasPermission = await checkPermission(
      session.user.id,
      "VIEW_ANALYTICS"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to view analytics");
    }

    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // Build filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventWhere: Record<string, any> = {
      isActive: true,
    };

    if (queryParams.eventId) {
      eventWhere.id = queryParams.eventId;
    }

    if (queryParams.categoryId) {
      eventWhere.categoryId = queryParams.categoryId;
    }

    if (queryParams.dateFrom || queryParams.dateTo) {
      eventWhere.eventDate = {};
      if (queryParams.dateFrom) {
        eventWhere.eventDate.gte = new Date(queryParams.dateFrom);
      }
      if (queryParams.dateTo) {
        eventWhere.eventDate.lte = new Date(queryParams.dateTo);
      }
    }

    if (queryParams.status) {
      eventWhere.status = queryParams.status;
    }

    // Get events with their bookings
    const events = await prisma.event.findMany({
      where: eventWhere,
      select: {
        id: true,
        title: true,
        status: true,
        eventDate: true,
        category: {
          select: { name: true },
        },
        tickets: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            quantityBooked: true,
          },
        },
        bookings: {
          select: {
            id: true,
            quantity: true,
            totalPrice: true,
            bookingStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { eventDate: "desc" },
    });

    // Calculate analytics
    let totalRevenue = 0;
    let totalBookings = 0;
    let confirmedBookings = 0;
    let cancelledBookings = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventStats: any[] = [];

    for (const event of events) {
      let eventRevenue = 0;
      let eventBookings = 0;
      let eventConfirmed = 0;

      for (const booking of event.bookings) {
        totalBookings++;
        eventBookings++;

        if (booking.bookingStatus === "CONFIRMED") {
          confirmedBookings++;
          eventConfirmed++;
          totalRevenue += Number(booking.totalPrice);
          eventRevenue += Number(booking.totalPrice);
        }

        if (booking.bookingStatus === "CANCELLED") {
          cancelledBookings++;
        }
      }

      const ticketsAvailable = event.tickets.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, t: any) => sum + (t.quantity - t.quantityBooked),
        0
      );

      eventStats.push({
        eventId: event.id,
        eventTitle: event.title,
        category: event.category.name,
        eventDate: event.eventDate,
        status: event.status,
        totalBookings: eventBookings,
        confirmedBookings: eventConfirmed,
        revenue: eventRevenue,
        ticketsAvailable,
        ticketsSold: event.tickets.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, t: any) => sum + t.quantityBooked,
          0
        ),
      });
    }

    return success(
      {
        summary: {
          totalEvents: events.length,
          totalRevenue,
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          conversionRate:
            totalBookings > 0
              ? ((confirmedBookings / totalBookings) * 100).toFixed(2)
              : 0,
        },
        eventStats,
      },
      "Sales analytics retrieved successfully"
    );
  } catch (error) {
    return serverError(error);
  }
}
