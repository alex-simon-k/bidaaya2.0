import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/preferences
 * Returns user's agent preferences (commitment level, field, agent active status)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        agentPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse agentPreferences JSON or return defaults
    const preferences = user.agentPreferences
      ? (typeof user.agentPreferences === 'string' 
          ? JSON.parse(user.agentPreferences) 
          : user.agentPreferences)
      : {
          commitmentLevel: 'flexible',
          field: 'any',
          agentActive: false,
        };

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PATCH /api/user/preferences
 * Updates user's agent preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commitmentLevel, field, agentActive } = body;

    // Validate inputs
    const validCommitmentLevels = ['full_time', 'part_time', 'flexible'];
    const validFields = ['technology', 'business', 'marketing', 'design', 'finance', 'consulting', 'engineering', 'any'];

    if (commitmentLevel && !validCommitmentLevels.includes(commitmentLevel)) {
      return NextResponse.json(
        { error: "Invalid commitment level" },
        { status: 400 }
      );
    }

    if (field && !validFields.includes(field)) {
      return NextResponse.json(
        { error: "Invalid field" },
        { status: 400 }
      );
    }

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { agentPreferences: true },
    });

    const currentPreferences = user?.agentPreferences
      ? (typeof user.agentPreferences === 'string'
          ? JSON.parse(user.agentPreferences)
          : user.agentPreferences)
      : {};

    // Merge with new preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...(commitmentLevel && { commitmentLevel }),
      ...(field && { field }),
      ...(agentActive !== undefined && { agentActive }),
    };

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        agentPreferences: updatedPreferences,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

