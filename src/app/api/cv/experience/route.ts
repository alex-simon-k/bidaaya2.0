import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth-config";

const prisma = new PrismaClient();

// POST - Create a new work experience
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      employer,
      employmentType,
      startDate,
      endDate,
      isCurrent,
      summary,
    } = body;

    // Validate required fields
    if (!title || !employer || !employmentType || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, employer, employmentType, startDate" },
        { status: 400 }
      );
    }

    // Parse dates
    const startDateObj = new Date(startDate + "-01");
    const endDateObj = endDate ? new Date(endDate + "-01") : null;

    // Create experience entry
    const experience = await prisma.cVExperience.create({
      data: {
        userId: session.user.id,
        title,
        employer,
        employmentType,
        startDate: startDateObj,
        endDate: endDateObj,
        isCurrent: isCurrent || false,
        summary: summary || null,
      },
    });

    return NextResponse.json({
      success: true,
      experience,
    });
  } catch (error) {
    console.error("Error creating experience:", error);
    return NextResponse.json(
      { error: "Failed to create experience" },
      { status: 500 }
    );
  }
}

// GET - Fetch all work experiences for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const experiences = await prisma.cVExperience.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      experiences,
    });
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiences" },
      { status: 500 }
    );
  }
}

