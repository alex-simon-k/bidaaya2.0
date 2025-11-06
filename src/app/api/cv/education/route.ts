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
    console.log("📥 Received education data:", body);

    const {
      level,
      program,
      majors,
      minors,
      institution,
      country,
      startDate,
      endDate,
      isCurrent,
      predictedGrade,
      finalGrade,
      gpaValue,
      gpaScale,
      modules,
      awards,
    } = body;

    // Validate required fields
    if (!level || !program || !institution || !country || !startDate) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          required: ["level", "program", "institution", "country", "startDate"],
          received: body
        },
        { status: 400 }
      );
    }

    // Parse dates
    const startDateObj = new Date(startDate + "-01");
    const endDateObj = endDate ? new Date(endDate + "-01") : null;

    // Map new fields to existing Prisma schema fields
    const education = await prisma.cVEducation.create({
      data: {
        userId: session.user.id,
        degreeType: level, // Map level -> degreeType
        degreeTitle: program, // Map program -> degreeTitle
        fieldOfStudy: majors && majors.length > 0 ? majors[0] : program, // Use first major or program
        institution,
        institutionLocation: country, // Map country -> institutionLocation (temporary)
        startDate: startDateObj,
        endDate: endDateObj,
        isCurrent: isCurrent || false,
        predictedGrade: predictedGrade || null,
        finalGrade: finalGrade || null,
        gpa: gpaValue ? parseFloat(gpaValue) : null,
        modules: modules || [],
        courseworkHighlights: [], // Will be populated in Phase III
        honorsAwards: awards || [],
      },
    });

    console.log("✅ Education saved successfully:", education.id);

    return NextResponse.json({
      success: true,
      education,
    });
  } catch (error: any) {
    console.error("❌ Error saving education:", error);
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
