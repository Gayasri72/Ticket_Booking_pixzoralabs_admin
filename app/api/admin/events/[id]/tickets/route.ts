import { NextRequest } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import {
  success,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  checkPermission,
  handleCors,
} from "@/lib/api-utils";
import { createTicketTypeSchema } from "@/lib/validators/event-validators";
import { z } from "zod";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * GET /api/admin/events/[id]/tickets
 * Get all ticket types for an event
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!event) {
      return notFound("Event not found");
    }

    // Get all ticket types for the event
    const tickets = await prisma.ticketType.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "desc" },
    });

    return success(tickets, "Ticket types retrieved successfully");
  } catch (error) {
    return serverError(error);
  }
}

/**
 * POST /api/admin/events/[id]/tickets
 * Add a new ticket type to an event
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    const hasPermission = await checkPermission(session.user.id, "EDIT_EVENT");
    if (!hasPermission) {
      return forbidden("You do not have permission to add tickets");
    }

    const body = await req.json();

    // Validate input
    const validated = createTicketTypeSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!event) {
      return notFound("Event not found");
    }

    // Check if ticket type with same name already exists for this event
    const existing = await prisma.ticketType.findFirst({
      where: {
        eventId: id,
        name: validated.name,
      },
    });

    if (existing) {
      return badRequest(
        "Ticket type with this name already exists for this event"
      );
    }

    // Create ticket type
    const ticket = await prisma.ticketType.create({
      data: {
        ...validated,
        eventId: id,
        quantityBooked: 0, // Initially no tickets booked
      },
    });

    return created(ticket, "Ticket type created successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}
