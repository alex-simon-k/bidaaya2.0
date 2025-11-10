import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth-config";

const prisma = new PrismaClient();

// POST - Create a new skill
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      skillName,
      category,
      proficiency,
      yearsOfExperience,
      evidenceUrl,
    } = body;

    // Validate required fields
    if (!skillName || !category) {
      return NextResponse.json(
        { error: "Missing required fields: skillName, category" },
        { status: 400 }
      );
    }

    // Check if skill already exists for this user
    const existingSkill = await prisma.cVSkill.findUnique({
      where: {
        userId_skillName: {
          userId: session.user.id,
          skillName: skillName,
        },
      },
    });

    if (existingSkill) {
      return NextResponse.json(
        { error: "You've already added this skill. Edit it instead of adding a duplicate." },
        { status: 400 }
      );
    }

    // Create skill entry
    const skill = await prisma.cVSkill.create({
      data: {
        userId: session.user.id,
        skillName,
        category,
        proficiency: proficiency || null,
        yearsOfExperience: yearsOfExperience ? parseFloat(yearsOfExperience) : null,
        evidenceUrl: evidenceUrl || null,
        lastUsed: new Date(), // Set to now by default
      },
    });

    return NextResponse.json({
      success: true,
      skill,
    });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}

// GET - Fetch all skills for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skills = await prisma.cVSkill.findMany({
      where: { userId: session.user.id },
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      success: true,
      skills,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}

