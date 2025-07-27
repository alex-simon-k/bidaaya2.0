import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with extended data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // Available profile fields from schema
        bio: true,
        location: true,
        university: true,
        major: true,
        graduationYear: true,
        skills: true,
        interests: true,
        companyName: true,
        linkedin: true,
        applicationsThisMonth: true,
        // We'll calculate other stats from relations
        applications: {
          select: {
            status: true,
            createdAt: true
          }
        },
        projects: {
          select: {
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate activity metrics from actual data
    const totalApplications = user.applications.length
    const acceptedApplications = user.applications.filter(app => app.status === 'ACCEPTED').length
    const acceptanceRate = totalApplications > 0 
      ? Math.round((acceptedApplications / totalApplications) * 100) 
      : 0
    
    // Calculate weekly activity based on recent logins (simplified for now)
    const weeklyActivity = Math.min(user.applicationsThisMonth / 4, 7) || 1

    // Calculate Bidaaya level based on projects and activity
    const calculateLevel = (projects: number, activity: number) => {
      const baseLevel = Math.floor(projects / 3) + 1
      const activityBonus = activity >= 5 ? 1 : 0
      return Math.min(baseLevel + activityBonus, 10)
    }

    const profileData = {
      id: user.id,
      name: user.name || '',
      email: user.email,
      profilePicture: null, // Will be added later
      bio: user.bio || '',
      location: user.location || '',
      website: '', // Will be added later
      phone: '', // Will be added later
      title: '', // Will be added later
      company: user.companyName || '',
      university: user.university || '',
      degree: '', // Will be added later
      graduationYear: user.graduationYear,
      major: user.major || '',
      
      // Arrays
      skills: user.skills || [],
      interests: user.interests || [],
      experience: [], // Will be populated from separate experience table in future
      
      // Social links
      socialLinks: {
        linkedin: user.linkedin || '',
        github: '', // Will be added later
        portfolio: '', // Will be added later
        twitter: '' // Will be added later
      },
      
      // Gamification stats
      stats: {
        projectsCompleted: user.projects.filter(p => p.status === 'LIVE').length,
        applicationsSubmitted: totalApplications,
        acceptanceRate: acceptanceRate,
        totalExperience: user.projects.length * 3, // Assume 3 months per project
        bidaayaLevel: calculateLevel(user.projects.length, weeklyActivity),
        badgesEarned: ['early_adopter'], // Will be calculated based on achievements
        lastActiveDate: new Date().toISOString(),
        weeklyActivity: weeklyActivity,
        memberSince: user.createdAt.toISOString()
      },
      
      // Preferences (default values)
      preferences: {
        lookingForWork: true,
        availabilityStatus: 'available' as const,
        remoteWork: true,
        projectTypes: [],
        timeCommitment: 'part-time'
      }
    }

    return NextResponse.json(profileData)

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profileData = await req.json()

         // Update user profile (only update fields that exist in schema)
     const updatedUser = await prisma.user.update({
       where: { email: session.user.email },
       data: {
         name: profileData.name,
         bio: profileData.bio,
         location: profileData.location,
         university: profileData.university,
         major: profileData.major,
         graduationYear: profileData.graduationYear,
         skills: profileData.skills || [],
         interests: profileData.interests || [],
         companyName: profileData.company,
         linkedin: profileData.socialLinks?.linkedin,
         // Update profile completion flag
         profileCompleted: true
       }
     })

    // Return updated profile data
    return GET(req)

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile data' },
      { status: 500 }
    )
  }
}