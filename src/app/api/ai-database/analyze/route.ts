import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { AIDatabaseAnalyzer } from '@/lib/ai-database-analyzer'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only allow ADMIN or COMPANY users to run database analysis
    if (session.user.role !== 'ADMIN' && session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    console.log(`🔍 Database analysis requested by ${session.user.role}: ${session.user.id}`)

    // Run comprehensive database analysis
    const analysisResult = await AIDatabaseAnalyzer.analyzeDatabase()

    console.log(`✅ Database analysis completed:
    - ${analysisResult.insights.length} field insights generated
    - ${analysisResult.smartTags.length} smart tags created
    - ${analysisResult.recommendations.length} recommendations provided`)

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      summary: {
        fieldsAnalyzed: analysisResult.insights.length,
        tagsGenerated: analysisResult.smartTags.length,
        recommendationsCount: analysisResult.recommendations.length,
        topTags: analysisResult.smartTags
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 10)
          .map(tag => ({ category: tag.category, value: tag.value, frequency: tag.frequency }))
      }
    })

  } catch (error) {
    console.error('❌ Database Analysis Error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze database',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 