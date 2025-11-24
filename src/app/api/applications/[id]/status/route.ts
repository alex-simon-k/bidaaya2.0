import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH - Update application status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const applicationId = params.id;
    const body = await req.json();
    const { status, notes } = body;

    if (!status || !['applied', 'interview', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Map frontend status to database enum values
    const statusMap: Record<string, string> = {
      'applied': 'APPLIED',
      'interview': 'INTERVIEW_SCHEDULED',
      'rejected': 'REJECTED',
    };

    // Verify the application belongs to the user
    // Check ExternalOpportunityApplication (from Applications page)
    const application = await prisma.externalOpportunityApplication.findFirst({
      where: {
        id: applicationId,
        userId: user.id,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update the external opportunity application status
    const updatedApplication = await prisma.externalOpportunityApplication.update({
      where: { id: applicationId },
      data: {
        status: statusMap[status] as any,
        ...(notes !== undefined && { notes }),
      },
    });

    // Map database status back to frontend format
    const statusReverseMap: Record<string, string> = {
      'APPLIED': 'applied',
      'INTERVIEW_SCHEDULED': 'interview',
      'INTERVIEWED': 'interview',
      'REJECTED': 'rejected',
    };

    return NextResponse.json({
      application: {
        id: updatedApplication.id,
        status: statusReverseMap[updatedApplication.status] || updatedApplication.status.toLowerCase(),
        notes: updatedApplication.notes,
      },
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: 'Failed to update application status' },
      { status: 500 }
    );
  }
}

