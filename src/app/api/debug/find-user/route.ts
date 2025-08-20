import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'alexs@legacyrank.org'

    console.log('🔍 Searching for user with email:', email)

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        terms: true,
        education: true,
        university: true,
        highSchool: true,
        major: true,
        subjects: true,
        interests: true,
        skills: true,
        bio: true,
        profileCompleted: true,
        profileCompletedAt: true,
        phase1CompletedAt: true,
        phase2CompletedAt: true,
        onboardingStepsCompleted: true,
        createdAt: true,
        emailVerified: true,
        emailVerifiedAt: true
      }
    })

    if (!user) {
      // Try searching for similar emails
      const similarUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'alexs' } },
            { email: { contains: 'legacyrank' } },
            { name: { contains: 'Alexander' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          terms: true,
          education: true,
          interests: true,
          profileCompleted: true
        },
        take: 5
      })

      return NextResponse.json({
        success: false,
        message: `User with email ${email} not found`,
        similarUsers,
        totalSimilar: similarUsers.length
      })
    }

    console.log('📊 Found user data:', {
      email: user.email,
      name: user.name,
      terms: user.terms,
      education: user.education,
      interests: user.interests?.length,
      profileCompleted: user.profileCompleted
    })

    return NextResponse.json({
      success: true,
      user,
      analysis: {
        hasBasicProfile: !!(user.name && user.education && user.terms),
        hasEducationBackground: !!(
          user.university?.trim() ||
          user.highSchool?.trim() ||
          user.major?.trim() ||
          user.subjects?.trim() ||
          (user.interests && user.interests.length > 0)
        ),
        fieldStatus: {
          name: { value: user.name, hasValue: !!user.name },
          terms: { value: user.terms, hasValue: !!user.terms, type: typeof user.terms },
          education: { value: user.education, hasValue: !!user.education },
          university: { value: user.university, hasValue: !!user.university },
          highSchool: { value: user.highSchool, hasValue: !!user.highSchool },
          major: { value: user.major, hasValue: !!user.major },
          subjects: { value: user.subjects, hasValue: !!user.subjects },
          interests: { value: user.interests, hasValue: !!(user.interests?.length), length: user.interests?.length },
          skills: { value: user.skills, hasValue: !!(user.skills?.length), length: user.skills?.length }
        }
      }
    })

  } catch (error) {
    console.error('❌ Error searching for user:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
