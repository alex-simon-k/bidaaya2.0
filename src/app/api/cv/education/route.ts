import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      degreeType,
      degreeTitle,
      fieldOfStudy,
      institution,
      institutionLocation,
      startDate,
      endDate,
      isCurrent,
      predictedGrade,
      finalGrade,
      gpa,
      modules,
      courseworkHighlights,
      honorsAwards,
    } = body;

    // Validate required fields
    if (!degreeType || !fieldOfStudy || !institution || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields: degreeType, fieldOfStudy, institution, startDate" },
        { status: 400 }
      );
    }

    // Parse dates
    const startDateObj = new Date(startDate + "-01");
    const endDateObj = endDate ? new Date(endDate + "-01") : null;

    // Create education entry
    const education = await prisma.cVEducation.create({
      data: {
        userId: session.user.id,
        degreeType,
        degreeTitle: degreeTitle || `${degreeType.toUpperCase()} in ${fieldOfStudy}`,
        fieldOfStudy,
        institution,
        institutionLocation: institutionLocation || null,
        startDate: startDateObj,
        endDate: endDateObj,
        isCurrent: isCurrent || false,
        predictedGrade: predictedGrade || null,
        finalGrade: finalGrade || null,
        gpa: gpa || null,
        modules: modules || [],
        courseworkHighlights: courseworkHighlights || [],
        honorsAwards: honorsAwards || [],
      },
    });

    return NextResponse.json({
      success: true,
      education,
    });
  } catch (error: any) {
    console.error("Error saving education:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save education" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const educations = await prisma.cVEducation.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ educations });
  } catch (error: any) {
    console.error("Error fetching education:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch education" },
      { status: 500 }
    );
  }
}

