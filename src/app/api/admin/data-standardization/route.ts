import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { DataStandardizationService } from '@/lib/data-standardization'


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'quality-report') {
      console.log('📊 Generating data quality report...')
      const report = await DataStandardizationService.getDataQualityReport()
      return NextResponse.json(report)
    }

    if (action === 'university-suggestions') {
      const query = searchParams.get('q') || ''
      const suggestions = DataStandardizationService.getUniversitySuggestions(query)
      return NextResponse.json({ suggestions })
    }

    if (action === 'major-suggestions') {
      const query = searchParams.get('q') || ''
      const suggestions = DataStandardizationService.getMajorSuggestions(query)
      return NextResponse.json({ suggestions })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Data standardization API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'standardize-data') {
      console.log('🔄 Starting bulk data standardization...')
      const result = await DataStandardizationService.standardizeExistingData()
      
      return NextResponse.json({
        success: true,
        message: `Standardization complete! Updated ${result.universitiesUpdated} universities and ${result.majorsUpdated} majors.`,
        data: result
      })
    }

    if (action === 'standardize-single') {
      const { type, value } = body
      
      if (type === 'university') {
        const standardized = DataStandardizationService.standardizeUniversity(value)
        return NextResponse.json({ 
          original: value,
          standardized,
          success: !!standardized
        })
      }
      
      if (type === 'major') {
        const standardized = DataStandardizationService.standardizeMajor(value)
        return NextResponse.json({ 
          original: value,
          standardized,
          success: !!standardized
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Data standardization POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
