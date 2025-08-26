import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only students can submit proposals
    if ((session.user as any).role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit proposals' }, { status: 403 })
    }

    const body = await request.json()
    const {
      companyId,
      personalIntro,
      proudAchievement,
      valueProposition,
      specificRole,
      availability,
      portfolio
    } = body

    console.log(`📝 Proposal submission from ${session.user.id} to company ${companyId}`)

    // Validate required fields
    if (!companyId || !personalIntro || !proudAchievement || !valueProposition || !specificRole || !availability) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 })
    }

    // Get student profile for proposal
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        major: true,
        skills: true,
        bio: true,
        linkedin: true,
        graduationYear: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Create proposal record using ChatQuery table as storage
    // This is a safe approach that doesn't require schema changes
    const proposalData = {
      studentProfile: {
        name: student.name,
        email: student.email,
        university: student.university,
        major: student.major,
        skills: student.skills,
        bio: student.bio,
        linkedin: student.linkedin,
        graduationYear: student.graduationYear
      },
      proposalContent: {
        personalIntro,
        proudAchievement,
        valueProposition,
        specificRole,
        availability,
        portfolio
      },
      status: 'SENT',
      submittedAt: new Date(),
      creditsCost: 1,
      companyId
    }

    // Store proposal as a ChatQuery with special type for proposals
    const proposal = await prisma.chatQuery.create({
      data: {
        userId: session.user.id,
        query: `PROPOSAL_TO_${companyId}`,
        queryType: 'COMPANY_RESEARCH', // Use existing enum value
        intent: JSON.stringify(proposalData), // Store full proposal data
        extractedCompanies: [companyId],
        responseGiven: true,
        timestamp: new Date()
      }
    })

    console.log('✅ Proposal stored with ID:', proposal.id)

    // NOTE: No email is sent automatically when proposal is submitted
    // Companies will see proposals in their inbox and can choose to contact students

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      message: 'Proposal submitted successfully',
      companyNotified: false
    })

  } catch (error) {
    console.error('❌ Error submitting proposal:', error)
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 })
  }
} 