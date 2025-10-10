import { NextRequest, NextResponse } from 'next/server'
import { DataStandardizationService } from '@/lib/data-standardization'


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const query = searchParams.get('q') || ''

    if (type === 'universities') {
      const suggestions = DataStandardizationService.getUniversitySuggestions(query)
      return NextResponse.json({ 
        suggestions: suggestions.map(uni => ({
          id: uni.id,
          name: uni.name,
          shortName: uni.shortName,
          region: uni.region
        }))
      })
    }

    if (type === 'majors') {
      const suggestions = DataStandardizationService.getMajorSuggestions(query)
      return NextResponse.json({ 
        suggestions: suggestions.map(major => ({
          id: major.id,
          name: major.name,
          category: major.category
        }))
      })
    }

    return NextResponse.json({ error: 'Invalid type. Use "universities" or "majors"' }, { status: 400 })

  } catch (error) {
    console.error('❌ Suggestions API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, value } = body

    if (!type || !value) {
      return NextResponse.json({ error: 'Type and value are required' }, { status: 400 })
    }

    if (type === 'university') {
      const standardized = DataStandardizationService.standardizeUniversity(value)
      return NextResponse.json({ 
        original: value,
        standardized,
        isValid: !!standardized
      })
    }

    if (type === 'major') {
      const standardized = DataStandardizationService.standardizeMajor(value)
      return NextResponse.json({ 
        original: value,
        standardized,
        isValid: !!standardized
      })
    }

    return NextResponse.json({ error: 'Invalid type. Use "university" or "major"' }, { status: 400 })

  } catch (error) {
    console.error('❌ Validation API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
