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

    // Fetch all external applications for this user (we track external applications)
    const applications = await prisma.externalApplication.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        appliedDate: 'desc',
      },
    });

    // Transform applications to the expected format
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      opportunityId: app.id, // Use the application ID as the opportunity ID
      title: app.jobTitle,
      company: app.company,
      companyLogo: undefined, // External applications don't have logos stored
      location: app.location || 'Unknown',
      type: 'external' as const,
      appliedDate: app.appliedDate,
      status: app.status.toLowerCase(), // Convert enum to lowercase
      matchScore: undefined, // External applications don't have match scores
      notes: app.notes,
      applicationUrl: app.jobUrl,
    }));

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
    const { opportunityTitle, opportunityCompany, opportunityUrl, opportunityLocation, notes } = body;

    if (!opportunityTitle || !opportunityCompany) {
      return NextResponse.json(
        { error: 'Missing required fields: title and company are required' },
        { status: 400 }
      );
    }

    // Check if application already exists for this exact job
    const existingApplication = await prisma.externalApplication.findFirst({
      where: {
        userId: user.id,
        jobTitle: opportunityTitle,
        company: opportunityCompany,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Application already exists for this position' },
        { status: 400 }
      );
    }

    // Create new external application
    const application = await prisma.externalApplication.create({
      data: {
        userId: user.id,
        jobTitle: opportunityTitle,
        company: opportunityCompany,
        jobUrl: opportunityUrl,
        location: opportunityLocation || 'Unknown',
        status: 'APPLIED',
        appliedDate: new Date(),
        notes,
      },
    });

    return NextResponse.json({
      application: {
        id: application.id,
        opportunityId: application.id,
        title: application.jobTitle,
        company: application.company,
        location: application.location,
        type: 'external',
        appliedDate: application.appliedDate,
        status: application.status.toLowerCase(),
        notes: application.notes,
        applicationUrl: application.jobUrl,
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
