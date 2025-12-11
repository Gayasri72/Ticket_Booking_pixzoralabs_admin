import { NextRequest } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import {
  success,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
  checkPermission,
  handleCors,
} from "@/lib/api-utils";
import { bulkDeleteEventsSchema } from "@/lib/validators/event-validators";
import { z } from "zod";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * POST /api/admin/events/bulk-delete
 * Bulk delete multiple events (soft delete by marking inactive)
 */
export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();

    // Validate input
    const validated = bulkDeleteEventsSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // Update all events to inactive
    const result = await prisma.event.updateMany({
      where: {
        id: {
          in: validated.eventIds,
        },
      },
      data: {
        isActive: false,
      },
    });

    return success(
      { deletedCount: result.count },
      `${result.count} event(s) deleted successfully`
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}
