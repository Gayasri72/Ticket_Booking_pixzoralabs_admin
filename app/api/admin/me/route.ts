import { NextRequest, NextResponse } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import { prisma as prismaClient } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await authWithFallback();

    if (!auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prismaClient.user.findUnique({
      where: { id: auth.user.id },
      include: {
        userPermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      permissions: user.userPermissions.map((up: any) => ({
        id: up.permission.id,
        name: up.permission.name,
        description: up.permission.description,
      })),
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
