import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's CV data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        cvProfile: true,
        cvEducation: true,
        cvExperience: true,
        cvProjects: true,
        cvSkills: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate CV completeness
    let score = 0;
    const educationCount = user.cvEducation?.length || 0;
    const experienceCount = user.cvExperience?.length || 0;
    const projectsCount = user.cvProjects?.length || 0;
    const skillsCount = user.cvSkills?.length || 0;

    // Profile basics (20 points)
    if (user.cvProfile) {
      score += 20;
    }

    // Education (20 points)
    if (educationCount > 0) {
      score += Math.min(20, educationCount * 10);
    }

    // Experience (25 points)
    if (experienceCount > 0) {
      score += Math.min(25, experienceCount * 12);
    }

    // Projects (20 points)
    if (projectsCount > 0) {
      score += Math.min(20, projectsCount * 10);
    }

    // Skills (15 points)
    if (skillsCount > 0) {
      score += Math.min(15, skillsCount * 3);
    }

    score = Math.min(100, Math.round(score));

    const isMinimumViable = score >= 60 && educationCount > 0 && (experienceCount > 0 || projectsCount > 0);

    // Determine next section to complete
    let nextSection = 'profile';
    if (!user.cvProfile) {
      nextSection = 'profile';
    } else if (educationCount === 0) {
      nextSection = 'education';
    } else if (experienceCount === 0 && projectsCount === 0) {
      nextSection = 'experience';
    } else if (skillsCount === 0) {
      nextSection = 'skills';
    }

    return NextResponse.json({
      overallScore: score,
      isMinimumViable,
      nextSection,
      educationCount,
      experienceCount,
      projectsCount,
      skillsCount,
    });

  } catch (error) {
    console.error('Error fetching CV progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV progress' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

