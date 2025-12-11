import { NextRequest, NextResponse } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
}

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
    const sessionUser = session?.user as AuthUser | undefined;
    if (!session || sessionUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { userId, permissionId } = await req.json();

    if (!userId || !permissionId) {
      return NextResponse.json(
        { error: "User ID and permission ID are required" },
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

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "User must be an admin to assign permissions" },
        { status: 400, headers: corsHeaders }
      );
    }

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if permission already assigned
    const existing = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Permission already assigned" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Assign permission
    await prisma.userPermission.create({
      data: {
        userId,
        permissionId: permission.id,
        assignedBy: sessionUser?.id || "",
      },
    });

    return NextResponse.json(
      {
        message: "Permission assigned successfully",
        userId,
        permission: permission.name,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign permission" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await authWithFallback();

    // Check if user is SUPER_ADMIN
    const sessionUser = session?.user as AuthUser | undefined;
    if (!session || sessionUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { userId, permissionId } = await req.json();

    if (!userId || !permissionId) {
      return NextResponse.json(
        { error: "User ID and permission ID are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Revoke permission
    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Permission revoked successfully",
        userId,
        permission: permission.name,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Revoke error:", error);
    return NextResponse.json(
      { error: "Failed to revoke permission" },
      { status: 500 }
    );
  }
}
