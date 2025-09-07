import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { NextGenAITalentMatcher, CreditManager } from '@/lib/ai-talent-matching-v2'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow companies to search
    if (!session?.user || (session.user as any)?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Only companies can search for talent' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, maxResults } = body

    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json({ 
        error: 'Please provide a search prompt (minimum 5 characters)' 
      }, { status: 400 })
    }

    console.log(`🚀 Next-Gen AI Search by ${session.user.id}: "${prompt}"`)
    
    // Check API connectivity
    console.log('🔧 API Configuration Check:')
    console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`)
    console.log(`   DeepSeek API Key: ${process.env.DEEPSEEK_API_KEY ? '✅ Configured' : '❌ Missing'}`)

    // Get user's subscription tier
    const user = session.user as any
    let tier = 'FREE'
    
    if (user.subscriptionPlan) {
      const subscription = user.subscriptionPlan
      if (subscription.includes('PROFESSIONAL') || subscription.includes('PRO')) {
        tier = 'PROFESSIONAL'
      } else if (subscription.includes('ENTERPRISE') || subscription.includes('AGENT')) {
        tier = 'ENTERPRISE'
      }
    }

    console.log(`🎯 Company tier: ${tier}`)

    // Perform next-gen AI search
    console.log(`🔍 Starting NextGenAITalentMatcher.searchTalent...`)
    const searchResults = await NextGenAITalentMatcher.searchTalent({
      prompt: prompt.trim(),
      companyId: session.user.id,
      tier: tier as any,
      maxResults
    })
    
    console.log(`✅ Search completed:`, {
      matchesFound: searchResults.matches?.length || 0,
      candidatesEvaluated: searchResults.searchMetadata?.candidatesEvaluated || 0,
      processingTime: searchResults.searchMetadata?.processingTime || 0,
      hasError: !!searchResults.searchMetadata?.error
    })
    
    if (searchResults.searchMetadata?.error) {
      console.error(`❌ Search metadata error:`, searchResults.searchMetadata.error)
    }

    // Return modern AI search results
    return NextResponse.json({
      success: true,
      data: {
        matches: searchResults.matches,
        metadata: searchResults.searchMetadata,
        credits: searchResults.creditInfo,
        suggestions: searchResults.suggestions,
        upgradeInfo: tier === 'FREE' ? {
          currentPlan: 'FREE',
          upgrade: {
            plan: 'PROFESSIONAL',
            benefits: ['30 credits/month', '25 contacts', '15 results', 'Internal outreach system']
          }
        } : null
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Next-Gen AI Search Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'AI search failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any)?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return company's search history and credit status
    // This would be implemented with database queries
    return NextResponse.json({
      success: true,
      data: {
        recentSearches: [],
        creditStatus: {
          available: 15,
          used: 0,
          tier: 'FREE'
        }
      }
    })

  } catch (error) {
    console.error('❌ Error fetching search data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// Credit and contact reveal endpoint
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any)?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, candidateId, creditsToSpend } = body

    if (action === 'reveal_contact') {
      const result = await CreditManager.revealContact(session.user.id, candidateId)
      
      return NextResponse.json({
        success: result.success,
        data: result.contact,
        creditsRemaining: result.creditsRemaining
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Credit operation error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
} 