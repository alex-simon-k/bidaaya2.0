import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all applications for the current user
export async function GET(req: NextRequest) {
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

    // Fetch all applications for this user
    const applications = await prisma.application.findMany({
      where: {
        userId: user.id,
      },
      include: {
        project: {
          include: {
            company: true,
          },
        },
        externalOpportunity: true,
      },
      orderBy: {
        appliedDate: 'desc',
      },
    });

    // Transform applications to the expected format
    const formattedApplications = applications.map((app) => {
      const isExternal = !!app.externalOpportunity;
      const opportunity = isExternal ? app.externalOpportunity : app.project;
      
      return {
        id: app.id,
        opportunityId: app.projectId || app.externalOpportunityId || '',
        title: opportunity?.title || 'Unknown Position',
        company: isExternal 
          ? app.externalOpportunity?.company || 'Unknown Company'
          : app.project?.company?.companyName || 'Unknown Company',
        companyLogo: isExternal 
          ? app.externalOpportunity?.companyLogo 
          : app.project?.company?.logoUrl,
        location: opportunity?.location || 'Unknown',
        type: isExternal ? 'external' : 'internal',
        appliedDate: app.appliedDate || app.createdAt,
        status: app.applicationStatus || 'applied',
        matchScore: app.matchScore,
        notes: app.notes,
        applicationUrl: isExternal ? app.externalOpportunity?.applicationUrl : undefined,
      };
    });

    return NextResponse.json({
      applications: formattedApplications,
      total: formattedApplications.length,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST - Create a new application (mark as applied)
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { opportunityId, opportunityType, matchScore, notes } = body;

    if (!opportunityId || !opportunityType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if application already exists
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: user.id,
        ...(opportunityType === 'internal'
          ? { projectId: opportunityId }
          : { externalOpportunityId: opportunityId }),
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Application already exists' },
        { status: 400 }
      );
    }

    // Create new application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        ...(opportunityType === 'internal'
          ? { projectId: opportunityId }
          : { externalOpportunityId: opportunityId }),
        appliedDate: new Date(),
        applicationStatus: 'applied',
        matchScore,
        notes,
      },
      include: {
        project: {
          include: {
            company: true,
          },
        },
        externalOpportunity: true,
      },
    });

    const isExternal = !!application.externalOpportunity;
    const opportunity = isExternal ? application.externalOpportunity : application.project;

    return NextResponse.json({
      application: {
        id: application.id,
        opportunityId: application.projectId || application.externalOpportunityId,
        title: opportunity?.title,
        company: isExternal 
          ? application.externalOpportunity?.company
          : application.project?.company?.companyName,
        companyLogo: isExternal 
          ? application.externalOpportunity?.companyLogo
          : application.project?.company?.logoUrl,
        location: opportunity?.location,
        type: isExternal ? 'external' : 'internal',
        appliedDate: application.appliedDate,
        status: application.applicationStatus,
        matchScore: application.matchScore,
        notes: application.notes,
      },
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
