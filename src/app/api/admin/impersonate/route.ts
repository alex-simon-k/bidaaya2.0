import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Impersonate a user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify the user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For security, log the impersonation
    console.log(`🔒 Admin ${session.user.email} impersonating ${targetUser.email} (${targetUser.role})`)

    // Note: In a full implementation, you'd need to modify the session
    // This is a simplified approach - in production you'd want to:
    // 1. Store the original admin session
    // 2. Create a temporary session for the target user
    // 3. Add a way to "exit" impersonation mode
    
    // For now, we'll return the user data and let the frontend handle the session update
    return NextResponse.json({
      success: true,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        companyName: targetUser.companyName
      },
      originalAdmin: {
        id: session.user.id,
        email: session.user.email
      }
    })

  } catch (error) {
    console.error('Error impersonating user:', error)
    return NextResponse.json({ error: 'Failed to impersonate user' }, { status: 500 })
  }
}
