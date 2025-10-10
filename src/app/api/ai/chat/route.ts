import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationHistory } = await request.json()
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 })

    // Get user context for personalized responses
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        skills: true,
        interests: true,
        major: true,
        university: true,
        graduationYear: true,
        credits: true,
        subscriptionPlan: true,
        applications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: { title: true, category: true }
            }
          }
        }
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Build system prompt with user context
    const systemPrompt = `You are Bidaaya AI, a career advisor for UAE students and professionals.

User Profile:
- Name: ${user.name || 'Student'}
- Skills: ${user.skills?.join(', ') || 'Not specified'}
- Interests: ${user.interests?.join(', ') || 'Not specified'}
- Major: ${user.major || 'Not specified'}
- University: ${user.university || 'Not specified'}
- Graduation Year: ${user.graduationYear || 'Not specified'}
- Available Credits: ${user.credits || 0}
- Subscription: ${user.subscriptionPlan || 'FREE'}
- Recent Applications: ${user.applications?.map(a => a.project.title).join(', ') || 'None'}

Your role is to provide personalized career guidance following these layers:

LAYER 1: Understand their current situation
- Ask clarifying questions about their experiences, goals, and interests
- Help them identify their strengths and areas for improvement

LAYER 2: Identify their career stage and pathway
- Determine if they're exploring, preparing, or actively job hunting
- Suggest appropriate next steps based on their profile

LAYER 3: Provide specific, actionable recommendations
- Suggest relevant opportunities from Bidaaya's database
- Recommend skill development or experience building
- Guide them on applications, CVs, and proposals

Available actions you can suggest:
- Apply to internal Bidaaya projects (costs 5 credits)
- Send proposals to companies (costs 7 credits)  
- Generate custom CV (costs 10 credits)
- Browse external opportunities (free)

Keep responses conversational, encouraging, and specific to their profile. Always mention credit costs when suggesting paid actions.`

    // For now, return a helpful response based on the message
    // TODO: Integrate with actual AI service (DeepSeek, OpenAI, etc.)
    const aiResponse = generateMockResponse(message, user)

    return NextResponse.json({ message: aiResponse })
  } catch (error) {
    console.error('POST /api/ai/chat error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}

// Mock AI response generator (replace with actual AI service)
function generateMockResponse(message: string, user: any): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('internship') || lowerMessage.includes('find')) {
    return `Hi ${user.name || 'there'}! I'd love to help you find internships. Based on your profile (${user.major || 'your field'} at ${user.university || 'your university'}), I can suggest relevant opportunities.

You currently have ${user.credits || 0} credits available. Here's what I can help with:

🔍 **Browse opportunities** (Free) - I can show you external internships that match your interests
📝 **Apply to Bidaaya projects** (5 credits) - Submit applications to our curated internal projects  
💼 **Send company proposals** (7 credits) - Reach out directly to companies you're interested in

What type of internship are you looking for? Any specific industry or role in mind?`
  }
  
  if (lowerMessage.includes('cv') || lowerMessage.includes('resume')) {
    return `I can help you create a custom CV! With ${user.credits || 0} credits available, here's what I can do:

✨ **Custom CV Generation** (10 credits) - I'll create a tailored CV based on:
- Your skills: ${user.skills?.slice(0, 3).join(', ') || 'your background'}
- Your experience and projects
- The specific role you're applying for

This CV will be optimized for UAE employers and ATS systems. Would you like me to generate one for a specific opportunity or role?`
  }
  
  if (lowerMessage.includes('advice') || lowerMessage.includes('help') || lowerMessage.includes('career')) {
    return `I'm here to help with your career journey! As a ${user.major || 'student'} ${user.graduationYear ? `graduating in ${user.graduationYear}` : ''}, here's some personalized advice:

🎯 **Based on your profile:**
- Your skills in ${user.skills?.slice(0, 2).join(' and ') || 'your areas'} are valuable
- Consider exploring ${user.interests?.slice(0, 2).join(' and ') || 'related fields'}

💡 **Next steps I recommend:**
1. Build your portfolio with relevant projects
2. Apply to 2-3 internships that match your interests
3. Network with professionals in your field

What specific area would you like guidance on? Career planning, skill development, or application strategy?`
  }
  
  // Default response
  return `Hi ${user.name || 'there'}! I'm your AI career advisor. I can help you with:

🔍 Finding internships and opportunities
📝 Building custom CVs and applications  
💼 Career planning and advice
🎯 Skill development recommendations

You have ${user.credits || 0} credits available for premium actions. What would you like to explore today?`
}
