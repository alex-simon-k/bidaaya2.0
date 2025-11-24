import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        primaryGoal: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get date range (last 30 days, but can be adjusted)
    const daysToShow = 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToShow);

    // Fetch all application types
    const [bidaayaApps, externalApps, opportunityApps] = await Promise.all([
      // Bidaaya internal applications
      prisma.application.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // External applications
      prisma.externalApplication.findMany({
        where: {
          userId: user.id,
          appliedDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          appliedDate: true,
        },
        orderBy: {
          appliedDate: 'asc',
        },
      }),
      
      // External opportunity applications
      prisma.externalOpportunityApplication.findMany({
        where: {
          userId: user.id,
          appliedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          appliedAt: true,
        },
        orderBy: {
          appliedAt: 'asc',
        },
      }),
    ]);

    // Aggregate by date
    const applicationsByDate = new Map<string, number>();
    
    // Initialize all dates with 0
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      applicationsByDate.set(dateKey, 0);
    }

    // Count applications by date
    bidaayaApps.forEach(app => {
      const dateKey = app.createdAt.toISOString().split('T')[0];
      applicationsByDate.set(dateKey, (applicationsByDate.get(dateKey) || 0) + 1);
    });

    externalApps.forEach(app => {
      const dateKey = app.appliedDate.toISOString().split('T')[0];
      applicationsByDate.set(dateKey, (applicationsByDate.get(dateKey) || 0) + 1);
    });

    opportunityApps.forEach(app => {
      const dateKey = app.appliedAt.toISOString().split('T')[0];
      applicationsByDate.set(dateKey, (applicationsByDate.get(dateKey) || 0) + 1);
    });

    // Convert to array and format for chart
    const data = Array.from(applicationsByDate.entries()).map(([dateStr, count]) => {
      const date = new Date(dateStr);
      return {
        date: dateStr,
        applications: count,
        displayDate: formatDisplayDate(date, daysToShow),
      };
    });

    // Determine optimal time range based on activity
    const hasRecentActivity = data.slice(-7).some(d => d.applications > 0);
    const displayData = hasRecentActivity ? data.slice(-7) : data.slice(-14);

    return NextResponse.json({
      data: displayData,
      goal: user.primaryGoal || 'Get Employed',
      totalApplications: Array.from(applicationsByDate.values()).reduce((sum, count) => sum + count, 0),
    });

  } catch (error) {
    console.error("❌ Error fetching application momentum:", error);
    return NextResponse.json(
      { error: "Failed to fetch application momentum" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function formatDisplayDate(date: Date, totalDays: number): string {
  if (totalDays <= 7) {
    // Show day of week for weekly view
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (totalDays <= 31) {
    // Show month/day for monthly view
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    // Show month for longer periods
    return date.toLocaleDateString('en-US', { month: 'short' });
  }
}

