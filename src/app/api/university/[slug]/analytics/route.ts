import { NextRequest, NextResponse } from 'next/server'
import { getInstitutionAnalytics } from '@/lib/institution-analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug) {
      return NextResponse.json(
        { error: 'Institution slug is required' },
        { status: 400 }
      )
    }

    const analytics = await getInstitutionAnalytics(slug)

    if (!analytics) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      )
    }

    // Cache for 5 minutes
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error fetching institution analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
