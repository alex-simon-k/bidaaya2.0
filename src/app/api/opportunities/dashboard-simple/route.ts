import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with applications
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        earlyAccessUnlocks: {
          select: {
            externalOpportunityId: true,
            projectId: true,
          }
        },
        externalOpportunityApps: {
          select: {
            externalOpportunityId: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();

    // Get IDs of opportunities user has already applied to
    const appliedOpportunityIds = user.externalOpportunityApps.map(app => app.externalOpportunityId);

    // Fetch early access opportunities (NEW - show up to 2)
    const earlyAccessOpps = await prisma.externalOpportunity.findMany({
      where: {
        isActive: true,
        isNewOpportunity: true,
        earlyAccessUntil: { gte: now },
        // Exclude already applied
        NOT: {
          id: {
            in: appliedOpportunityIds.length > 0 ? appliedOpportunityIds : ['']
          }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: 2,
    });

    console.log(`📊 Found ${earlyAccessOpps.length} early access opportunities`);

    // Fetch ALL regular external opportunities (NOT early access)
    const regularOpps = await prisma.externalOpportunity.findMany({
      where: {
        isActive: true,
        OR: [
          { isNewOpportunity: false },
          { earlyAccessUntil: { lt: now } },
        ]
      },
      orderBy: { addedAt: 'desc' },
      take: 200, // Show up to 200 opportunities
    });

    console.log(`📊 Found ${regularOpps.length} regular opportunities`);

    // Format early access opportunities
    const formattedEarlyAccess = earlyAccessOpps.map(opp => {
      const hasUnlocked = user.earlyAccessUnlocks.some(
        unlock => unlock.externalOpportunityId === opp.id
      );
      const isLocked = !hasUnlocked && user.subscriptionPlan !== 'STUDENT_PRO';

      return {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        companyLogo: opp.companyLogoUrl || undefined,
        location: opp.location || 'Remote',
        type: 'early_access' as const,
        matchScore: 90, // Default high score for early access
        matchReasons: {
          positive: ['New opportunity - early access available'],
          warnings: [],
        },
        postedAt: opp.publishedAt,
        postedDate: opp.publishedAt,
        earlyAccessUntil: opp.earlyAccessUntil,
        isLocked,
        unlockCredits: opp.unlockCredits,
        applicationUrl: opp.applicationUrl,
      };
    });

    // Format regular opportunities
    const formattedRegular = regularOpps.map(opp => ({
      id: opp.id,
      title: opp.title,
      company: opp.company,
      companyLogo: opp.companyLogoUrl || undefined,
      location: opp.location || 'Remote',
      type: 'external' as const,
      matchScore: 75, // Default score
      matchReasons: {
        positive: ['Available opportunity'],
        warnings: [],
      },
      postedAt: opp.addedAt,
      postedDate: opp.addedAt,
      deadline: opp.deadline,
      applicationUrl: opp.applicationUrl,
    }));

    // Combine: 2 early access at top, then all regular
    const opportunities = [
      ...formattedEarlyAccess,
      ...formattedRegular,
    ];

    console.log(`📊 Returning ${opportunities.length} total opportunities (${formattedEarlyAccess.length} early access + ${formattedRegular.length} regular)`);

    return NextResponse.json({
      opportunities,
      topMatches: opportunities.slice(0, 50), // Also provide as topMatches for compatibility
      earlyAccessUnlocksRemaining: user.earlyAccessUnlocksRemaining || 0,
      userPlan: user.subscriptionPlan,
      userCredits: user.credits || 0,
    });

  } catch (error) {
    console.error('Error fetching dashboard opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

