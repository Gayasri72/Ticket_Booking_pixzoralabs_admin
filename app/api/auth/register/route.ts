import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
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
    const { email, password, name, requestedPermissions } = await req.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409, headers: corsHeaders }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user as ADMIN with pending permissions
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    // Store permission requests if any
    if (
      requestedPermissions &&
      Array.isArray(requestedPermissions) &&
      requestedPermissions.length > 0
    ) {
      // Permission requests will be stored and displayed in the admin dashboard
      // Super admin can review and approve specific permissions
    }

    return NextResponse.json(
      {
        message:
          "User registered successfully. Your account is pending super admin approval.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          requestedPermissions: requestedPermissions || [],
        },
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500, headers: corsHeaders }
    );
  }
}
