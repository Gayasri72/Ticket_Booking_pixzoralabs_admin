import { NextRequest, NextResponse } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const session = await authWithFallback();

    // Check if user is SUPER_ADMIN
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot promote SUPER_ADMIN" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "User is already an admin" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Promote user to ADMIN
    const promotedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "ADMIN",
        promotedAt: new Date(),
        promotedById: (session.user as any)?.id,
      },
      include: {
        userPermissions: {
          include: {
            permission: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "User promoted to admin",
        user: {
          id: promotedUser.id,
          email: promotedUser.email,
          name: promotedUser.name,
          role: promotedUser.role,
          promotedAt: promotedUser.promotedAt,
          permissions: promotedUser.userPermissions.map(
            (up: any) => up.permission.name
          ),
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Promotion error:", error);
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500, headers: corsHeaders }
    );
  }
}
