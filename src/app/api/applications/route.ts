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

    // Fetch external opportunity applications (from marking opportunities as applied)
    const externalOpportunityApps = await prisma.externalOpportunityApplication.findMany({
      where: {
        userId: user.id,
      },
      include: {
        opportunity: true,
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    // Fetch internal/bidaaya project applications
    const projectApps = await prisma.projectApplication.findMany({
      where: {
        userId: user.id,
      },
      include: {
        project: {
          include: {
            company: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform external opportunity applications
    const formattedExternal = externalOpportunityApps.map((app) => ({
      id: app.id,
      opportunityId: app.externalOpportunityId,
      title: app.opportunity.title,
      company: app.opportunity.company,
      companyLogo: app.opportunity.companyLogoUrl || undefined,
      location: app.opportunity.location || 'Remote',
      type: 'external' as const,
      appliedDate: app.appliedAt,
      status: app.status.toLowerCase() as 'applied' | 'interview' | 'rejected',
      matchScore: undefined,
      notes: app.notes,
      applicationUrl: app.opportunity.applicationUrl,
    }));

    // Transform project applications
    const formattedProjects = projectApps.map((app) => ({
      id: app.id,
      opportunityId: app.projectId,
      title: app.project.title,
      company: app.project.company?.companyName || 'Bidaaya Partner',
      companyLogo: undefined,
      location: app.project.location || 'Remote',
      type: 'internal' as const,
      appliedDate: app.createdAt,
      status: app.status.toLowerCase() as 'applied' | 'interview' | 'rejected',
      matchScore: undefined,
      notes: undefined,
      applicationUrl: undefined,
    }));

    // Combine and sort by date
    const allApplications = [...formattedExternal, ...formattedProjects]
      .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

    console.log(`📊 Applications API: Returning ${allApplications.length} applications (${formattedExternal.length} external + ${formattedProjects.length} internal)`);

    return NextResponse.json({
      applications: allApplications,
      total: allApplications.length,
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
