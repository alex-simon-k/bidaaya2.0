import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from "@/lib/auth-config"


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
      select: {
        id: true,
        name: true,
        email: true,
        terms: true,
        education: true,
        university: true,
        highSchool: true,
        major: true,
        subjects: true,
        interests: true,
        skills: true,
        bio: true,
        profileCompleted: true
      }
    })

    console.log('🔍 DEBUG: Raw database data for', session.user?.email, ':', user)

    return NextResponse.json({
      success: true,
      debug: {
        rawData: user,
        fieldAnalysis: {
          name: { value: user?.name, type: typeof user?.name, hasValue: !!user?.name },
          terms: { value: user?.terms, type: typeof user?.terms, hasValue: !!user?.terms },
          education: { value: user?.education, type: typeof user?.education, hasValue: !!user?.education },
          university: { value: user?.university, type: typeof user?.university, hasValue: !!user?.university },
          highSchool: { value: user?.highSchool, type: typeof user?.highSchool, hasValue: !!user?.highSchool },
          major: { value: user?.major, type: typeof user?.major, hasValue: !!user?.major },
          subjects: { value: user?.subjects, type: typeof user?.subjects, hasValue: !!user?.subjects },
          interests: { value: user?.interests, type: typeof user?.interests, hasValue: !!(user?.interests?.length), length: user?.interests?.length },
          skills: { value: user?.skills, type: typeof user?.skills, hasValue: !!(user?.skills?.length), length: user?.skills?.length }
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
