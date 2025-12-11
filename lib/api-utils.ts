import { NextResponse } from "next/server";

interface ApiResponse<T = null> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: unknown;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

/**
 * Success response (200)
 */
export function success<T>(
  data: T,
  message: string = "Success",
  pagination?: {
    total: number;
    page: number;
    limit: number;
  }
) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    const pages = Math.ceil(pagination.total / pagination.limit);
    response.pagination = {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      pages,
      hasNext: pagination.page < pages,
      hasPrev: pagination.page > 1,
    };
  }

  return NextResponse.json(response, { status: 200 });
}

/**
 * Created response (201)
 */
export function created<T>(data: T, message: string = "Created successfully") {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse<T>,
    { status: 201 }
  );
}

/**
 * No content response (204)
 */
export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Bad request (400)
 */
export function badRequest(message: string, field?: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "BAD_REQUEST",
        message,
        field,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse,
    { status: 400 }
  );
}

/**
 * Validation error (400)
 */
export function validationError(
  errors: Array<{ path: string[]; message: string }>
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse,
    { status: 400 }
  );
}

/**
 * Unauthorized (401)
 */
export function unauthorized(message: string = "Unauthorized") {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse,
    { status: 401 }
  );
}

/**
 * Forbidden (403)
 */
export function forbidden(message: string = "Forbidden") {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "FORBIDDEN",
        message,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse,
    { status: 403 }
  );
}

/**
 * Not found (404)
 */
export function notFound(message: string = "Not found") {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse,
    { status: 404 }
  );
}

/**
 * Conflict (409)
 */
export function conflict(message: string = "Conflict") {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "CONFLICT",
        message,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse,
    { status: 409 }
  );
}

/**
 * Server error (500)
 */
export function serverError(
  error: unknown,
  message: string = "Internal server error"
) {
  console.error("Server error:", error);

  const details = process.env.NODE_ENV === "development" ? error : undefined;

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse,
    { status: 500 }
  );
}

/**
 * Helper to check if user has permission
 */
export async function checkPermission(userId: string, permissionName: string) {
  try {
    const { prisma } = await import("./prisma");

    // Check if user is SUPER_ADMIN - they have all permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === "SUPER_ADMIN") {
      return true;
    }

    // Check if user has the specific permission
    const userPermission = await prisma.userPermission.findFirst({
      where: {
        userId,
        permission: {
          name: permissionName,
        },
      },
    });

    return !!userPermission;
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

/**
 * Helper to check user role
 */
export async function checkRole(userId: string, roles: string | string[]) {
  try {
    const { prisma } = await import("./prisma");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  } catch (error) {
    console.error("Role check error:", error);
    return false;
  }
}

/**
 * CORS Headers for cross-origin requests
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handle CORS preflight requests
 */
export function handleCors() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
