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
    const { opportunityId, opportunityType } = body;

    if (!opportunityId) {
      return NextResponse.json({ error: 'Opportunity ID required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already unlocked
    const existingUnlock = await prisma.earlyAccessUnlock.findUnique({
      where: {
        userId_opportunityId: {
          userId: user.id,
          opportunityId: opportunityId,
        }
      }
    });

    if (existingUnlock) {
      return NextResponse.json({ 
        success: true,
        message: 'Already unlocked',
        alreadyUnlocked: true 
      });
    }

    // Determine unlock method
    const userPlan = user.subscriptionPlan;
    const hasProPlan = userPlan === 'STUDENT_PRO';
    const hasPremiumPlan = userPlan === 'STUDENT_PREMIUM';
    const hasFreeUnlocks = user.earlyAccessUnlocksRemaining > 0;
    
    let usedCredit = false;
    let updatedUser;

    if (hasProPlan) {
      // STUDENT_PRO gets unlimited early access
      console.log(`✅ STUDENT_PRO user ${user.id} accessing early access (unlimited)`);
      updatedUser = user; // No update needed, they have unlimited access
      usedCredit = false;
    } else if (hasPremiumPlan && hasFreeUnlocks) {
      // STUDENT_PREMIUM with free unlocks remaining - use one
      console.log(`✅ STUDENT_PREMIUM user ${user.id} using free unlock (${user.earlyAccessUnlocksRemaining} left)`);
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          earlyAccessUnlocksRemaining: {
            decrement: 1,
          }
        }
      });
      usedCredit = false;
    } else {
      // Use credits
      const opportunity = opportunityType === 'external' 
        ? await prisma.externalOpportunity.findUnique({ where: { id: opportunityId } })
        : await prisma.project.findUnique({ where: { id: opportunityId } });

      if (!opportunity) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }

      const creditsRequired = (opportunity as any).unlockCredits || 5;

      if (user.credits < creditsRequired) {
        return NextResponse.json({ 
          error: 'Insufficient credits',
          creditsRequired,
          creditsAvailable: user.credits,
        }, { status: 400 });
      }

      // Deduct credits
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            decrement: creditsRequired,
          },
          lifetimeCreditsUsed: {
            increment: creditsRequired,
          }
        }
      });

      // Log credit transaction
      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -creditsRequired,
          type: 'DEDUCTION',
          reason: `Unlocked early access: ${opportunityType === 'external' ? 'External Opportunity' : 'Project'} #${opportunityId}`,
          balanceAfter: updatedUser.credits,
        }
      });

      usedCredit = true;
    }

    // Create unlock record
    const unlockData: any = {
      userId: user.id,
      opportunityId: opportunityId,
      opportunityType: opportunityType || 'external',
      usedCredit,
    };

    if (opportunityType === 'external') {
      unlockData.externalOpportunityId = opportunityId;
    } else {
      unlockData.projectId = opportunityId;
    }

    await prisma.earlyAccessUnlock.create({
      data: unlockData,
    });

    return NextResponse.json({
      success: true,
      message: usedCredit 
        ? 'Unlocked with 5 credits' 
        : hasProPlan 
          ? 'Unlocked with Pro early access (unlimited)' 
          : 'Unlocked with free unlock',
      creditsRemaining: updatedUser.credits,
      earlyAccessUnlocksRemaining: updatedUser.earlyAccessUnlocksRemaining,
      usedCredit,
      usedFreeUnlock: !usedCredit && !hasProPlan,
    });

  } catch (error) {
    console.error('Error unlocking early access:', error);
    return NextResponse.json(
      { error: 'Failed to unlock opportunity' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

