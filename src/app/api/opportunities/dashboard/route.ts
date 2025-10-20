import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Match score calculation helper
function calculateMatchScore(opportunity: any, userProfile: any): {
  score: number;
  positive: string[];
  warnings: string[];
} {
  const positive: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Check skills match
  const userSkills = userProfile.skills || [];
  const requiredSkills = opportunity.skillsRequired || opportunity.requirements || [];
  
  if (requiredSkills.length > 0) {
    const matchingSkills = userSkills.filter((skill: string) =>
      requiredSkills.some((req: string) => 
        req.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(req.toLowerCase())
      )
    );
    
    const skillMatchRate = matchingSkills.length / requiredSkills.length;
    score += skillMatchRate * 40; // 40 points for skills
    
    if (matchingSkills.length > 0) {
      positive.push(`${matchingSkills.length}/${requiredSkills.length} required skills match`);
    }
    
    if (matchingSkills.length < requiredSkills.length) {
      const missing = requiredSkills.length - matchingSkills.length;
      warnings.push(`Missing ${missing} required skill${missing > 1 ? 's' : ''}`);
    }
  } else {
    score += 20; // Base score if no specific skills required
  }

  // Check major/education alignment
  const userMajor = userProfile.major?.toLowerCase() || '';
  const oppDescription = (opportunity.description || '').toLowerCase();
  const oppTitle = opportunity.title.toLowerCase();
  
  const majorKeywords = userMajor.split(' ');
  const majorMatch = majorKeywords.some((keyword: string) =>
    oppDescription.includes(keyword) || oppTitle.includes(keyword)
  );
  
  if (majorMatch) {
    score += 20;
    positive.push('Your major aligns with this role');
  }

  // Check experience level match
  const userYear = userProfile.graduationYear ? 
    new Date().getFullYear() - userProfile.graduationYear : 0;
  const experienceLevel = opportunity.experienceLevel?.toLowerCase() || 'entry level';
  
  if (experienceLevel.includes('high school') || experienceLevel.includes('entry')) {
    score += 15;
    positive.push('Experience level matches your profile');
  } else if (experienceLevel.includes('intermediate') && userYear >= 1) {
    score += 15;
    positive.push('Experience level matches your profile');
  } else if (experienceLevel.includes('advanced') && userYear < 2) {
    warnings.push('May require more experience than you have');
  }

  // Check location preference
  if (opportunity.remote) {
    score += 10;
    positive.push('Remote opportunity - work from anywhere');
  } else if (opportunity.location && userProfile.location) {
    if (opportunity.location.toLowerCase().includes(userProfile.location.toLowerCase())) {
      score += 10;
      positive.push('Location matches your preference');
    }
  }

  // Check interests alignment
  const userInterests = userProfile.interests || userProfile.goal || [];
  const interestMatch = userInterests.some((interest: string) =>
    oppDescription.includes(interest.toLowerCase()) ||
    oppTitle.includes(interest.toLowerCase())
  );
  
  if (interestMatch) {
    score += 15;
    positive.push('Aligns with your career interests');
  }

  // Ensure score is between 0-100
  score = Math.min(100, Math.max(0, Math.round(score)));

  return { score, positive, warnings };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        earlyAccessUnlocks: {
          include: {
            project: true,
            externalOpportunity: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();

    // Find early access opportunity (Today's Pick)
    // Look for opportunities published in last 48 hours
    const earlyAccessCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Get external opportunities that are new
    const newExternalOpps = await prisma.externalOpportunity.findMany({
      where: {
        isActive: true,
        isNewOpportunity: true,
        publishedAt: {
          gte: earlyAccessCutoff,
        },
        earlyAccessUntil: {
          gte: now,
        }
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 1,
    });

    // Get Bidaaya internal projects (active, approved)
    const bidaayaProjects = await prisma.project.findMany({
      where: {
        status: 'LIVE',
        OR: [
          { applicationDeadline: null },
          { applicationDeadline: { gte: now } }
        ]
      },
      include: {
        company: {
          select: {
            companyName: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Get more, then filter by match
    });

    // Get external opportunities (not early access)
    const externalOpps = await prisma.externalOpportunity.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { isNewOpportunity: false },
              { earlyAccessUntil: { lt: now } },
              { earlyAccessUntil: null }
            ]
          },
          {
            OR: [
              { deadline: null },
              { deadline: { gte: now } }
            ]
          }
        ]
      },
      orderBy: {
        addedAt: 'desc',
      },
      take: 10, // Get more, then filter by match
    });

    // Calculate match scores for all opportunities
    const scoredBidaaya = bidaayaProjects.map(project => {
      const match = calculateMatchScore(project, user);
      return {
        id: project.id,
        title: project.title,
        company: project.company.companyName || project.company.name || 'Bidaaya Partner',
        location: project.location || 'Remote',
        type: 'internal' as const,
        matchScore: match.score,
        matchReasons: {
          positive: match.positive,
          warnings: match.warnings,
        },
      };
    });

    const scoredExternal = externalOpps.map(opp => {
      const match = calculateMatchScore(opp, user);
      return {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        location: opp.location || 'Remote',
        type: 'external' as const,
        matchScore: match.score,
        matchReasons: {
          positive: match.positive,
          warnings: match.warnings,
        },
      };
    });

    // Sort by match score and take top 2 of each
    const topBidaaya = scoredBidaaya
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 2);

    const topExternal = scoredExternal
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 2);

    // Handle early access opportunity
    let earlyAccessOpp = null;
    if (newExternalOpps.length > 0) {
      const opp = newExternalOpps[0];
      const match = calculateMatchScore(opp, user);
      
      // Check if user has already unlocked this
      const hasUnlocked = user.earlyAccessUnlocks.some(
        unlock => unlock.externalOpportunityId === opp.id
      );

      const userPlan = user.subscriptionPlan;
      const isLocked = !hasUnlocked && userPlan === 'FREE';
      
      earlyAccessOpp = {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        location: opp.location || 'Remote',
        type: 'early_access' as const,
        matchScore: match.score,
        matchReasons: {
          positive: match.positive,
          warnings: match.warnings,
        },
        postedAt: opp.publishedAt,
        earlyAccessUntil: opp.earlyAccessUntil,
        isLocked,
        unlockCredits: opp.unlockCredits,
      };
    }

    // Combine all opportunities
    const opportunities = [
      ...(earlyAccessOpp ? [earlyAccessOpp] : []),
      ...topBidaaya,
      ...topExternal,
    ];

    return NextResponse.json({
      opportunities,
      earlyAccessUnlocksRemaining: user.earlyAccessUnlocksRemaining || 0,
      userPlan: user.subscriptionPlan,
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

