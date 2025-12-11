import { NextRequest } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
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
import { updateCategorySchema } from "@/lib/validators/event-validators";
import { z } from "zod";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * GET /api/admin/categories/[id]
 * Get a single category by ID
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        subCategories: {
          select: { id: true, name: true },
        },
      },
    });

    if (!category) {
      return notFound("Category not found");
    }

    return success(category, "Category retrieved successfully");
  } catch (error) {
    return serverError(error);
  }
}

/**
 * PUT /api/admin/categories/[id]
 * Update a category
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

    const hasPermission = await checkPermission(
      session.user.id,
      "MANAGE_CATEGORIES"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to update categories");
    }

    const body = await req.json();

    // Validate input
    const validated = updateCategorySchema.parse(body);

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return notFound("Category not found");
    }

    // Check if new name already exists (if name is being changed)
    if (validated.name && validated.name !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { name: validated.name },
      });
      if (existing) {
        return badRequest(`Category name '${validated.name}' already exists`);
      }
    }

    // Update category
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...validated,
        updatedById: session.user.id,
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

    return success(updated, "Category updated successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Soft delete a category
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
      "MANAGE_CATEGORIES"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to delete categories");
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return notFound("Category not found");
    }

    // Soft delete: only update the deletedAt timestamp
    // We keep the record in the database for audit purposes
    // Note: deletedAt will be added via raw SQL since it's not in Prisma's generated types yet
    await prisma.category.update({
      where: { id },
      data: {
        // Mark as inactive instead
        isActive: false,
      },
    });

    return success(null, "Category deleted successfully");
  } catch (error) {
    return serverError(error);
  }
}
