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
import {
  createSubCategorySchema,
  categoryFilterSchema,
} from "@/lib/validators/event-validators";
import { z } from "zod";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * GET /api/admin/categories/[id]/subcategories
 * List subcategories for a specific category
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    // Verify category exists
    const category = await prismaClient.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return notFound("Category not found");
    }

    // Parse query parameters
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = categoryFilterSchema.parse(queryParams);
    const skip = (filters.page - 1) * filters.limit;

    // Fetch subcategories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      categoryId,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [subCategories, total] = await Promise.all([
      prismaClient.subCategory.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
      }),
      prismaClient.subCategory.count({ where }),
    ]);

    return success(subCategories, "SubCategories retrieved successfully", {
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
 * POST /api/admin/categories/[id]/subcategories
 * Create a new subcategory in a category
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    const hasPermission = await checkPermission(
      session.user.id,
      "MANAGE_CATEGORIES"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to create subcategories");
    }

    // Verify category exists
    const category = await prismaClient.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return notFound("Category not found");
    }

    const body = await req.json();
    const validated = createSubCategorySchema.parse(body);

    // Check if subcategory already exists in this category
    const existing = await prismaClient.subCategory.findFirst({
      where: {
        categoryId,
        name: validated.name,
      },
    });

    if (existing) {
      return badRequest(
        `SubCategory '${validated.name}' already exists in this category`
      );
    }

    // Create subcategory
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subCategory = await (prismaClient.subCategory as any).create({
      data: {
        name: validated.name,
        description: validated.description,
        categoryId,
        createdById: session.user.id,
      },
    });

    return created(subCategory, "SubCategory created successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}
