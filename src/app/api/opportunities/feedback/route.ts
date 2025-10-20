import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      opportunityId, 
      opportunityType,
      mismatchType, 
      mismatchDetails,
      additionalComments 
    } = body;

    if (!opportunityId || !mismatchType) {
      return NextResponse.json({ 
        error: 'Opportunity ID and mismatch type required' 
      }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create feedback record
    const feedbackData: any = {
      userId: user.id,
      opportunityId: opportunityId,
      opportunityType: opportunityType || 'external',
      mismatchType,
      mismatchDetails,
      additionalComments,
    };

    if (opportunityType === 'external') {
      feedbackData.externalOpportunityId = opportunityId;
    } else {
      feedbackData.projectId = opportunityId;
    }

    const feedback = await prisma.opportunityFeedback.create({
      data: feedbackData,
    });

    console.log(`📊 Feedback received: ${mismatchType} for ${opportunityType} ${opportunityId}`);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! This helps us improve our matching.',
      feedbackId: feedback.id,
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get feedback statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get feedback statistics
    const totalFeedback = await prisma.opportunityFeedback.count();
    
    const feedbackByType = await prisma.opportunityFeedback.groupBy({
      by: ['mismatchType'],
      _count: {
        mismatchType: true,
      },
    });

    const recentFeedback = await prisma.opportunityFeedback.findMany({
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            major: true,
            skills: true,
          }
        },
        project: {
          select: {
            title: true,
            skillsRequired: true,
          }
        },
        externalOpportunity: {
          select: {
            title: true,
            company: true,
          }
        }
      }
    });

    return NextResponse.json({
      totalFeedback,
      feedbackByType: feedbackByType.reduce((acc: any, item) => {
        acc[item.mismatchType] = item._count.mismatchType;
        return acc;
      }, {}),
      recentFeedback,
    });

  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

