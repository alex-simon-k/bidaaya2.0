import { NextRequest, NextResponse } from 'next/server'
import { getBenchmarkAnalytics } from '@/lib/institution-analytics'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const excludeSlug = searchParams.get('excludeSlug') || undefined

    const benchmarkData = await getBenchmarkAnalytics(excludeSlug)

    if (!benchmarkData) {
      return NextResponse.json(
        { error: 'No benchmark data available' },
        { status: 404 }
      )
    }

    // Cache for 5 minutes
    return NextResponse.json(benchmarkData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error fetching benchmark analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch benchmark analytics' },
      { status: 500 }
    )
  }
}

