import { authWithFallback } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await authWithFallback();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Check if user is admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only admins can view permissions" },
        { status: 403 }
      );
    }

    // Fetch all permissions
    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await authWithFallback();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Check if user is super admin
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only super admins can create permissions" },
        { status: 403 }
      );
    }

    const { name, description } = await request.json();

    // Validate input
    if (!name || !description) {
      return NextResponse.json(
        { message: "Name and description are required" },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existing = await prisma.permission.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Permission already exists" },
        { status: 409 }
      );
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      permission,
    });
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
