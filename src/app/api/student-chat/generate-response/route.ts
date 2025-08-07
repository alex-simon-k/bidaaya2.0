import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CompanySuggestion {
  id: string
  name: string
  industry: string
  size: string
  description: string
  openToProposals: boolean
  matchScore: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userQuery, previousMessages } = body

    console.log(`🎓 Student Chat Request: "${userQuery}"`)

    // Detect intent
    const intent = detectIntent(userQuery)
    console.log('🎯 Detected Intent:', intent)

    let response: any = {}

    switch (intent) {
      case 'browse_projects':
        response = {
          actionType: 'browse_projects',
          content: `Great! I'd love to help you find the perfect project. Let me ask you a few questions to understand what you're looking for:

What type of opportunity interests you most?
- Internship (to gain experience)
- Part-time work (while studying)  
- Full-time position (after graduation)

Also, do you have any preference for:
- Industry (tech, finance, healthcare, etc.)
- Location (remote, Dubai, Abu Dhabi, etc.)
- Duration (summer, 6 months, permanent)

Tell me about your interests and I'll find projects that match!`
        }
        break

      case 'send_proposal':
        // Get company suggestions based on user profile
        const companies = await getCompanySuggestions(session.user.id, userQuery)
        response = {
          actionType: 'company_suggestions',
          content: `Excellent choice! Sending direct proposals is a great way to stand out. Let me understand what kind of company you'd like to work for:

What's most important to you in a company?
- Industry focus (AI, fintech, healthcare, etc.)
- Company size (startup, mid-size, large corporation)
- Work culture (innovative, structured, collaborative)
- Growth opportunities (mentorship, skill development)

Also, what type of role are you targeting?
- Technical (developer, analyst, engineer)
- Business (marketing, strategy, operations)
- Creative (design, content, product)

Based on your preferences, I'll suggest companies that would be excited to hear from you!`,
          companies
        }
        break

      case 'find_companies':
        response = {
          actionType: 'guidance',
          content: `Perfect! I can help you discover companies that align with your goals. Let's narrow it down:

What draws you to certain companies?
- Mission and values that inspire you
- Products or services you're passionate about
- Learning and growth opportunities
- Work-life balance and culture

What's your career stage?
- Just starting out (looking for mentorship)
- Building experience (want to contribute immediately)
- Ready for leadership (seeking responsibility)

Tell me more about your background and interests, and I'll recommend companies where you'd thrive!`
        }
        break

      case 'help':
        response = {
          actionType: 'guidance',
          content: `I'm your personal career assistant! Here's what I can do:

Browse Projects
- Find internships and job opportunities
- Filter by industry, role type, and skills
- Get personalized recommendations

Send Direct Proposals
- Pitch yourself to companies proactively
- Access companies not actively hiring
- Stand out with personalized proposals

Career Guidance
- Help improve your profile
- Suggest skill development areas
- Connect you with relevant opportunities

Credit System
- Free: 5 proposals/month
- Pro: 20 proposals/month (£5)
- Premium: 50 proposals/month (£10)

What would you like to start with?`
        }
        break

      default:
        // Try to understand and provide helpful guidance
        const smartResponse = await generateSmartResponse(userQuery, session.user.id)
        response = {
          actionType: 'guidance',
          content: smartResponse
        }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Student chat error:', error)
    return NextResponse.json({
      actionType: 'guidance',
      content: `I apologize, but I encountered an error. Please try asking in a different way, or use one of the quick action buttons above.`
    }, { status: 500 })
  }
}

function detectIntent(query: string): string {
  const queryLower = query.toLowerCase()

  if (queryLower.includes('browse') || queryLower.includes('projects') || queryLower.includes('opportunities') || queryLower.includes('jobs')) {
    return 'browse_projects'
  }
  
  if (queryLower.includes('proposal') || queryLower.includes('pitch') || queryLower.includes('send') || queryLower.includes('apply directly')) {
    return 'send_proposal'
  }
  
  if (queryLower.includes('companies') || queryLower.includes('find') || queryLower.includes('tech') || queryLower.includes('startup')) {
    return 'find_companies'
  }
  
  if (queryLower.includes('help') || queryLower.includes('how') || queryLower.includes('what can you')) {
    return 'help'
  }

  return 'general'
}

async function getCompanySuggestions(userId: string, query: string): Promise<CompanySuggestion[]> {
  // Get user profile to match with companies
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      skills: true,
      interests: true,
      major: true,
      goal: true
    }
  })

  // For now, return some sample companies
  // In production, this would be a sophisticated matching algorithm
  return [
    {
      id: 'comp-tech-1',
      name: 'TechFlow Solutions',
      industry: 'Technology',
      size: '50-100 employees',
      description: 'Innovative fintech startup building next-generation payment solutions.',
      openToProposals: true,
      matchScore: 92
    },
    {
      id: 'comp-consulting-1',
      name: 'Strategy Plus Consulting',
      industry: 'Consulting',
      size: '200-500 employees',
      description: 'Management consulting firm specializing in digital transformation.',
      openToProposals: true,
      matchScore: 87
    },
    {
      id: 'comp-health-1',
      name: 'HealthTech Innovations',
      industry: 'Healthcare',
      size: '20-50 employees',
      description: 'Digital health startup revolutionizing patient care through AI.',
      openToProposals: false,
      matchScore: 78
    }
  ]
}

async function getCompaniesByIndustry(query: string): Promise<CompanySuggestion[]> {
  // Parse industry from query and return relevant companies
  const queryLower = query.toLowerCase()
  
  if (queryLower.includes('tech') || queryLower.includes('software') || queryLower.includes('ai')) {
    return [
      {
        id: 'comp-tech-2',
        name: 'AI Dynamics',
        industry: 'Artificial Intelligence',
        size: '100-200 employees',
        description: 'Leading AI company developing machine learning solutions for enterprises.',
        openToProposals: true,
        matchScore: 95
      },
      {
        id: 'comp-tech-3',
        name: 'CloudScale Systems',
        industry: 'Cloud Computing',
        size: '500+ employees',
        description: 'Enterprise cloud infrastructure provider with global presence.',
        openToProposals: true,
        matchScore: 88
      }
    ]
  }

  // Default companies for other industries
  return getCompanySuggestions('', query)
}

async function generateSmartResponse(query: string, userId: string): Promise<string> {
  // Simple smart response - in production you'd use AI
  const queryLower = query.toLowerCase()

  if (queryLower.includes('credit') || queryLower.includes('upgrade')) {
    return `Student Credit Plans

Free Plan: 5 proposals/month
Pro Plan: 20 proposals/month (£5)
Premium Plan: 50 proposals/month (£10)

Each proposal costs 1 credit. Would you like to upgrade your plan or learn more about sending proposals?`
  }

  if (queryLower.includes('profile') || queryLower.includes('cv') || queryLower.includes('resume')) {
    return `Profile Optimization

A strong profile increases your proposal success rate! Make sure you have:

✓ Complete education details
✓ Relevant skills listed
✓ Clear career goals
✓ Portfolio/project links
✓ Professional photo

Visit your Profile Settings to enhance your profile. Would you like tips for any specific section?`
  }

  return `I'm here to help!

I can assist you with:
- Browse Projects - Find available opportunities
- Send Proposals - Pitch to companies directly
- Find Companies - Discover potential employers
- Profile Help - Optimize your profile

What would you like to do? Try asking "browse projects" or "send proposals" to get started!`
} 