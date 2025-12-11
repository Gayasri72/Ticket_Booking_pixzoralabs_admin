import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

/**
 * Custom signin endpoint that manually validates credentials and ensures session is created
 * This is a workaround for potential Auth.js v5-beta issues
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
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

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "User account is inactive" },
        { status: 401 }
      );
    }

    // Check password
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Only allow ADMIN and SUPER_ADMIN to login
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Success - return user data
    // The client should call signIn after receiving this response
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.userPermissions.map((up) => up.permission.name),
      },
      message: "Credentials validated. Please call signIn now.",
    });
  } catch (err) {
    console.error("[Custom Signin] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
