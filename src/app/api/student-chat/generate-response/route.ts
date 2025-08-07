import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

// Enhanced DeepSeek AI for better platform understanding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message: userQuery } = await request.json()

    // Detect intent from user query
    const intent = detectIntent(userQuery)
    console.log(`🤖 AI API call for: ${userQuery}, detected intent: ${intent}`)

    let response

    switch (intent) {
      case 'browse_projects':
        response = await generateProjectRecommendations(userQuery, session.user.id)
        break

      case 'send_proposal':
        // Get company suggestions based on user profile
        const companies = await getCompanySuggestions(session.user.id, userQuery)
        response = await generateCompanyRecommendations(userQuery, companies)
        break

      case 'find_companies':
        response = await generateCompanyGuidance(userQuery)
        break

      case 'general_search':
        response = await generateIntelligentSearch(userQuery, session.user.id)
        break

      case 'help':
        response = generateHelpResponse()
        break

      default:
        response = await generateSmartResponse(userQuery, session.user.id)
        break
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ AI API error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate response',
      actionType: 'error',
      content: 'Sorry, I encountered an error. Please try again or contact support.'
    }, { status: 500 })
  }
}

function detectIntent(userQuery: string): string {
  const query = userQuery.toLowerCase()
  
  if (query.includes('project') || query.includes('internship') || query.includes('job') || query.includes('opportunity')) {
    return 'general_search'
  }
  if (query.includes('company') || query.includes('companies') || query.includes('employer')) {
    return 'find_companies'
  }
  if (query.includes('proposal') || query.includes('apply') || query.includes('contact')) {
    return 'send_proposal'
  }
  if (query.includes('help') || query.includes('how') || query.includes('what')) {
    return 'help'
  }
  
  return 'general_search'
}

async function generateIntelligentSearch(userQuery: string, userId: string) {
  // This is where we'd integrate with DeepSeek API and our database
  // For now, providing smart contextual responses based on query analysis
  
  const queryLower = userQuery.toLowerCase()
  
  // Analyze query for key terms
  const hasMarketing = queryLower.includes('marketing')
  const hasTech = queryLower.includes('tech') || queryLower.includes('software') || queryLower.includes('developer')
  const hasFinance = queryLower.includes('finance') || queryLower.includes('banking') || queryLower.includes('investment')
  const hasInternship = queryLower.includes('internship')
  const hasRemote = queryLower.includes('remote')
  const hasDubai = queryLower.includes('dubai') || queryLower.includes('uae')

  let response = `Great question! Based on what you're looking for, here's what I found on our platform:\n\n`

  if (hasMarketing) {
    response += `📢 Marketing Opportunities:\n`
    response += `• Digital Marketing Intern at PropTech Solutions (Dubai) - 3 months\n`
    response += `• Social Media Marketing at Growth Partners (Remote) - 6 months\n`
    response += `• Brand Marketing Assistant at MedTech Innovations (Abu Dhabi)\n\n`
    
    response += `💡 Companies actively hiring for marketing:\n`
    response += `• DataVision Labs - Looking for growth marketing talent\n`
    response += `• Creative Solutions Hub - Social media and content roles\n`
    response += `• Digital Marketing Co. - Multiple marketing positions\n\n`
  }

  if (hasTech) {
    response += `💻 Tech Opportunities:\n`
    response += `• Software Developer Intern at DataVision Labs (Dubai) - Full-time potential\n`
    response += `• Web Development at Tech Innovations (Remote) - 4 months\n`
    response += `• Data Analyst at FinTech Solutions (Dubai) - 6 months\n\n`
  }

  if (hasFinance) {
    response += `💰 Finance Opportunities:\n`
    response += `• Investment Banking Intern at Growth Partners (Dubai) - 3 months\n`
    response += `• Financial Analyst at FinTech Solutions (Abu Dhabi) - 6 months\n`
    response += `• Accounting Assistant at PropTech Solutions (Dubai) - Part-time\n\n`
  }

  if (hasInternship) {
    response += `🎯 Our internship programs offer:\n`
    response += `• 3-6 month durations with potential for full-time offers\n`
    response += `• Mentorship from industry professionals\n`
    response += `• Real project experience and portfolio building\n`
    response += `• Networking opportunities with top companies\n\n`
  }

  response += `🚀 Next Steps:\n`
  response += `Would you like me to:\n`
  response += `1. Show you detailed information about any of these opportunities?\n`
  response += `2. Help you apply to specific positions?\n`
  response += `3. Suggest companies where you can send direct proposals?\n`
  response += `4. Provide tips for improving your application?\n\n`
  
  response += `Just let me know what interests you most!`

  return {
    actionType: 'search_results',
    content: response
  }
}

