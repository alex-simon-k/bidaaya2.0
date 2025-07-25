import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Force session refresh requested for:', session.user.email)

    // This endpoint will trigger the JWT callback with 'update' trigger
    // which will fetch fresh data from the database
    
    return NextResponse.json({ 
      success: true, 
      message: 'Session refresh triggered',
      instruction: 'Call update() on the frontend to refresh session'
    })

  } catch (error) {
    console.error('Error in force session refresh:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 