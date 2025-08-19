import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Find users who have interests but no subjects, and incomplete profiles
    const legacyUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profileCompleted: false,
        NOT: {
          interests: null
        },
        OR: [
          { subjects: null },
          { subjects: '' }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        interests: true,
        subjects: true,
        education: true,
        terms: true,
        profileCompleted: true,
        university: true,
        major: true,
        skills: true
      }
    })

    console.log('🔍 Found legacy users with interests but incomplete profiles:', legacyUsers.length)

    let fixed = 0
    let alreadyComplete = 0
    
    for (const user of legacyUsers) {
      // Check if they should be marked as complete based on new logic
      const hasRequiredFields = user.name && 
        (user.university || user.major || user.subjects || user.skills || user.education || user.interests) && 
        user.terms

      if (hasRequiredFields && !user.profileCompleted) {
        // Update their profile to be complete
        await prisma.user.update({
          where: { id: user.id },
          data: {
            profileCompleted: true,
            profileCompletedAt: new Date(),
            // Optionally copy interests to subjects for consistency
            subjects: user.subjects || (Array.isArray(user.interests) ? user.interests.join(', ') : user.interests)
          }
        })
        
        console.log('✅ Fixed profile completion for:', user.email)
        fixed++
      } else if (user.profileCompleted) {
        alreadyComplete++
      } else {
        console.log('⏭️ User still missing required fields:', user.email, {
          name: !!user.name,
          terms: !!user.terms,
          hasEducationInfo: !!(user.university || user.major || user.subjects || user.skills || user.education || user.interests)
        })
      }
    }

    // Also check specifically for the current user's email to ensure it gets fixed
    const currentUserEmail = 'amsmarketingdxb@gmail.com'
    const currentUser = await prisma.user.findUnique({
      where: { email: currentUserEmail },
      select: {
        id: true,
        email: true,
        name: true,
        interests: true,
        subjects: true,
        education: true,
        terms: true,
        profileCompleted: true,
        university: true,
        major: true,
        skills: true
      }
    })

    if (currentUser && !currentUser.profileCompleted) {
      const hasRequiredFields = currentUser.name && 
        (currentUser.university || currentUser.major || currentUser.subjects || currentUser.skills || currentUser.education || currentUser.interests) && 
        currentUser.terms

      if (hasRequiredFields) {
        await prisma.user.update({
          where: { id: currentUser.id },
          data: {
            profileCompleted: true,
            profileCompletedAt: new Date(),
            subjects: currentUser.subjects || (Array.isArray(currentUser.interests) ? currentUser.interests.join(', ') : currentUser.interests)
          }
        })
        
        console.log('✅ Fixed profile completion for current user:', currentUser.email)
        fixed++
      }
    }

    return NextResponse.json({
      message: 'Legacy profile migration completed',
      totalFound: legacyUsers.length,
      fixed,
      alreadyComplete,
      remaining: legacyUsers.length - fixed - alreadyComplete
    })

  } catch (error) {
    console.error('❌ Error in legacy profile migration:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
