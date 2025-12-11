import { NextRequest } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import {
  success,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  checkPermission,
  handleCors,
} from "@/lib/api-utils";
import { updateTicketTypeSchema } from "@/lib/validators/event-validators";
import { z } from "zod";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * PUT /api/admin/events/[id]/tickets/[ticketId]
 * Update a ticket type
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  try {
    const { id, ticketId } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    const hasPermission = await checkPermission(session.user.id, "EDIT_EVENT");
    if (!hasPermission) {
      return forbidden("You do not have permission to update tickets");
    }

    const body = await req.json();

    // Validate input
    const validated = updateTicketTypeSchema.parse(body);

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

    // Verify ticket belongs to this event
    const ticket = await prisma.ticketType.findUnique({
      where: { id: ticketId },
      select: { eventId: true },
    });

    if (!ticket || ticket.eventId !== id) {
      return notFound("Ticket type not found");
    }

    // Update ticket type
    const updated = await prisma.ticketType.update({
      where: { id: ticketId },
      data: validated,
    });

    return success(updated, "Ticket type updated successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}

/**
 * DELETE /api/admin/events/[id]/tickets/[ticketId]
 * Delete a ticket type (if no bookings exist)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  try {
    const { id, ticketId } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    const hasPermission = await checkPermission(
      session.user.id,
      "DELETE_EVENT"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to delete tickets");
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

    // Verify ticket belongs to this event
    const ticket = await prisma.ticketType.findUnique({
      where: { id: ticketId },
      select: { eventId: true, quantityBooked: true },
    });

    if (!ticket || ticket.eventId !== id) {
      return notFound("Ticket type not found");
    }

    // Don't allow deletion if tickets have been booked
    if (ticket.quantityBooked > 0) {
      return badRequest("Cannot delete ticket type with existing bookings");
    }

    // Delete ticket type
    await prisma.ticketType.delete({
      where: { id: ticketId },
    });

    return success(null, "Ticket type deleted successfully");
  } catch (error) {
    return serverError(error);
  }
}
