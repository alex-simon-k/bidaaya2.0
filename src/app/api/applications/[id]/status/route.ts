import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    if (!status || !['applied', 'interview', 'rejected', 'accepted'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify the application belongs to the user
    const application = await prisma.application.findFirst({
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

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        applicationStatus: status,
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({
      application: {
        id: updatedApplication.id,
        status: updatedApplication.applicationStatus,
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