async function generateProjectRecommendations(userQuery: string, userId: string) {
  return {
    actionType: 'project_recommendations',
    content: `I'd love to help you find the perfect internship! Let me ask you a few questions to understand what you're looking for:

What type of opportunity interests you most?
• Internship (to gain experience)
• Part-time work (while studying)  
• Full-time position (after graduation)

Also, do you have any preference for:
• Industry (tech, finance, healthcare, marketing, etc.)
• Location (remote, Dubai, Abu Dhabi, etc.)
• Duration (summer, 3-6 months, permanent)

Tell me about your interests and I'll find projects that match perfectly!`
  }
}

async function generateCompanyRecommendations(userQuery: string, companies: any[]) {
  return {
    actionType: 'company_suggestions',
    content: `Excellent choice! Sending direct proposals is a great way to stand out. Let me understand what kind of company you'd like to work for:

What's most important to you in a company?
• Industry focus (AI, fintech, healthcare, etc.)
• Company size (startup, mid-size, large corporation)
• Work culture (innovative, structured, collaborative)
• Growth opportunities (mentorship, skill development)

Also, what type of role are you targeting?
• Technical (developer, analyst, engineer)
• Business (marketing, strategy, operations)
• Creative (design, content, product)

Based on your preferences, I'll suggest companies that would be excited to hear from you!`,
    companies
  }
}

async function generateCompanyGuidance(userQuery: string) {
  return {
    actionType: 'guidance',
    content: `Perfect! I can help you discover companies that align with your goals. Let's narrow it down:

What draws you to certain companies?
• Mission and values that inspire you
• Products or services you're passionate about
• Learning and growth opportunities
• Work-life balance and culture

What's your career stage?
• Just starting out (looking for mentorship)
• Building experience (want to contribute immediately)
• Ready for leadership (seeking responsibility)

Tell me more about your background and interests, and I'll recommend companies where you'd thrive!`
  }
}

function generateHelpResponse() {
  return {
    actionType: 'guidance',
    content: `I'm your personal career assistant! Here's what I can do:

🔍 Find Opportunities
• Search through our database of internships and jobs
• Filter by industry, role type, and location
• Get personalized recommendations based on your profile

🏢 Discover Companies
• Find companies that match your interests
• Learn about company culture and values
• Get insights on what they're looking for

💼 Send Proposals
• Pitch yourself directly to companies
• Access companies not actively hiring
• Stand out with personalized proposals

📊 Credit System
• Free: 5 proposals/month
• Pro: 20 proposals/month (£5)
• Premium: 50 proposals/month (£10)

What would you like to explore first?`
  }
}

async function generateSmartResponse(userQuery: string, userId: string) {
  return await generateIntelligentSearch(userQuery, userId)
}

// Mock company suggestions (in production, this would query your database)
async function getCompanySuggestions(userId: string, query: string) {
  const mockCompanies = [
    {
      id: '1',
      name: 'DataVision Labs',
      industry: 'Technology',
      description: 'AI and data analytics company focused on business intelligence.',
      matchScore: 92
    },
    {
      id: '2', 
      name: 'Growth Partners',
      industry: 'Consulting',
      description: 'Management consulting firm helping startups scale globally.',
      matchScore: 88
    },
    {
      id: '3',
      name: 'MedTech Innovations',
      industry: 'Healthcare',
      description: 'Medical technology company developing healthcare solutions.',
      matchScore: 85
    }
  ]
  
  return mockCompanies
} 