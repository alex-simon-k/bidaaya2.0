import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth-config'
import { interviewAutomation } from '@/lib/interview-automation'


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized - Company access required' }, { status: 401 })
    }

    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const subscription = searchParams.get('subscription') || 'FREE'

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get processed candidates with subscription-based features using the interview automation service
    const candidatesData = await interviewAutomation.getProcessedCandidates(
      projectId, 
      subscription
    )

    return NextResponse.json({
      candidates: candidatesData.candidates,
      totalApplications: candidatesData.totalApplications,
      features: candidatesData.features,
      hasScoring: candidatesData.hasScoring
    })

  } catch (error) {
    console.error('Get candidates error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch candidates',
      candidates: [],
      totalApplications: 0,
      features: {
        canSeeAllApplicants: false,
        canSeeScores: false,
        automatedEmails: false,
        fullInterviewService: false,
        candidatePoolSize: 0,
        manualEmailsOnly: true
      },
      hasScoring: false
    }, { status: 500 })
  }
} 
