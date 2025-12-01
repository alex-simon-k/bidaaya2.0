import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

interface QuestionRequest {
  opportunityId: string
  opportunityTitle: string
  opportunityDescription: string
  opportunityCategory?: string
}

interface GeneratedQuestion {
  id: string
  question: string
  category: string
  relevantFor: string[]
  placeholder: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: QuestionRequest = await request.json()
    const { opportunityId, opportunityTitle, opportunityDescription, opportunityCategory } = body

    console.log('📝 Generating enhancement questions for:', opportunityTitle)

    // Fetch student's existing CV data to identify gaps
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        cvEducation: true,
        cvExperience: true,
        cvProjects: true,
        cvSkills: true,
        cvEnhancements: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Enforce Phase II completion before allowing CV enhancements
    const hasEducation = user.cvEducation.length > 0
    const hasExperience = user.cvExperience.length > 0
    const hasSkills = user.cvSkills.length > 0
    const isPhase2Complete = (hasEducation || hasExperience) && hasSkills

    if (!isPhase2Complete) {
      return NextResponse.json({ 
        error: 'Please complete your CV profile (Phase II) before generating custom CVs',
        code: 'PHASE_2_INCOMPLETE',
        redirectTo: '/dashboard?cv_edit=true'
      }, { status: 403 })
    }

    // Analyze opportunity and student profile to generate targeted questions
    const questions = await generateSmartQuestions(
      {
        opportunityTitle,
        opportunityDescription,
        opportunityCategory: opportunityCategory || '',
      },
      {
        hasExperience: user.cvExperience.length > 0,
        hasProjects: user.cvProjects.length > 0,
        skillsCount: user.cvSkills.length,
        educationCount: user.cvEducation.length,
        existingEnhancements: user.cvEnhancements,
      }
    )

    return NextResponse.json({
      success: true,
      questions,
      opportunityId,
    })

  } catch (error: any) {
    console.error('❌ Question generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate questions',
      details: error.message,
    }, { status: 500 })
  }
}

// Generate smart questions based on opportunity and profile gaps
async function generateSmartQuestions(
  opportunity: { opportunityTitle: string; opportunityDescription: string; opportunityCategory: string },
  profile: {
    hasExperience: boolean
    hasProjects: boolean
    skillsCount: number
    educationCount: number
    existingEnhancements: any[]
  }
): Promise<GeneratedQuestion[]> {
  const questions: GeneratedQuestion[] = []
  
  // Extract keywords from opportunity
  const oppText = `${opportunity.opportunityTitle} ${opportunity.opportunityDescription}`.toLowerCase()
  
  // Determine relevant field
  const field = detectField(oppText)
  
  // Question 1: Always ask about relevant coursework
  if (profile.educationCount > 0) {
    questions.push({
      id: 'q1',
      question: `Have you taken any courses related to ${field} that would be relevant for this ${opportunity.opportunityTitle} role?`,
      category: 'relevant_coursework',
      relevantFor: [field, 'education'],
      placeholder: 'e.g., Marketing Analytics, Consumer Behavior, Digital Marketing Strategy...',
    })
  }

  // Question 2: Ask about projects/assignments if few projects
  if (profile.hasProjects === false || profile.existingEnhancements.filter(e => e.category === 'projects').length === 0) {
    questions.push({
      id: 'q2',
      question: `Any projects, assignments, or case studies you've worked on related to ${field}? (Even academic or personal projects)`,
      category: 'projects',
      relevantFor: [field, 'projects'],
      placeholder: 'Describe what you did, tools you used, and the outcome...',
    })
  }

  // Question 3: Leadership/teamwork for senior roles
  if (oppText.includes('lead') || oppText.includes('senior') || oppText.includes('manage')) {
    questions.push({
      id: 'q3',
      question: 'Any leadership experience, club roles, or team coordination you\'ve done? (Formal or informal)',
      category: 'leadership',
      relevantFor: ['leadership', 'soft_skills'],
      placeholder: 'e.g., Led a student society, coordinated charity events, managed group projects...',
    })
  }

  // Question 4: Extracurriculars or activities
  if (profile.hasExperience === false || questions.length < 3) {
    questions.push({
      id: 'q4',
      question: `Any relevant extracurricular activities, clubs, competitions, or volunteer work related to ${field}?`,
      category: 'achievements',
      relevantFor: [field, 'extracurriculars'],
      placeholder: 'Describe your role and what you accomplished...',
    })
  }

  // Question 5: Specific achievements or metrics
  if (questions.length < 4) {
    questions.push({
      id: 'q5',
      question: 'Any specific achievements, awards, or measurable results you\'re proud of? (Even from your studies)',
      category: 'achievements',
      relevantFor: ['achievements', 'metrics'],
      placeholder: 'e.g., Won hackathon, achieved top grades in relevant subjects, grew club membership by X%...',
    })
  }

  // Return 3-5 questions (prioritize most relevant)
  return questions.slice(0, 5)
}

// Detect field from opportunity text
function detectField(text: string): string {
  const keywords: Record<string, string[]> = {
    'marketing': ['marketing', 'brand', 'social media', 'campaign', 'advertising', 'content', 'seo'],
    'finance': ['finance', 'investment', 'banking', 'trading', 'accounting', 'audit', 'financial'],
    'technology': ['software', 'coding', 'programming', 'developer', 'engineer', 'tech', 'data science', 'ai', 'ml'],
    'consulting': ['consulting', 'strategy', 'advisory', 'management consulting'],
    'sales': ['sales', 'business development', 'account management', 'revenue'],
    'design': ['design', 'ui', 'ux', 'product design', 'graphic', 'creative'],
    'operations': ['operations', 'supply chain', 'logistics', 'process'],
  }

  for (const [field, fieldKeywords] of Object.entries(keywords)) {
    if (fieldKeywords.some(keyword => text.includes(keyword))) {
      return field
    }
  }

  return 'this field' // Fallback
}

