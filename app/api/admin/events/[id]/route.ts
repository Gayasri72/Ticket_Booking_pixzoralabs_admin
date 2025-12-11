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
import { updateEventSchema } from "@/lib/validators/event-validators";
import { z } from "zod";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * GET /api/admin/events/[id]
 * Get a single event with full details
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

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        profileImage: true,
        status: true,
        eventDate: true,
        eventTime: true,
        location: true,
        duration: true,
        categoryId: true,
        category: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
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
        createdAt: true,
        updatedAt: true,
        approvedAt: true,
      },
    });

    if (!event) {
      return notFound("Event not found");
    }

    return success(event, "Event retrieved successfully");
  } catch (error) {
    return serverError(error);
  }
}

/**
 * PUT /api/admin/events/[id]
 * Update an event
 */
export async function PUT(
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
      return forbidden("You do not have permission to edit events");
    }
    const body = await req.json();

    // Validate input
    const validated = updateEventSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return notFound("Event not found");
    }

    // Update event
    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...validated,
        updatedById: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        status: true,
        eventDate: true,
        eventTime: true,
        location: true,
        category: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        tickets: {
          select: { id: true, name: true, price: true, quantity: true },
        },
        updatedAt: true,
      },
    });

    return success(updated, "Event updated successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}

/**
 * DELETE /api/admin/events/[id]
 * Delete an event (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    const hasPermission = await checkPermission(
      session.user.id,
      "DELETE_EVENT"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to delete events");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return notFound("Event not found");
    }

    // Soft delete: set isActive to false
    await prisma.event.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return success(null, "Event deleted successfully");
  } catch (error) {
    return serverError(error);
  }
}
