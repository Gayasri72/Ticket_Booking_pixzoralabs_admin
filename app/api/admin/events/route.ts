import { NextRequest } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import {
  success,
  created,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
  checkPermission,
  handleCors,
} from "@/lib/api-utils";
import { createEventSchema } from "@/lib/validators/event-validators";
import { z } from "zod";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * GET /api/admin/events
 * List all events with pagination, filtering, and search
 */
export async function GET(req: NextRequest) {
  try {
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    // Parse query parameters
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());

    // For now, use basic pagination
    const page = Math.max(1, parseInt(queryParams.page as string) || 1);
    const limit = Math.min(100, parseInt(queryParams.limit as string) || 10);
    const skip = (page - 1) * limit;

    // Use prismaClient typed correctly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    // ADMIN can only see their own events, SUPER_ADMIN sees all
    if (session.user.role === "ADMIN") {
      where.createdById = session.user.id;
    }

    if (queryParams.search) {
      where.OR = [
        { title: { contains: queryParams.search, mode: "insensitive" } },
        {
          description: {
            contains: queryParams.description,
            mode: "insensitive",
          },
        },
      ];
    }

    if (queryParams.status) {
      where.status = queryParams.status;
    }

    if (queryParams.categoryId) {
      where.categoryId = queryParams.categoryId;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
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
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              quantityBooked: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.event.count({ where }),
    ]);

    return success(events, "Events retrieved successfully", {
      total,
      page,
      limit,
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * POST /api/admin/events
 * Create a new event (Step 1: Basic details)
 * Updated: eventDate is now optional
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(
      "[API] POST /api/admin/events - Body:",
      JSON.stringify(body, null, 2)
    );

    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      "CREATE_EVENT"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to create events");
    }

    // Validate input
    console.log("[API] Validating event schema...");
    const validated = createEventSchema.parse(body);
    console.log(
      "[API] Validation passed, validated data:",
      JSON.stringify(validated, null, 2)
    );

    // Use prismaClient typed correctly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = prismaClient as any;

    // Verify category exists (only if provided)
    if (validated.categoryId && validated.categoryId !== "") {
      const category = await prisma.category.findUnique({
        where: { id: validated.categoryId },
      });

      if (!category) {
        return badRequest("Category not found");
      }
    } else {
      return badRequest("Category is required to create an event");
    }

    // Prepare data for creation - handle empty values
    const eventData = {
      title: validated.title,
      description: validated.description,
      coverImage:
        validated.coverImage ||
        "https://via.placeholder.com/800x400?text=Event+Cover",
      profileImage: validated.profileImage || null,
      categoryId: validated.categoryId,
      location: validated.location,
      eventDate: validated.eventDate
        ? new Date(validated.eventDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
      eventTime: validated.eventTime || "18:00",
      duration: validated.duration || null,
      status: "DRAFT",
      createdById: session.user.id,
    };

    // Create event
    const event = await prisma.event.create({
      data: eventData,
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
        createdAt: true,
      },
    });

    return created(event, "Event created successfully. Add ticket types next.");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      console.error("[API] Validation errors:", issues);
      return badRequest(`Validation failed: ${issues}`);
    }
    return serverError(error);
  }
}
