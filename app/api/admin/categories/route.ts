import { NextRequest } from "next/server";
import { getSessionForAPI } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  success,
  created,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  serverError,
  checkPermission,
  handleCors,
} from "@/lib/api-utils";
import {
  createCategorySchema,
  categoryFilterSchema,
} from "@/lib/validators/event-validators";
import { z } from "zod";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * GET /api/admin/categories
 * List all categories with pagination and filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Get session with automatic fallback
    const session = await getSessionForAPI();

    // Check if user is logged in
    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    // Parse query parameters
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());

    // Validate filters
    const filters = categoryFilterSchema.parse(queryParams);
    const skip = (filters.page - 1) * filters.limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Fetch categories and total count
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: filters.limit,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          subCategories: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.count({ where }),
    ]);

    return success(categories, "Categories retrieved successfully", {
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest("Invalid filter parameters");
    }
    return serverError(error);
  }
}

/**
 * POST /api/admin/categories
 * Create a new category
 */
export async function POST(req: NextRequest) {
  try {
    // Get session with automatic fallback
    const session = await getSessionForAPI();

    // Check authentication
    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      "MANAGE_CATEGORIES"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to create categories");
    }

    const body = await req.json();

    // Validate input
    const validated = createCategorySchema.parse(body);

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: validated.name },
    });

    if (existingCategory) {
      return conflict(`Category '${validated.name}' already exists`);
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        ...validated,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        subCategories: {
          select: { id: true, name: true },
        },
      },
    });

    return created(category, "Category created successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}
