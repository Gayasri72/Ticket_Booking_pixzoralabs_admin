import { NextRequest, NextResponse } from "next/server";
import { authWithFallback } from "@/lib/auth-utils";
import { prisma as prismaClient } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const auth = await authWithFallback();

    if (!auth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error: {
            message: "Current password and new password are required",
            code: "MISSING_FIELDS",
          },
        },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await prismaClient.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          error: {
            message: "User not found or password not set",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: {
            message: "Current password is incorrect",
            code: "INVALID_PASSWORD",
          },
        },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prismaClient.user.update({
      where: { id: auth.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
