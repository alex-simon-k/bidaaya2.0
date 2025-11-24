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

    console.log('📊 Fetching application momentum data for user:', user.id);

    // ONLY track when students mark opportunities as "Applied" in the Applications page
    // This is from ExternalOpportunityApplication table
    const opportunityApps = await prisma.externalOpportunityApplication.findMany({
      where: {
        userId: user.id,
        appliedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        appliedAt: true,
        opportunity: {
          select: {
            title: true,
            company: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'asc',
      },
    });

    // Aggregate by date - ONLY count when students mark as "Applied"
    const applicationsByDate = new Map<string, number>();
    
    // Initialize all dates with 0
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      applicationsByDate.set(dateKey, 0);
    }

    // Count applications by date (from when student marked as "Applied")
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

    const totalApps = Array.from(applicationsByDate.values()).reduce((sum, count) => sum + count, 0);
    
    console.log('✅ Application momentum data (from Applications page only):', {
      totalApplicationsMarkedAsApplied: opportunityApps.length,
      totalApplications: totalApps,
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      dataPoints: displayData.length,
      sampleApplications: opportunityApps.slice(0, 3).map(app => ({
        company: app.opportunity.company,
        title: app.opportunity.title,
        appliedAt: app.appliedAt,
      })),
    });

    return NextResponse.json({
      data: displayData,
      goal: user.primaryGoal || 'Get Employed',
      totalApplications: totalApps,
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

