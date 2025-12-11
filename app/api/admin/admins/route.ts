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

    // Check if user is super admin
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only super admins can view admins" },
        { status: 403 }
      );
    }

    // Fetch all admins with their permissions
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        userPermissions: {
          select: {
            permission: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform permissions array
    const transformedAdmins = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      permissions: admin.userPermissions.map((up: any) => up.permission),
    }));

    return NextResponse.json({
      success: true,
      admins: transformedAdmins,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
