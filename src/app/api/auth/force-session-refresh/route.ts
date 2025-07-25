import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function POST(req: NextRequest) {
  console.log('🔄 ===================== FORCE SESSION REFRESH START =====================');
  
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token || !token.email) {
      console.log('❌ Force session refresh - No valid token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Force session refresh - Valid token found for:', token.email);
    console.log('🔄 Triggering session refresh for user:', token.id);

    // Return success - the frontend should call update() from useSession after this
    return NextResponse.json({ 
      success: true, 
      message: 'Session refresh trigger ready',
      userId: token.id,
      email: token.email
    })
  } catch (error) {
    console.error('❌ Error in force session refresh:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 