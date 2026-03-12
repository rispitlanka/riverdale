import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "../../../../../lib/models/User";
import bcrypt from "bcrypt";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin@123";

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL }).lean();
  if (existing) {
    return NextResponse.json(
      { message: "Admin user already exists" },
      { status: 200 }
    );
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.create({
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
  });

  return NextResponse.json(
    { message: "Admin user created successfully" },
    { status: 201 }
  );
}

export async function POST() {
  try {
    return await seedAdmin();
  } catch (error: any) {
    console.error("Error seeding admin user", error);
    return NextResponse.json(
      { error: "Failed to seed admin user" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return await seedAdmin();
  } catch (error: any) {
    console.error("Error seeding admin user", error);
    return NextResponse.json(
      { error: "Failed to seed admin user" },
      { status: 500 }
    );
  }
}


