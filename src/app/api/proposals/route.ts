import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get proposals for company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only companies can view proposals sent to them
    if ((session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Only companies can view proposals' }, { status: 403 })
    }

    console.log(`📥 Fetching proposals for company: ${session.user.id}`)

    // Get proposals from ChatQuery table where company is the target
    const proposals = await prisma.chatQuery.findMany({
      where: {
        query: {
          startsWith: 'PROPOSAL_TO_'
        },
        extractedCompanies: {
          has: session.user.id
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            major: true,
            graduationYear: true,
            linkedin: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Transform proposals for frontend consumption
    const transformedProposals = proposals.map(proposal => {
      try {
        const proposalData = JSON.parse(proposal.intent || '{}')
        
        return {
          id: proposal.id,
          studentName: proposal.user.name,
          studentEmail: proposal.user.email,
          studentUniversity: proposal.user.university,
          studentMajor: proposal.user.major,
          studentGraduationYear: proposal.user.graduationYear,
          studentLinkedin: proposal.user.linkedin,
          proposalContent: {
            personalIntro: proposalData.proposalContent?.personalIntro || '',
            proudAchievement: proposalData.proposalContent?.proudAchievement || '',
            valueProposition: proposalData.proposalContent?.valueProposition || '',
            specificRole: proposalData.proposalContent?.specificRole || '',
            availability: proposalData.proposalContent?.availability || '',
            portfolio: proposalData.proposalContent?.portfolio || ''
          },
          submittedAt: proposal.timestamp,
          status: proposalData.status || 'new'
        }
      } catch (error) {
        console.error('Error parsing proposal data:', error)
        return null
      }
    }).filter(Boolean) // Remove any null entries from parsing errors

    console.log(`✅ Found ${transformedProposals.length} proposals for company`)

    return NextResponse.json({
      success: true,
      proposals: transformedProposals
    })

  } catch (error) {
    console.error('❌ Error fetching proposals:', error)
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }
}
