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
import { updateSubCategorySchema } from "@/lib/validators/event-validators";
import { z } from "zod";
import { prisma as prismaClient } from "@/lib/prisma";

// Handle CORS
export async function OPTIONS() {
  return handleCors();
}

/**
 * GET /api/admin/categories/[id]/subcategories/[subId]
 * Get a single subcategory
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const { id: categoryId, subId } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    const subCategory = await prismaClient.subCategory.findUnique({
      where: { id: subId },
    });

    if (!subCategory || subCategory.categoryId !== categoryId) {
      return notFound("SubCategory not found");
    }

    return success(subCategory, "SubCategory retrieved successfully");
  } catch (error) {
    return serverError(error);
  }
}

/**
 * PUT /api/admin/categories/[id]/subcategories/[subId]
 * Update a subcategory
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const { id: categoryId, subId } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    const hasPermission = await checkPermission(
      session.user.id,
      "MANAGE_CATEGORIES"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to update subcategories");
    }
    const body = await req.json();

    // Validate input
    const validated = updateSubCategorySchema.parse(body);

    // Check if subcategory exists and belongs to this category
    const subCategory = await prismaClient.subCategory.findUnique({
      where: { id: subId },
    });

    if (!subCategory || subCategory.categoryId !== categoryId) {
      return notFound("SubCategory not found");
    }

    // Check if new name already exists in this category
    if (validated.name && validated.name !== subCategory.name) {
      const existing = await prismaClient.subCategory.findFirst({
        where: {
          categoryId,
          name: validated.name,
        },
      });
      if (existing) {
        return badRequest(
          `SubCategory name '${validated.name}' already exists in this category`
        );
      }
    }

    // Update subcategory
    const updated = await prismaClient.subCategory.update({
      where: { id: subId },
      data: {
        ...validated,
        updatedById: session.user.id,
      },
    });

    return success(updated, "SubCategory updated successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || "Validation failed";
      return badRequest(message);
    }
    return serverError(error);
  }
}

/**
 * DELETE /api/admin/categories/[id]/subcategories/[subId]
 * Delete a subcategory
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const { id: categoryId, subId } = await params;
    const session = await authWithFallback();

    if (!session?.user?.id) {
      return unauthorized("You must be logged in");
    }

    const hasPermission = await checkPermission(
      session.user.id,
      "MANAGE_CATEGORIES"
    );
    if (!hasPermission) {
      return forbidden("You do not have permission to delete subcategories");
    }

    // Check if subcategory exists and belongs to this category
    const subCategory = await prismaClient.subCategory.findUnique({
      where: { id: subId },
    });

    if (!subCategory || subCategory.categoryId !== categoryId) {
      return notFound("SubCategory not found");
    }

    // Delete subcategory
    await prismaClient.subCategory.delete({
      where: { id: subId },
    });

    return success(null, "SubCategory deleted successfully");
  } catch (error) {
    return serverError(error);
  }
}
