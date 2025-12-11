import { authWithFallback } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await authWithFallback();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;

    // Check if user is admin (has admin role)
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only admins can view users" },
        { status: 403 }
      );
    }

    // Build where clause based on user role
    // ADMIN can only see users they promoted, SUPER_ADMIN sees all admins
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any =
      user.role === "ADMIN"
        ? { promotedById: user.id }
        : { role: { in: ["ADMIN", "SUPER_ADMIN"] } };

    // Fetch users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        promotedAt: true,
        promotedById: true,
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
        createdAt: "desc",
      },
    });

    // Transform permissions array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedUsers = users.map((user: any) => ({
      ...user,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permissions: user.userPermissions.map((up: any) => up.permission),
      userPermissions: undefined,
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
