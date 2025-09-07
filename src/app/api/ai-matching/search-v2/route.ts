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

    // Get user's subscription tier - CORRECTED TO MATCH ACTUAL SUBSCRIPTION NAMES
    const user = session.user as any
    let tier = 'FREE'
    
    if (user.subscriptionPlan) {
      const subscription = user.subscriptionPlan.toUpperCase()
      if (subscription.includes('BASIC') || subscription.includes('COMPANY_BASIC')) {
        tier = 'BASIC'
      } else if (subscription.includes('BOOSTER') || subscription.includes('HR_BOOSTER')) {
        tier = 'HR_BOOSTER'
      } else if (subscription.includes('AGENT') || subscription.includes('HR_AGENT')) {
        tier = 'HR_AGENT'
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
    
    // Debug: Log actual search results structure
    console.log('🔍 Backend search results debug:')
    console.log(`  - matches array length: ${searchResults.matches?.length || 0}`)
    if (searchResults.matches && searchResults.matches.length > 0) {
      console.log(`  - first match structure:`, Object.keys(searchResults.matches[0]))
      console.log(`  - first match candidate structure:`, searchResults.matches[0].candidate ? Object.keys(searchResults.matches[0].candidate) : 'No candidate field')
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
          currentPlan: 'Free Trial',
          upgrade: {
            plan: 'Company Basic',
            benefits: ['50 contact credits/month', 'Active projects', 'AI shortlisting', 'Interview tools']
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