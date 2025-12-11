import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcrypt";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Create default permissions
    const permissions = [
      {
        name: "CREATE_EVENT",
        description: "Can create new events",
      },
      {
        name: "EDIT_EVENT",
        description: "Can edit existing events",
      },
      {
        name: "DELETE_EVENT",
        description: "Can delete events",
      },
      {
        name: "VIEW_USERS",
        description: "Can view all users",
      },
      {
        name: "MANAGE_ADMINS",
        description: "Can promote/demote admins",
      },
      {
        name: "MANAGE_PERMISSIONS",
        description: "Can assign/revoke permissions",
      },
      {
        name: "MANAGE_CATEGORIES",
        description: "Can create, edit, delete categories and subcategories",
      },
      {
        name: "VIEW_ANALYTICS",
        description: "Can view analytics and sales reports",
      },
    ];

    console.log("📝 Creating permissions...");
    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      });
      console.log(`  ✓ ${perm.name}`);
    }

    // Create SUPER_ADMIN user
    const hashedPassword = await hash("SuperAdmin@123", 12);

    const superAdmin = await prisma.user.upsert({
      where: { email: "admin@ticketbooking.com" },
      update: {},
      create: {
        email: "admin@ticketbooking.com",
        name: "Super Administrator",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log(`\n👤 Super Admin User:`);
    console.log(`  Email: ${superAdmin.email}`);
    console.log(`  Password: SuperAdmin@123`);
    console.log(`  ⚠️  Change this password on first login!`);

    // Create sample admin user
    const adminHashedPassword = await hash("Admin@123", 12);

    const adminUser = await prisma.user.upsert({
      where: { email: "admin1@ticketbooking.com" },
      update: {},
      create: {
        email: "admin1@ticketbooking.com",
        name: "Admin User",
        password: adminHashedPassword,
        role: "ADMIN",
        isActive: true,
        promotedAt: new Date(),
        promotedById: superAdmin.id,
      },
    });

    console.log(`\n👥 Sample Admin User:`);
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Password: Admin@123`);

    // Assign some permissions to sample admin
    const createEventPerm = await prisma.permission.findUnique({
      where: { name: "CREATE_EVENT" },
    });

    const editEventPerm = await prisma.permission.findUnique({
      where: { name: "EDIT_EVENT" },
    });

    if (createEventPerm) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: adminUser.id,
            permissionId: createEventPerm.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          permissionId: createEventPerm.id,
          assignedBy: superAdmin.id,
        },
      });
    }

    if (editEventPerm) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: adminUser.id,
            permissionId: editEventPerm.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          permissionId: editEventPerm.id,
          assignedBy: superAdmin.id,
        },
      });
    }

    console.log(`  ✓ Assigned: CREATE_EVENT, EDIT_EVENT`);

    // Create sample event creator user
    const creatorHashedPassword = await hash("Creator@123", 12);

    await prisma.user.upsert({
      where: { email: "creator@ticketbooking.com" },
      update: {},
      create: {
        email: "creator@ticketbooking.com",
        name: "Event Creator",
        password: creatorHashedPassword,
        role: "EVENT_CREATOR",
        isActive: true,
      },
    });

    console.log(`\n🎭 Sample Event Creator User:`);
    console.log(`  Email: creator@ticketbooking.com`);
    console.log(`  Password: Creator@123`);

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📋 Test Users Created:");
    console.log(`
  1. Super Admin:
     - Email: admin@ticketbooking.com
     - Password: SuperAdmin@123
     - Access: /admin/super/*

  2. Admin:
     - Email: admin1@ticketbooking.com
     - Password: Admin@123
     - Access: /admin/*

  3. Event Creator:
     - Email: creator@ticketbooking.com
     - Password: Creator@123
     - Access: Regular user (no admin access)
    `);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
