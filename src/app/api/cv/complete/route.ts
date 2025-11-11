import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/cv/complete
 * Returns ALL CV data for the authenticated user:
 * - Profile (from Phase I)
 * - Education
 * - Experience
 * - Projects
 * - Skills
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with Phase I data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        dateOfBirth: true,
        whatsapp: true,
        location: true,
        linkedin: true,
        image: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all CV sections
    const [education, experience, projects, skills] = await Promise.all([
      prisma.cVEducation.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: "desc" },
      }),
      prisma.cVExperience.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: "desc" },
      }),
      prisma.cVProject.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: "desc" },
      }),
      prisma.cVSkill.findMany({
        where: { userId: session.user.id },
        orderBy: { category: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      profile: user,
      education,
      experience,
      projects,
      skills,
    });
  } catch (error) {
    console.error("Error fetching complete CV:", error);
    return NextResponse.json(
      { error: "Failed to fetch CV data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

