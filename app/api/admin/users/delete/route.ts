import { authWithFallback } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const session = await authWithFallback();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Check if user is super admin
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only super admins can delete users" },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent deleting self
    if (userId === user.id) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Prevent deleting other super admins
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Cannot delete another super admin" },
        { status: 403 }
      );
    }

    // Delete user's permissions first
    await prisma.userPermission.deleteMany({
      where: { userId },
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
