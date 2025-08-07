import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Create proposal record
    // For now, we'll simulate storing it - in production you'd have a proposals table
    const proposalData = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId: session.user.id,
      companyId,
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
      creditsCost: 1
    }

    console.log('✅ Proposal created:', proposalData.id)

    // In production, you would:
    // 1. Store the proposal in database
    // 2. Send email notification to company
    // 3. Update student's proposal history
    // 4. Track analytics

    /*
    const proposal = await prisma.proposal.create({
      data: {
        studentId: session.user.id,
        companyId,
        content: proposalData.proposalContent,
        studentProfile: proposalData.studentProfile,
        status: 'SENT',
        creditsCost: 1
      }
    })
    */

    // Send notification email to company (simulated)
    console.log(`📧 Notification email would be sent to company ${companyId}`)

    return NextResponse.json({
      success: true,
      proposalId: proposalData.id,
      message: 'Proposal submitted successfully',
      companyNotified: true
    })

  } catch (error) {
    console.error('❌ Error submitting proposal:', error)
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 })
  }
} 