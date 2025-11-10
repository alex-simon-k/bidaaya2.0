import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth-config";

const prisma = new PrismaClient();

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      role,
      summary,
      techStack,
      startDate,
      endDate,
      isCurrent,
      projectUrl,
      githubUrl,
    } = body;

    // Validate required fields
    if (!name || !techStack || techStack.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: name, techStack" },
        { status: 400 }
      );
    }

    // Parse dates (optional)
    const startDateObj = startDate ? new Date(startDate + "-01") : null;
    const endDateObj = endDate ? new Date(endDate + "-01") : null;

    // Create project entry
    const project = await prisma.cVProject.create({
      data: {
        userId: session.user.id,
        name,
        role: role || null,
        summary: summary || null,
        techStack: techStack || [],
        startDate: startDateObj,
        endDate: endDateObj,
        isCurrent: isCurrent || false,
        projectUrl: projectUrl || null,
        githubUrl: githubUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// GET - Fetch all projects for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.cVProject.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

