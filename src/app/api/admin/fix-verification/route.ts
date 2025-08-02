import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admin access
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Admin fixing user verification issues...')
    
    // Find all users who have emails but emailVerified is null
    const usersToFix = await prisma.user.findMany({
      where: {
        emailVerified: null,
        role: { not: 'ADMIN' } // Don't touch admin accounts
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log(`📊 Found ${usersToFix.length} users to fix`)
    
    if (usersToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need fixing!',
        usersFixed: 0,
        users: []
      })
    }
    
    // Set emailVerified to current time (mark as verified now)
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: usersToFix.map(u => u.id) }
      },
      data: {
        emailVerified: new Date()
      }
    })
    
    console.log(`✅ Fixed ${updateResult.count} users`)
    
    // Log the fixed users
    usersToFix.forEach(user => {
      console.log(`📧 Fixed: ${user.email} (${user.role})`)
    })
    
    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${updateResult.count} users`,
      usersFixed: updateResult.count,
      users: usersToFix.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role
      }))
    })
    
  } catch (error) {
    console.error('❌ Error fixing user verification:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fix user verification',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
} 