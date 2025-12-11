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
import { changeEventStatusSchema } from "@/lib/validators/event-validators";
import { z } from "zod";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * PATCH /api/admin/events/[id]/status
 * Change event status (PENDING, APPROVED, HOLD, CANCELLED, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    // Super admins can change event status
    const hasPermission = await checkPermission(
      session.user.id,
      "VIEW_ANALYTICS"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to change event status");
    }
    const body = await req.json();

    // Validate input
    const validated = changeEventStatusSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!event) {
      return notFound("Event not found");
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["PENDING", "CANCELLED"],
      PENDING: ["APPROVED", "HOLD", "CANCELLED"],
      APPROVED: ["HOLD", "CANCELLED", "COMPLETED"],
      HOLD: ["APPROVED", "CANCELLED"],
      CANCELLED: [],
      COMPLETED: ["ARCHIVED"],
      ARCHIVED: [],
    };

    const allowedNextStatuses = validTransitions[event.status] || [];
    if (!allowedNextStatuses.includes(validated.status)) {
      return badRequest(
        `Cannot transition from ${event.status} to ${validated.status}`
      );
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: validated.status,
    };

    // If approving, set approvedAt and approvedById
    if (validated.status === "APPROVED") {
      updateData.approvedAt = new Date();
      updateData.approvedById = session.user.id;
    }

    // Update event status
    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        approvedAt: true,
        approvedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return success(updated, `Event status changed to ${validated.status}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}
